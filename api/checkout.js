export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, access_token');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const key = process.env.ASAAS_API_KEY;
    const { action, payload } = req.body || {};

    if (!key) return res.status(200).json({ error: "Chave não configurada na Vercel." });

    try {
        let url = 'https://api.asaas.com/api/v3';
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
                'access_token': key.trim()
            },
            body: method === 'POST' ? JSON.stringify(payload) : null
        });

        const data = await response.json();
        return res.status(200).json(data);

    } catch (err) {
        return res.status(200).json({ error: err.message });
    }
}
