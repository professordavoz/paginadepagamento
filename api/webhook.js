export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Método não permitido');

    const body = req.body;

    // Quando o Asaas confirma que o dinheiro caiu
    if (body.event === 'PAYMENT_RECEIVED' || body.event === 'PAYMENT_CONFIRMED') {
        const emailCliente = body.payment.email;
        const valor = body.payment.value;

        console.log(`Pagamento de R$ ${valor} confirmado para ${emailCliente}`);
        
        // TODO: Aqui você deve inserir a integração com seu serviço de e-mail (SendGrid, Resend, etc.)
        // para enviar o link do seu curso "Academia da Voz".
    }

    return res.status(200).json({ status: "sucesso" });
}
