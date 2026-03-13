const ASAAS_BASE = 'https://api.asaas.com/api/v3';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, access_token');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const key = process.env.ASAAS_API_KEY;
  if (!key) return res.status(500).json({ error: "ERRO: ASAAS_API_KEY não configurada na Vercel." });

  try {
    const { action, payload } = req.body || {};
    let endpoint = '';
    let method = 'POST';

    if (action === 'create_customer') endpoint = '/customers';
    else if (action === 'create_payment') endpoint = '/payments';
    else if (action === 'pix_qrcode') {
      endpoint = `/payments/${payload?.paymentId}/pixQrCode`;
      method = 'GET';
    }

    const response = await fetch(ASAAS_BASE + endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'access_token': key.trim()
      },
      body: method === 'POST' ? JSON.stringify(payload) : null
    });

    const data = await response.json();

    if (!response.ok) {
      const msg = data.errors?.[0]?.description || `Erro Asaas: ${response.status}`;
      return res.status(response.status).json({ error: msg });
    }

    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({ error: "Erro interno: " + err.message });
  }
}
