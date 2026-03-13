const ASAAS_BASE = 'https://api.asaas.com/v3';

export default async function handler(req, res) {
    const key = process.env.ASAAS_API_KEY;

    if (!key) {
        return res.status(500).json({ error: "Chave ASAAS_API_KEY não encontrada na Vercel" });
    }

    const { action, payload } = req.body;

    try {
        let url = ASAAS_BASE;
        let method = 'POST';

        if (action === 'create_customer') url += '/customers';
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
            headers: {
                'Content-Type': 'application/json',
                'access_token': key.trim() // O .trim() remove espaços invisíveis que causam erro
            },
            body: method === 'POST' ? JSON.stringify(payload) : null
        });

        const data = await response.json();
        return res.status(200).json(data);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
