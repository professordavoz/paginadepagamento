const https = require('https');

export default function handler(req, res) {
    // Libera o acesso para o navegador não bloquear nada
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, access_token');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const key = process.env.ASAAS_API_KEY ? process.env.ASAAS_API_KEY.trim() : null;
    const { action, payload } = req.body || {};

    let path = '/v3';
    let method = 'GET';

    // Define o caminho correto baseado na ação do site
    if (action === 'create_customer') { path += '/customers'; method = 'POST'; }
    else if (action === 'create_payment') { path += '/payments'; method = 'POST'; }
    else if (action === 'pix_qrcode') { path += `/payments/${payload.paymentId}/pixQrCode`; }
    else if (action === 'check_status') { path += `/payments/${payload.paymentId}`; }
    else if (action === 'check_global') { path += `/payments?cpfCnpj=${payload.cpfCnpj}&status=RECEIVED,CONFIRMED`; }

    const options = {
        hostname: 'api.asaas.com',
        path: path,
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'access_token': key
        }
    };

    const request = https.request(options, (response) => {
        let data = '';
        response.on('data', (chunk) => { data += chunk; });
        response.on('end', () => {
            try {
                res.status(200).json(JSON.parse(data));
            } catch (e) {
                res.status(200).json({ status: "ok", raw: data });
            }
        });
    });

    request.on('error', (err) => {
        res.status(500).json({ error: err.message });
    });

    if (method === 'POST' && payload) {
        request.write(JSON.stringify(payload));
    }
    request.end();
}
