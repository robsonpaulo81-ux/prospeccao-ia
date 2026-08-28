import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

// Detalhe de uma sessão específica do Live Coach: transcrição completa e horários.
export async function GET(
  req: NextRequest,
  { params }: { params: { callId: string } }
) {
  const [sessao] = await query(
    `SELECT retell_call_id, status, transcricao, iniciado_em, finalizado_em, duracao_segundos
     FROM chamadas
     WHERE retell_call_id = $1`,
    [params.callId]
  );

  if (!sessao) {
    return NextResponse.json({ error: "sessão não encontrada" }, { status: 404 });
  }

  return NextResponse.json({ sessao });
}
