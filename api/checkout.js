// api/checkout.js — Vercel Serverless Function
// A chave do Asaas fica segura aqui como variável de ambiente

const ASAAS_BASE = 'https://api.asaas.com/api/v3';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
  if (!ASAAS_API_KEY) return res.status(500).json({ error: 'Chave API não configurada' });

  try {
    const { action, payload } = req.body;

    if (action === 'create_customer') {
      const r = await asaas('/customers', 'POST', payload, ASAAS_API_KEY);
      return res.json(r);
    }
    if (action === 'create_payment') {
      const r = await asaas('/payments', 'POST', payload, ASAAS_API_KEY);
      return res.json(r);
    }
    if (action === 'pix_qrcode') {
      const { paymentId } = payload;
      const r = await asaas(`/payments/${paymentId}/pixQrCode`, 'GET', null, ASAAS_API_KEY);
      return res.json(r);
    }
    if (action === 'payment_status') {
      const { paymentId } = payload;
      const r = await asaas(`/payments/${paymentId}`, 'GET', null, ASAAS_API_KEY);
      return res.json({ status: r.status });
    }

    return res.status(400).json({ error: 'Ação desconhecida' });

  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

async function asaas(endpoint, method, body, key) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json', 'access_token': key }
  };
  if (body) options.body = JSON.stringify(body);
  const response = await fetch(ASAAS_BASE + endpoint, options);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.errors?.[0]?.description || data.error || 'Erro no Asaas');
  }
  return data;
}
