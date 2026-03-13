export default async function handler(req, res) {
    // 1. Libera o CORS na hora para o navegador
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, access_token');

    if (req.method === 'OPTIONS') return res.status(200).end();

    // 2. Proteção total: TUDO está dentro do Try-Catch para a Vercel não capotar
    try {
        const key = process.env.ASAAS_API_KEY ? process.env.ASAAS_API_KEY.trim() : null;
        if (!key) return res.status(200).json({ error: "Chave não encontrada na Vercel" });

        // 3. Garante que o body seja legível mesmo se chegar quebrado
        let body = req.body;
        if (typeof body === 'string') {
            try { body = JSON.parse(body); } catch (e) { body = {}; }
        }
        body = body || {};

        const action = body.action;
        const payload = body.payload || {};

        let url = 'https://api.asaas.com/v3';
        let method = 'GET';

        // 4. Checagem de segurança dupla: Só age se a informação existir
        if (action === 'create_customer') {
            url += '/customers';
            method = 'POST';
        } else if (action === 'create_payment') {
            url += '/payments';
            method = 'POST';
        } else if (action === 'pix_qrcode' && payload.paymentId) {
            url += `/payments/${payload.paymentId}/pixQrCode`;
        } else if (action === 'check_status' && payload.paymentId) {
            url += `/payments/${payload.paymentId}`;
        } else if (action === 'check_global' && payload.cpfCnpj) {
            const cpf = String(payload.cpfCnpj).replace(/\D/g, '');
            url += `/payments?cpfCnpj=${cpf}`;
        } else {
            // Se o site mandar algo vazio, ele apenas ignora em vez de dar erro
            return res.status(200).json({ status: "ignorado", message: "Faltam dados para essa ação." });
        }

        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'access_token': key
            }
        };

        if (method === 'POST') options.body = JSON.stringify(payload);

        // 5. Busca no Asaas
        const response = await fetch(url, options);
        
        // 6. Lê a resposta primeiro como texto. Se o Asaas der erro e não mandar JSON, não capota.
        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            data = { status: response.status, erro_bruto: text };
        }

        return res.status(200).json(data);

    } catch (err) {
        // Se qualquer coisa bizarra acontecer, ele entrega um erro civilizado pro seu site
        console.error("Crashed evitado:", err);
        return res.status(500).json({ error: "ERRO_INTERNO", message: err?.message || String(err) });
    }
}
