const ASAAS_BASE = 'https://api.asaas.com/api/v3';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
  if (!ASAAS_API_KEY) return res.status(500).json({ error: 'Chave API não configurada na Vercel' });

  const { action, payload } = req.body || {};
  if (!action) return res.status(400).json({ error: 'Ação não informada' });

  try {
    let result;
    if (action === 'create_customer') result = await asaas('/customers', 'POST', payload, ASAAS_API_KEY);
    else if (action === 'create_payment') result = await asaas('/payments', 'POST', payload, ASAAS_API_KEY);
    else if (action === 'pix_qrcode') result = await asaas(`/payments/${payload.paymentId}/pixQrCode`, 'GET', null, ASAAS_API_KEY);
    else return res.status(400).json({ error: 'Ação desconhecida' });

    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

async function asaas(endpoint, method, body, key) {
  const options = { method, headers: { 'Content-Type': 'application/json', 'access_token': key } };
  if (body) options.body = JSON.stringify(body);
  const r = await fetch(ASAAS_BASE + endpoint, options);
  const text = await r.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch (e) { throw new Error("Erro no JSON do Asaas"); }
  if (!r.ok) throw new Error(data.errors?.[0]?.description || "Erro no Asaas");
  return data;
}
