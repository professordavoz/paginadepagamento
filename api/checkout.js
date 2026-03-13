const ASAAS_BASE = 'https://api.asaas.com/v3';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, access_token');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const key = process.env.ASAAS_API_KEY;
    const { action, payload } = req.body || {};

    try {
        let url = ASAAS_BASE;
        let method = 'POST';

        // BUSCA DIRETA POR PAGAMENTO JÁ REALIZADO (CPF OU EMAIL)
        if (action === 'check_global') {
            const identificador = payload.cpfCnpj || payload.email;
            url = `${ASAAS_BASE}/payments?status=RECEIVED,CONFIRMED&limit=1`;
            // Se tiver CPF, buscamos por ele, se não, por e-mail
            if (payload.cpfCnpj) url += `&cpfCnpj=${payload.cpfCnpj}`;
            else url += `&email=${payload.email}`;
            method = 'GET';
        }
        else if (action === 'create_customer') url += '/customers';
        else if (action === 'create_payment') url += '/payments';
        else if (action === 'pix_qrcode') {
            url += `/payments/${payload.paymentId}/pixQrCode`;
            method = 'GET';
        }
        else if (action === 'check_status') {
            url += `/payments/${payload.paymentId}`;
            method = 'GET';
        }

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json', 'access_token': key.trim() },
            body: method === 'POST' ? JSON.stringify(payload) : null
        });

        const data = await response.json();
        return res.status(200).json(data);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
