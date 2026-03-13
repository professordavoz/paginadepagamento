const ASAAS_BASE = 'https://api.asaas.com/api/v3';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
  if (!ASAAS_API_KEY) return res.status(500).json({ error: 'Chave API não configurada' });

  const { action, payload } = req.body || {};

  if (!action) {
    return res.status(400).json({ error: 'Body vazio ou inválido. Recebido: ' + JSON.stringify(req.body) });
  }

  try {
    if (action === 'create_customer') {
      return res.json(await asaas('/customers', 'POST', payload, ASAAS_API_KEY));
    }
    if (action === 'create_payment') {
      return res.json(await asaas('/payments', 'POST', payload, ASAAS_API_KEY));
    }
    if (action === 'pix_qrcode') {
      return res.json(await asaas(`/payments/${payload.paymentId}/pixQrCode`, 'GET', null, ASAAS_API_KEY));
    }
    if (action === 'payment_status') {
      const r = await asaas(`/payments/${payload.paymentId}`, 'GET', null, ASAAS_API_KEY);
      return res.json({ status: r.status });
    }
    return res.status(400).json({ error: 'Ação desconhecida: ' + action });

  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

async function asaas(endpoint, method, body, key) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json', 'access_token': key }
  };
  if (body) options.body = JSON.stringify(body);
  const r = await fetch(ASAAS_BASE + endpoint, options);
  const data = await r.json();
  if (!r.ok) throw new Error(data.errors?.[0]?.description || data.error || JSON.stringify(data));
  return data;
}
