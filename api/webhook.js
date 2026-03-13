export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Método não permitido');

    // O Token que você gerou no painel do Asaas
    const TOKEN_GERADO = "whsec_I-EhHPPOmwR2BHdlJZmmTlOGoRC3d7RzYOKpelp7yFs";
    const tokenRecebido = req.headers['asaas-access-token'];

    if (tokenRecebido !== TOKEN_GERADO) {
        return res.status(401).json({ error: "Token inválido" });
    }

    const body = req.body;
    if (body.event === 'PAYMENT_RECEIVED' || body.event === 'PAYMENT_CONFIRMED') {
        console.log("Pagamento confirmado via Webhook!");
    }

    return res.status(200).json({ success: true });
}
