// =====================================================================
// api/webhook.js — CORRIGIDO
//
// BUGS CORRIGIDOS:
//  #1 — Token lido de variável de ambiente (não hardcoded)
//  #3 — Padronizado para CommonJS (module.exports) — era "export default"
//  #7 — Nenhuma credencial exposta no código-fonte
//
// COMO CONFIGURAR:
//  1. Acesse o painel da Asaas → Configurações → Integrações → Webhooks
//  2. Crie ou edite o webhook apontando para:
//       https://seu-projeto.vercel.app/api/webhook
//  3. Defina um "Token de autenticação" (você escolhe o valor)
//  4. Na Vercel → Settings → Environment Variables, adicione:
//       ASAAS_WEBHOOK_TOKEN = (o mesmo valor que você escolheu acima)
// =====================================================================

module.exports = async function handler(req, res) {
  // Só aceita POST
  if (req.method !== 'POST') {
    return res.status(405).send('Método não permitido');
  }

  // BUG #1 + #7 CORRIGIDO: token vem da env var, nunca do código-fonte
  const WEBHOOK_TOKEN = process.env.ASAAS_WEBHOOK_TOKEN;

  if (!WEBHOOK_TOKEN) {
    console.error('[webhook] ASAAS_WEBHOOK_TOKEN não configurado na Vercel!');
    // Retorna 200 para não travar a Asaas, mas loga o problema
    return res.status(200).json({ status: 'ignorado', motivo: 'token nao configurado' });
  }

  const tokenRecebido = req.headers['asaas-access-token'];

  // BUG #1 CORRIGIDO: valida o token e rejeita se diferente
  if (tokenRecebido !== WEBHOOK_TOKEN) {
    console.warn(`[webhook] Token inválido. Recebido: "${tokenRecebido}" | Esperado: configurado na env`);
    // Retorna 401 para a Asaas saber que a requisição foi rejeitada
    return res.status(401).json({ error: 'Token inválido' });
  }

  try {
    const body = req.body;

    if (!body || !body.event) {
      console.warn('[webhook] Body vazio ou sem campo "event"');
      return res.status(200).json({ status: 'ignorado' });
    }

    console.log(`[webhook] Evento recebido: ${body.event} | Pagamento: ${body.payment?.id}`);

    // ---------------------------------------------------------------
    // Pagamento confirmado — o ponto mais importante do fluxo
    // ---------------------------------------------------------------
    if (body.event === 'PAYMENT_RECEIVED' || body.event === 'PAYMENT_CONFIRMED') {
      const pagamento = body.payment;
      console.log(`[webhook] ✅ Pagamento Aprovado: ${pagamento.id} | Valor: ${pagamento.value} | Cliente: ${pagamento.customer}`);

      // AQUI você pode adicionar lógica extra:
      // - Enviar e-mail de confirmação
      // - Liberar acesso em banco de dados
      // - Chamar outra API
      // Por enquanto apenas loga e confirma para a Asaas
    }

    // A Asaas precisa receber 200 para marcar o webhook como entregue
    return res.status(200).json({ status: 'sucesso', recebido: true });

  } catch (err) {
    console.error('[webhook] Erro no processamento:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
