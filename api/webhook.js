module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Método não permitido');

    const ASAAS_TOKEN = process.env.ASAAS_WEBHOOK_TOKEN;
    const authHeader = req.headers['asaas-access-token'];

    if (ASAAS_TOKEN && authHeader !== ASAAS_TOKEN) {
        return res.status(401).json({ error: 'Token inválido' });
    }

    const { event, payment } = req.body;
    console.log(`Webhook recebido: ${event} para o pagamento ${payment?.id}`);

    // Resposta imediata para o Asaas
    res.status(200).json({ received: true });

    if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
        // Lógica de liberação de curso ou registro em banco de dados aqui
    }
};
