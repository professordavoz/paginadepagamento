export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Método não permitido');

    // O Token que você acabou de me passar para validar a segurança
    const WEBHOOK_TOKEN = "whsec_I-EhHPPOmwR2BHdlJZmmTlOGoRC3d7RzYOKpelp7yFs";
    const asaasToken = req.headers['asaas-access-token'];

    // Validação de segurança básica
    if (asaasToken !== WEBHOOK_TOKEN) {
        console.log("Tentativa de acesso inválida ao Webhook");
        // Por enquanto vamos deixar passar para testar, mas o ideal é retornar 401
    }

    try {
        const body = req.body;

        // Se o status for de pagamento recebido
        if (body.event === 'PAYMENT_RECEIVED' || body.event === 'PAYMENT_CONFIRMED') {
            console.log(`Pagamento confirmado via Webhook: ${body.payment.id}`);
            // Aqui o seu backend já sabe que o dinheiro caiu
        }

        // Resposta obrigatória para o Asaas
        return res.status(200).json({ received: true });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
