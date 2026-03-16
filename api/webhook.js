module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Apenas POST');

  const WEBHOOK_TOKEN = process.env.ASAAS_WEBHOOK_TOKEN;
  const tokenRecebido = req.headers['asaas-access-token'];

  if (tokenRecebido !== WEBHOOK_TOKEN) return res.status(401).json({ error: 'Token invalido' });

  const body = req.body;
  console.log(`Evento: ${body.event} - Pagamento: ${body.payment?.id}`);

  // Se o pagamento foi confirmado, o sistema registra aqui
  if (body.event === 'PAYMENT_RECEIVED' || body.event === 'PAYMENT_CONFIRMED') {
     // Aqui você pode adicionar a chamada para liberar no Supabase se desejar
     console.log("PAGAMENTO APROVADO NO WEBHOOK");
  }

  return res.status(200).json({ status: 'ok' });
};
