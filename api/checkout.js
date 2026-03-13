const ASAAS_BASE = 'https://api.asaas.com/api/v3';

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, access_token');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
        if (!ASAAS_API_KEY) {
            return res.status(500).json({ error: 'Configuração ausente: ASAAS_API_KEY não definida na Vercel.' });
        }

        const { action, payload } = req.body || {};
        if (!action) return res.status(400).json({ error: 'Nenhuma ação foi enviada no corpo da requisição.' });

        let endpoint = '';
        let method = 'POST';

        if (action === 'create_customer') endpoint = '/customers';
        else if (action === 'create_payment') endpoint = '/payments';
        else if (action === 'pix_qrcode') {
            if (!payload?.paymentId) return res.status(400).json({ error: 'paymentId é obrigatório para QR Code.' });
            endpoint = `/payments/${payload.paymentId}/pixQrCode`;
            method = 'GET';
        } else {
            return res.status(400).json({ error: 'Ação desconhecida: ' + action });
        }

        const response = await fetch(ASAAS_BASE + endpoint, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'access_token': ASAAS_API_KEY.trim()
            },
            body: method === 'POST' ? JSON.stringify(payload) : null
        });

        const text = await response.text();
        let data;
        try {
            data = text ? JSON.parse(text) : {};
        } catch (e) {
            return res.status(500).json({ error: 'Resposta da API não é JSON', raw: text });
        }

        if (!response.ok) {
            const msg = data.errors?.[0]?.description || 'Erro na API do Asaas';
            return res.status(response.status).json({ error: msg });
        }

        return res.status(200).json(data);

    } catch (err) {
        return res.status(500).json({ error: 'Erro interno no servidor: ' + err.message });
    }
};
