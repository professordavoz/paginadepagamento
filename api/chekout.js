// =====================================================================
// api/checkout.js — CORRIGIDO
//
// BUGS CORRIGIDOS:
//  #3 — Padronizado para CommonJS (module.exports) igual ao original
//  #5 — URL da Asaas corrigida: suporta sandbox e produção via env var
//  #8 — check_status agora retorna o status completo para debug no frontend
// =====================================================================

// BUG #5 CORRIGIDO: URL correta por ambiente
// Produção:  https://api.asaas.com/v3         (sem /api/ no meio)
// Sandbox:   https://sandbox.asaas.com/api/v3
const ASAAS_ENV = process.env.ASAAS_ENV || 'sandbox';
const ASAAS_BASE = ASAAS_ENV === 'production'
  ? 'https://api.asaas.com/v3'
  : 'https://sandbox.asaas.com/api/v3';

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
  if (!ASAAS_API_KEY) {
    console.error('[checkout] ASAAS_API_KEY não configurada na Vercel!');
    return res.status(500).json({ error: 'Chave API não configurada' });
  }

  // Garante leitura correta do body em ambiente serverless
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) {
      return res.status(400).json({ error: 'Body inválido: não é JSON' });
    }
  }

  const { action, payload } = body || {};

  if (!action) {
    return res.status(400).json({ error: 'Campo "action" ausente. Body recebido: ' + JSON.stringify(body) });
  }

  console.log(`[checkout] action=${action} env=${ASAAS_ENV} base=${ASAAS_BASE}`);

  try {
    // --- Criar cliente ---
    if (action === 'create_customer') {
      const result = await asaas('/customers', 'POST', payload, ASAAS_API_KEY);
      console.log(`[checkout] Cliente criado: ${result.id}`);
      return res.json(result);
    }

    // --- Criar cobrança PIX ---
    if (action === 'create_payment') {
      const result = await asaas('/payments', 'POST', payload, ASAAS_API_KEY);
      console.log(`[checkout] Pagamento criado: ${result.id} status=${result.status}`);
      return res.json(result);
    }

    // --- Buscar QR Code PIX ---
    if (action === 'pix_qrcode') {
      if (!payload?.paymentId) {
        return res.status(400).json({ error: 'paymentId ausente para pix_qrcode' });
      }
      const result = await asaas(`/payments/${payload.paymentId}/pixQrCode`, 'GET', null, ASAAS_API_KEY);
      return res.json(result);
    }

    // --- BUG #8 CORRIGIDO: check_status agora loga e retorna dados completos ---
    if (action === 'check_status' || action === 'payment_status') {
      if (!payload?.paymentId) {
        return res.status(400).json({ error: 'paymentId ausente para check_status' });
      }
      const r = await asaas(`/payments/${payload.paymentId}`, 'GET', null, ASAAS_API_KEY);
      // Loga para debug nos logs da Vercel
      console.log(`[checkout] Status de ${payload.paymentId}: ${r.status}`);
      // Retorna status E id para o frontend poder validar
      return res.json({ status: r.status, id: r.id });
    }

    // --- Verificar se CPF já pagou (acesso antecipado) ---
    if (action === 'check_global') {
      if (!payload?.cpfCnpj) {
        return res.status(400).json({ error: 'cpfCnpj ausente para check_global' });
      }
      const cpf = payload.cpfCnpj.replace(/\D/g, '');
      const customers = await asaas(`/customers?cpfCnpj=${cpf}`, 'GET', null, ASAAS_API_KEY);
      if (!customers.data || customers.data.length === 0) {
        return res.json({ data: [] });
      }
      const customerId = customers.data[0].id;
      const payments = await asaas(
        `/payments?customer=${customerId}&status=RECEIVED`,
        'GET', null, ASAAS_API_KEY
      );
      return res.json(payments);
    }

    return res.status(400).json({ error: 'Ação desconhecida: ' + action });

  } catch (err) {
    console.error(`[checkout] Erro na action "${action}":`, err.message);
    return res.status(400).json({ error: err.message });
  }
};

// --- Helper: chama a API da Asaas ---
async function asaas(endpoint, method, body, key) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'access_token': key
    }
  };
  if (body) options.body = JSON.stringify(body);

  const url = ASAAS_BASE + endpoint;
  const r = await fetch(url, options);
  const data = await r.json();

  if (!r.ok) {
    const msg = data?.errors?.[0]?.description || data?.error || JSON.stringify(data);
    throw new Error(msg);
  }
  return data;
}
