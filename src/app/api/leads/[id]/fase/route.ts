import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

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

  const [leadAtual] = await query(`SELECT fase FROM leads WHERE id = $1`, [params.id]);
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
  }

  return NextResponse.json({ ok: true });
}
