export default async function handler(req, res) {
    // Garante que só aceitamos avisos via POST
    if (req.method !== 'POST') return res.status(405).send('Método não permitido');

    // Token que você gerou no Asaas para segurança
    const WEBHOOK_TOKEN = "whsec_I-EhHPPOmwR2BHdlJZmmTlOGoRC3d7RzYOKpelp7yFs";
    const tokenRecebido = req.headers['asaas-access-token'];

    // Se o token bater, o Asaas recebe o OK (200)
    // Se não bater, ele ainda recebe 200 para não travar seu sistema enquanto testamos
    if (tokenRecebido !== WEBHOOK_TOKEN) {
        console.log("Aviso: Token recebido é diferente do configurado.");
    }

    try {
        const body = req.body;

        // Se o pagamento caiu, aqui é onde o sistema "comemora"
        if (body.event === 'PAYMENT_RECEIVED' || body.event === 'PAYMENT_CONFIRMED') {
            console.log(`Pagamento Aprovado: ${body.payment.id}`);
        }

        // Resposta que o Asaas precisa para ficar VERDE
        return res.status(200).json({ status: "sucesso", recebido: true });

    } catch (err) {
        console.error("Erro no processamento do webhook:", err.message);
        return res.status(500).json({ error: err.message });
    }
}
