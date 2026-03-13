import https from 'https';

export default function handler(req, res) {
    // 1. Libera o acesso para o navegador na hora
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, access_token');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const key = process.env.ASAAS_API_KEY ? process.env.ASAAS_API_KEY.trim() : null;

    if (!key) {
        return res.status(200).json({ error: "Chave ausente na Vercel" });
    }

    const body = req.body || {};
    const action = body.action;
    const payload = body.payload || {};

    let path = '/v3';
    let method = 'GET';

    // 2. Monta o caminho correto para o Asaas
    if (action === 'create_customer') { path += '/customers'; method = 'POST'; }
    else if (action === 'create_payment') { path += '/payments'; method = 'POST'; }
    else if (action === 'pix_qrcode' && payload.paymentId) { path += `/payments/${payload.paymentId}/pixQrCode`; }
    else if (action === 'check_status' && payload.paymentId) { path += `/payments/${payload.paymentId}`; }
    else if (action === 'check_global' && payload.cpfCnpj) {
        const cpf = String(payload.cpfCnpj).replace(/\D/g, '');
        path += `/payments?cpfCnpj=${cpf}`;
    } else {
        return res.status(200).json({ status: "ignorado" });
    }

    const options = {
        hostname: 'api.asaas.com',
        path: path,
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'access_token': key
        }
    };

    // 3. Comunicação raiz via HTTPS (Não depende do fetch)
    const request = https.request(options, (response) => {
        let data = '';
        response.on('data', (chunk) => { data += chunk; });
        response.on('end', () => {
            try {
                // Tenta transformar a resposta em JSON
                res.status(200).json(JSON.parse(data));
            } catch (e) {
                // Se o Asaas mandar HTML ou der erro, o site não trava
                res.status(200).json({ error: "Erro de conversão", raw: data });
            }
        });
    });

    request.on('error', (err) => {
        res.status(200).json({ error: "Erro de requisição", message: err.message });
    });

    if (method === 'POST') {
        request.write(JSON.stringify(payload));
    }
    
    request.end();
}
