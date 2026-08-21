import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { enviarWhatsApp } from "@/lib/twilio";
import { FASE_LABEL } from "@/app/leads/KanbanBoard";

const FASES_VALIDAS = [
  "novo",
  "atendimento",
  "interessado",
  "hot_lead",
  "analise_cca",
  "pend_documentacao",
  "aprovado",
  "condicionado",
  "reprovado",
  "restricao",
  "interesse_futuro",
  "sem_interesse",
];

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const { fase } = body;
  if (!FASES_VALIDAS.includes(fase)) {
    return NextResponse.json({ error: "Fase inválida" }, { status: 400 });
  }
  const [leadAtual] = await query(
    `SELECT fase, nome, indicado_por FROM leads WHERE id = $1`,
    [params.id]
  );
  const faseAnterior = leadAtual?.fase ?? null;
  await query(
    `UPDATE leads SET fase = $1, fase_atualizada_em = now() WHERE id = $2`,
    [fase, params.id]
  );
  if (faseAnterior !== fase) {
    await query(
      `INSERT INTO lead_eventos (lead_id, tipo, fase_anterior, fase_nova)
       VALUES ($1, 'mudanca_fase', $2, $3)`,
      [params.id, faseAnterior, fase]
    );

    // Avisa quem indicou, via WhatsApp, sobre o avanço de fase
    if (leadAtual?.indicado_por) {
      try {
        const [indicador] = await query(
          `SELECT nome, telefone FROM indicadores WHERE id = $1`,
          [leadAtual.indicado_por]
        );
        if (indicador?.telefone) {
          const nomeLead = leadAtual.nome || "Seu indicado";
          const nomeFase = FASE_LABEL[fase] || fase;
          const mensagem =
            "Olá " + (indicador.nome || "") + "! " + nomeLead +
            ", que você indicou, avançou para a fase \"" + nomeFase + "\". Obrigado pela indicação!";
          await enviarWhatsApp(indicador.telefone, mensagem);
        }
      } catch (err) {
        console.error("Erro ao notificar indicador via WhatsApp:", err);
      }
    }
  }
  return NextResponse.json({ ok: true });
}
