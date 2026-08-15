import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

const FASES_VALIDAS = ["novo", "atendimento", "sem_interesse", "restricao", "interessado", "hot_lead"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const { fase } = body;

  if (!FASES_VALIDAS.includes(fase)) {
    return NextResponse.json({ error: "Fase inválida" }, { status: 400 });
  }

  await query(
    `UPDATE leads SET fase = $1, fase_atualizada_em = now() WHERE id = $2`,
    [fase, params.id]
  );

  return NextResponse.json({ ok: true });
}
