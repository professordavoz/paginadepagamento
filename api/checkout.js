const ASAAS_BASE = 'https://api.asaas.com/api/v3';

export default async function handler(req, res) {
  // Configuração de Headers para permitir a comunicação com o Frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, access_token');

  // Trata a requisição de segurança (pre-flight)
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Bloqueia qualquer método que não seja POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Use POST.' });
  }

  // Pega a chave das variáveis de ambiente da Vercel
  const key = process.env.ASAAS_API_KEY;

  // TESTE DE CONFIGURAÇÃO: Se o código entrar aqui, o nome da variável na Vercel está errado.
  if (!key) {
    return res.status(500).json({ 
      error: "ERRO DE CONFIGURAÇÃO: A variável ASAAS_API_KEY não foi encontrada na Vercel. Verifique se o nome está correto e se você fez o 'Redeploy'." 
    });
  }

  const { action, payload } = req.body || {};

  try {
    let endpoint = '';
    let method = 'POST';

    // Define qual rota do Asaas será chamada
    if (action === 'create_customer') {
      endpoint = '/customers';
    } else if (action === 'create_payment') {
      endpoint = '/payments';
    } else if (action === 'pix_qrcode') {
      if (!payload?.paymentId) {
        return res.status(400).json({ error: 'ID do pagamento é obrigatório para gerar o QR Code.' });
      }
      endpoint = `/payments/${payload.paymentId}/pixQrCode`;
      method = 'GET';
    } else {
      return res.status(400).json({ error: 'Ação desconhecida: ' + action });
    }

    // Chamada oficial para a API do Asaas
    const response = await fetch(ASAAS_BASE + endpoint, {
      method,
      headers: { 
        'Content-Type': 'application/json', 
        'access_token': key.trim() 
      },
      body: method === 'POST' ? JSON.stringify(payload) : null
    });

    // Pega a resposta bruta como texto para evitar erros de JSON vazio
    const responseText = await response.text();
    let data;

    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      return res.status(500).json({ 
        error: 'A API do Asaas não retornou um JSON válido.', 
        raw: responseText 
      });
    }

    // Se o Asaas retornar erro (ex: CPF inválido), o erro real aparecerá aqui
    if (!response.ok) {
      const msgErro = data.errors?.[0]?.description || 'Erro não identificado no Asaas.';
      return res.status(response.status).json({ 
        error: "RESPOSTA DO ASAAS: " + msgErro 
      });
    }

    // Se tudo der certo, retorna os dados para o Frontend
    return res.status(200).json(data);

  } catch (err) {
    // Captura erros de rede ou falhas inesperadas no código
    return res.status(500).json({ 
      error: "ERRO NO SERVIDOR (BACKEND): " + err.message 
    });
  }
}
