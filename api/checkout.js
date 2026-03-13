export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, access_token');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const ASAAS_KEY = process.env.ASAAS_API_KEY;
    const { action, payload } = req.body || {};

    if (!ASAAS_KEY) return res.status(200).json({ error: "Configuração: ASAAS_API_KEY ausente na Vercel." });

    try {
        let url = 'https://api.asaas.com/v3';
        let method = 'POST';

        if (action === 'create_customer') url += '/customers';
        else if (action === 'create_payment') url += '/payments';
        else if (action === 'pix_qrcode') {
            url += `/payments/${payload.paymentId}/pixQrCode`;
            method = 'GET';
        }

        const response = await fetch(url, {
            method,
            headers: { 
                'Content-Type': 'application/json', 
                'access_token': ASAAS_KEY.trim() 
            },
            body: method === 'POST' ? JSON.stringify(payload) : null
        });

        const data = await response.json();

        if (!response.ok) {
            const msg = data.errors ? data.errors[0].description : "Erro na API do Asaas";
            return res.status(400).json({ error: msg });
        }

        return res.status(200).json(data);

    } catch (err) {
        return res.status(500).json({ error: "Falha no servidor: " + err.message });
    }
}
