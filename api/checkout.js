const ASAAS_BASE = 'https://api.asaas.com/api/v3';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, access_token');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
  if (!ASAAS_API_KEY) return res.status(500).json({ error: 'Chave API não encontrada na Vercel' });

  const { action, payload } = req.body || {};

  try {
    let endpoint = '';
    let method = 'POST';

    if (action === 'create_customer') endpoint = '/customers';
    else if (action === 'create_payment') endpoint = '/payments';
    else if (action === 'pix_qrcode') {
      endpoint = `/payments/${payload.paymentId}/pixQrCode`;
      method = 'GET';
    }

    const response = await fetch(ASAAS_BASE + endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'access_token': ASAAS_API_KEY.trim()
      },
      body: method === 'POST' ? JSON.stringify(payload) : null
    });

    const data = await response.json();

    if (!response.ok) {
      // ESTA LINHA É A CHAVE: Ela vai nos dizer o erro real (Ex: "CPF inválido", "Email já existe")
      const msgErro = data.errors?.[0]?.description || JSON.stringify(data);
      return res.status(400).json({ error: msgErro });
    }

    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({ error: 'Erro interno: ' + err.message });
  }
};
