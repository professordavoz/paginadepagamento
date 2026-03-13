module.exports = async function handler(req, res) {
    // 1. Libera o CORS na hora (Evita o "Erro no network")
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, access_token');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const key = process.env.ASAAS_API_KEY ? process.env.ASAAS_API_KEY.trim() : null;
    if (!key) return res.status(200).json({ error: "Chave ausente" });

    // 2. O PULO DO GATO: Força a leitura dos dados mesmo se o site mandar como texto
    let body = req.body;
    if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch(e) { body = {}; }
    }
    body = body || {};

    const action = body.action;
    const payload = body.payload || {};

    let url = 'https://api.asaas.com/v3';
    let method = 'GET';

    if (action === 'create_customer') { 
        url += '/customers'; method = 'POST'; 
    } else if (action === 'create_payment') { 
        url += '/payments'; method = 'POST'; 
    } else if (action === 'pix_qrcode' && payload.paymentId) { 
        url += `/payments/${payload.paymentId}/pixQrCode`; 
    } else if (action === 'check_status' && payload.paymentId) { 
        url += `/payments/${payload.paymentId}`; 
    } else if (action === 'check_global' && payload.cpfCnpj) {
        const cpf = String(payload.cpfCnpj).replace(/\D/g, '');
        url += `/payments?cpfCnpj=${cpf}`;
    } else {
        // Se cair aqui, o checkout não mandou a "action"
        return res.status(200).json({ status: "ignorado", recebido: body });
    }

    try {
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
        return res.status(200).json({ error: "Erro de comunicação", msg: err.message });
    }
};
