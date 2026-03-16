const fetch = require('node-fetch'); // Adicionado para o motor funcionar

const ASAAS_BASE = (process.env.ASAAS_ENV === 'production') 
  ? 'https://api.asaas.com/v3' 
  : 'https://sandbox.asaas.com/api/v3';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const key = process.env.ASAAS_API_KEY;
  if (!key) return res.status(500).json({ error: 'Falta ASAAS_API_KEY na Vercel' });

  let data = req.body;
  if (typeof data === 'string') { try { data = JSON.parse(data); } catch(e) {} }
  const { action, payload } = data || {};

  try {
    if (!payload && action !== 'check_status') throw new Error("Dados não recebidos");

    if (action === 'create_customer') {
      const b = await asaas(`/customers?cpfCnpj=${payload.cpfCnpj}`, 'GET', null, key);
      if (b.data && b.data.length > 0) return res.json(b.data[0]);
      return res.json(await asaas('/customers', 'POST', payload, key));
    }

    if (action === 'create_payment') return res.json(await asaas('/payments', 'POST', payload, key));
    if (action === 'pix_qrcode') return res.json(await asaas(`/payments/${payload.paymentId}/pixQrCode`, 'GET', null, key));
    
    if (action === 'check_status') {
      const r = await asaas(`/payments/${payload.paymentId}`, 'GET', null, key);
      return res.json({ status: r.status });
    }

    if (action === 'check_global') {
      const cpf = payload.cpfCnpj.replace(/\D/g, '');
      const cust = await asaas(`/customers?cpfCnpj=${cpf}`, 'GET', null, key);
      if (!cust.data || cust.data.length === 0) return res.json({ data: [] });
      const p = await asaas(`/payments?customer=${cust.data[0].id}&status=RECEIVED`, 'GET', null, key);
      return res.json(p);
    }
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

async function asaas(endpoint, method, body, key) {
  const opt = { method, headers: { 'Content-Type': 'application/json', 'access_token': key } };
  if (body) opt.body = JSON.stringify(body);
  const r = await fetch(ASAAS_BASE + endpoint, opt);
  const res = await r.json();
  if (!r.ok) throw new Error(res.errors?.[0]?.description || 'Erro no Asaas');
  return res;
}
