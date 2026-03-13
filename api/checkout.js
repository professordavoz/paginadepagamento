export default async function handler(req, res) {
    // Configuração de CORS para o navegador não bloquear
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, access_token');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const key = process.env.ASAAS_API_KEY ? process.env.ASAAS_API_KEY.trim() : null;

    if (!key) {
        return res.status(200).json({ error: "ERRO_CHAVE_FALTANDO" });
    }

    const { action, payload } = req.body || {};

    try {
        let url = 'https://api.asaas.com/v3';
        let method = 'GET';

        if (action === 'create_customer') { url += '/customers'; method = 'POST'; }
        else if (action === 'create_payment') { url += '/payments'; method = 'POST'; }
        else if (action === 'pix_qrcode') { url += `/payments/${payload.paymentId}/pixQrCode`; }
        else if (action === 'check_status') { url += `/payments/${payload.paymentId}`; }
        else if (action === 'check_global') { url += `/payments?cpfCnpj=${payload.cpfCnpj}`; }

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'access_token': key
            },
            body: method === 'POST' ? JSON.stringify(payload) : null
        });

        const data = await response.json();
        return res.status(200).json(data);

    } catch (err) {
        // Retorna um JSON mesmo em caso de erro para não dar o erro do seu print
        return res.status(200).json({ error: "ERRO_INTERNO", message: err.message });
    }
}
