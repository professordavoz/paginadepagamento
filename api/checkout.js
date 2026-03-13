export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, access_token');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const key = process.env.ASAAS_API_KEY ? process.env.ASAAS_API_KEY.trim() : null;

    if (!key) return res.status(500).json({ error: "ASAAS_API_KEY faltando" });

    const { action, payload } = req.body || {};
    let url = 'https://api.asaas.com/v3';
    let method = 'GET';

    try {
        if (action === 'create_customer') { url += '/customers'; method = 'POST'; }
        else if (action === 'create_payment') { url += '/payments'; method = 'POST'; }
        else if (action === 'pix_qrcode') { url += `/payments/${payload.paymentId}/pixQrCode`; }
        else if (action === 'check_status') { url += `/payments/${payload.paymentId}`; }
        else if (action === 'check_global') { 
            const cpf = payload.cpfCnpj.replace(/\D/g, '');
            url += `/payments?cpfCnpj=${cpf}`; 
        }

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'access_token': key
            },
            body: method === 'POST' ? JSON.stringify(payload) : null
        });

        return res.status(200).json(await response.json());

    } catch (err) {
        return res.status(500).json({ error: "ERRO_SERVIDOR", message: err.message });
    }
}
