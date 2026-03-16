const ASAAS_BASE = (process.env.ASAAS_ENV === 'production') 
  ? 'https://api.asaas.com/v3' 
  : 'https://sandbox.asaas.com/api/v3';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
  if (!ASAAS_API_KEY) return res.status(500).json({ error: 'Chave API não configurada na Vercel' });

  // BUG DO CPF CORRIGIDO: Garante que o body seja lido corretamente
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch(e) {} }
  const { action, payload } = body || {};

  try {
    if (action === 'create_customer') {
      // BUSCA ANTES DE CRIAR: Evita o erro de CPF já existente
      const busca = await asaas(`/customers?cpfCnpj=${payload.cpfCnpj}`, 'GET', null, ASAAS_API_KEY);
      if (busca.data && busca.data.length > 0) return res.json(busca.data[0]);
      
      return res.json(await asaas('/customers', 'POST', payload, ASAAS_API_KEY));
    }

    if (action === 'create_payment') {
      return res.json(await asaas('/payments', 'POST', payload, ASAAS_API_KEY));
    }

    if (action === 'pix_qrcode') {
      return res.json(await asaas(`/payments/${payload.paymentId}/pixQrCode`, 'GET', null, ASAAS_API_KEY));
    }

    if (action === 'check_status') {
      const r = await asaas(`/payments/${payload.paymentId}`, 'GET', null, ASAAS_API_KEY);
      return res.json({ status: r.status });
    }

    if (action === 'check_global') {
      const cpf = payload.cpfCnpj.replace(/\D/g, '');
      const customers = await asaas(`/customers?cpfCnpj=${cpf}`, 'GET', null, ASAAS_API_KEY);
      if (!customers.data || customers.data.length === 0) return res.json({ data: [] });
      const payments = await asaas(`/payments?customer=${customers.data[0].id}&status=RECEIVED`, 'GET', null, ASAAS_API_KEY);
      return res.json(payments);
    }

    return res.status(400).json({ error: 'Acao desconhecida' });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

async function asaas(endpoint, method, body, key) {
  const options = { method, headers: { 'Content-Type': 'application/json', 'access_token': key } };
  if (body) options.body = JSON.stringify(body);
  const r = await fetch(ASAAS_BASE + endpoint, options);
  const data = await r.json();
  if (!r.ok) throw new Error(data.errors?.[0]?.description || 'Erro no Asaas');
  return data;
}
