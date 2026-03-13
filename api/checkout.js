const ASAAS_BASE = 'https://api.asaas.com/v3';

export default async function handler(req, res) {
    // Cabeçalhos de permissão (CORS)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, access_token');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const key = process.env.ASAAS_API_KEY;
    
    // Se a chave não estiver na Vercel, o erro 500 acontece aqui
    if (!key) return res.status(500).json({ error: "Chave API_KEY não configurada na Vercel" });

    const { action, payload } = req.body || {};

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
        else if (action === 'check_global') {
            url = `${ASAAS_BASE}/payments?cpfCnpj=${payload.cpfCnpj}&status=RECEIVED,CONFIRMED`;
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
        return res.status(500).json({ error: err.message });
    }
}
