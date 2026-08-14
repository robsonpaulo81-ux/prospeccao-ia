// src/app/api/coach-suggestions/[callId]/route.ts
//
// Endpoint de leitura para o painel da tela de detalhe da chamada.
// MVP: polling simples (o painel chama isso a cada 2-3s enquanto a chamada está ativa).

import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { callId: string } }
) {
  const rows = await query(
    `SELECT suggestion_type, priority, text, created_at
     FROM coach_suggestions
     WHERE call_id = $1
     ORDER BY created_at DESC
     LIMIT 5`,
    [params.callId]
  );

  return NextResponse.json({ suggestions: rows });
}
