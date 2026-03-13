const ASAAS_BASE = 'https://api.asaas.com/api/v3';

export default async function handler(req, res) {
  // 1. Configurar Headers para evitar bloqueios
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, access_token');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { action, payload } = req.body || {};
    const ASAAS_API_KEY = process.env.ASAAS_API_KEY;

    if (!ASAAS_API_KEY) {
      return res.status(500).json({ error: 'Configuração: ASAAS_API_KEY ausente na Vercel.' });
    }

    let endpoint = '';
    let method = 'POST';

    // Definir rota
    if (action === 'create_customer') endpoint = '/customers';
    else if (action === 'create_payment') endpoint = '/payments';
    else if (action === 'pix_qrcode') {
      endpoint = `/payments/${payload.paymentId}/pixQrCode`;
      method = 'GET';
    } else {
      return res.status(400).json({ error: 'Ação desconhecida: ' + action });
    }

    // Chamada oficial à API do Asaas
    const response = await fetch(ASAAS_BASE + endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'access_token': ASAAS_API_KEY.trim()
      },
      body: method === 'POST' ? JSON.stringify(payload) : null
    });

    // Pegar o texto da resposta para evitar erro de JSON se vier vazio
    const text = await response.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      return res.status(500).json({ error: 'Resposta inválida do Asaas', details: text });
    }

    // Se o Asaas retornar erro (ex: CPF inválido), repassar a mensagem real
    if (!response.ok) {
      const msg = data.errors?.[0]?.description || 'Erro na API do Asaas';
      return res.status(response.status).json({ error: msg });
    }

    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({ error: 'Falha crítica: ' + err.message });
  }
}
