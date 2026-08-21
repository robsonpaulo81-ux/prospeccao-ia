export async function enviarWhatsApp(paraTelefone: string, mensagem: string): Promise<boolean> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const de = process.env.TWILIO_WHATSAPP_FROM;

  if (!accountSid || !authToken || !de) {
    console.error("Variáveis do Twilio WhatsApp não configuradas.");
    return false;
  }

  const digitos = paraTelefone.replace(/\D/g, "");
  if (!digitos) return false;

  const numeroCompleto = digitos.length <= 11 ? "55" + digitos : digitos;
  const para = "whatsapp:+" + numeroCompleto;

  const url = "https://api.twilio.com/2010-04-01/Accounts/" + accountSid + "/Messages.json";
  const auth = Buffer.from(accountSid + ":" + authToken).toString("base64");

  const body = new URLSearchParams({
    From: de,
    To: para,
    Body: mensagem,
  });

  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: "Basic " + auth,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });
    if (!resp.ok) {
      const erro = await resp.text();
      console.error("Erro ao enviar WhatsApp via Twilio:", erro);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Erro ao chamar API do Twilio:", err);
    return false;
  }
}
