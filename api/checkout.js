const ASAAS_BASE = 'https://api.asaas.com/api/v3';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, access_token');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const key = process.env.ASAAS_API_KEY;

    if (!key) {
        return res.status(500).json({ error: "CHAVE AUSENTE: Adicione ASAAS_API_KEY na Vercel." });
    }

    try {
        const { action, payload } = req.body || {};
        let endpoint = '';
        let method = 'POST';

        if (action === 'create_customer') endpoint = '/customers';
        else if (action === 'create_payment') endpoint = '/payments';
        else if (action === 'pix_qrcode') {
            endpoint = `/payments/${payload?.paymentId}/pixQrCode`;
            method = 'GET';
        } else {
            return res.status(400).json({ error: 'Ação inválida: ' + action });
        }

        const response = await fetch(ASAAS_BASE + endpoint, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'access_token': key.trim()
            },
            body: method === 'POST' ? JSON.stringify(payload) : null
        });

        const responseText = await response.text();
        let data = {};
        
        try {
            data = responseText ? JSON.parse(responseText) : {};
        } catch (e) {
            return res.status(500).json({ error: "Resposta do Asaas não é JSON", detalhes: responseText });
        }

        if (!response.ok) {
            // Se o Asaas não mandar descrição, mostramos o código técnico (Ex: 401 = Chave Errada)
            const erroTxt = data.errors?.[0]?.description || `Erro Técnico ${response.status}. Verifique se sua chave API é de PRODUÇÃO e se sua conta está ativa.`;
            return res.status(response.status).json({ error: erroTxt });
        }

        return res.status(200).json(data);

    } catch (err) {
        return res.status(500).json({ error: "Falha na Vercel: " + err.message });
    }
}
