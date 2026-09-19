import { enviarWhatsApp } from "@/lib/twilio";

// Avisa o número de NOTIFICAR_WHATSAPP (o dono do CRM) sempre que entra um
// lead novo por indicação ou pelo Meta Ads. Fire-and-forget: falha de envio
// nunca derruba o cadastro do lead — só loga.
//
// Sem NOTIFICAR_WHATSAPP no .env a notificação fica silenciosamente desligada.

export async function notificarLeadNovo(lead: {
  nome: string | null;
  telefone: string | null;
  origem: string | null;
  tipo_imovel?: string | null;
  cidade_interesse?: string | null;
}): Promise<void> {
  const destino = process.env.NOTIFICAR_WHATSAPP;
  if (!destino) return;

  const origem =
    lead.origem === "indicacao" ? "Indicação" : lead.origem === "meta_ads" ? "Meta Ads" : lead.origem || "—";
  const imovel = lead.tipo_imovel === "casa" ? "Casa" : lead.tipo_imovel === "apartamento" ? "Apê" : null;

  const linhas = [
    "🎯 *Lead novo!*",
    `👤 ${lead.nome ?? "Sem nome"} — ${lead.telefone ?? "sem telefone"}`,
    `📍 Origem: ${origem}`,
    imovel ? `🏠 Interesse: ${imovel}${lead.cidade_interesse ? ` (${lead.cidade_interesse})` : ""}` : null,
  ].filter(Boolean);

  try {
    await enviarWhatsApp(destino, linhas.join("\n"));
  } catch (err) {
    console.error("Falha ao notificar lead novo:", err);
  }
}
