export default async function handler(req, res) {
    // O Asaas envia os dados via POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Método não permitido" });
    }

    try {
        const body = req.body;
        console.log("Evento do Asaas recebido:", body.event);

        // Verificamos se o pagamento foi confirmado
        if (body.event === 'PAYMENT_RECEIVED' || body.event === 'PAYMENT_CONFIRMED') {
            const paymentId = body.payment.id;
            const emailCliente = body.payment.email;

            // Aqui você sabe que o cliente PAGOU.
            console.log(`PAGAMENTO APROVADO: ${paymentId} - Cliente: ${emailCliente}`);
        }

        // Resposta obrigatória (Status 200) para o Asaas não marcar como erro
        return res.status(200).json({ received: true });

    } catch (err) {
        console.error("Erro no Webhook:", err.message);
        return res.status(500).json({ error: err.message });
    }
}
