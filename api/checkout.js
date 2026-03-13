const ASAAS_BASE = 'https://api.asaas.com/api/v3';

module.exports = async function handler(req, res) {
  // Configuração de CORS para permitir chamadas do seu frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Trata requisições de pre-flight (CORS)
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Garante que só aceitamos POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  // Verifica se a chave de API está configurada na Vercel
  const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
  if (!ASAAS_API_KEY) {
    return res.status(500).json({ error: 'Erro de Configuração: Chave ASAAS_API_KEY não encontrada nas variáveis de ambiente da Vercel.' });
  }

  const { action, payload } = req.body || {};

  // Validação básica do corpo da requisição
  if (!action) {
    return res.status(400).json({ 
      error: 'Corpo da requisição inválido ou vazio.',
      received: req.body 
    });
  }

  try {
    let result;

    switch (action) {
      case 'create_customer':
        result = await asaas('/customers', 'POST', payload, ASAAS_API_KEY);
        break;
      
      case 'create_payment':
        result = await asaas('/payments', 'POST', payload, ASAAS_API_KEY);
        break;
      
      case 'pix_qrcode':
        // Nota: payload deve conter o paymentId
        result = await asaas(`/payments/${payload.paymentId}/pixQrCode`, 'GET', null, ASAAS_API_KEY);
        break;
      
      case 'payment_status':
        const statusRes = await asaas(`/payments/${payload.paymentId}`, 'GET', null, ASAAS_API_KEY);
        result = { status: statusRes.status };
        break;

      default:
        return res.status(400).json({ error: 'Ação desconhecida: ' + action });
    }

    return res.status(200).json(result);

  } catch (err) {
    console.error('Erro na API Wrapper:', err.message);
    return res.status(400).json({ 
      error: 'Erro no processamento', 
      details: err.message 
    });
  }
};

/**
 * Função auxiliar para comunicação robusta com o Asaas
 */
async function asaas(endpoint, method, body, key) {
  const options = {
    method,
    headers: { 
      'Content-Type': 'application/json', 
      'access_token': key 
    }
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(ASAAS_BASE + endpoint, options);
    
    // Pegamos a resposta como texto primeiro para evitar o erro "Unexpected end of JSON"
    const responseText = await response.text();
    
    let data;
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      throw new Error(`Resposta do servidor não é um JSON válido: ${responseText.substring(0, 100)}`);
    }

    if (!response.ok) {
      // Tenta extrair a descrição do erro do Asaas
      const errorMessage = data.errors?.[0]?.description || data.error || `Erro HTTP ${response.status}`;
      throw new Error(errorMessage);
    }

    return data;

  } catch (error) {
    throw new Error(error.message);
  }
}
