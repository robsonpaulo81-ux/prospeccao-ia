import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// Lista as sessões passadas do Live Coach (navegador ou app Electron),
// mais recentes primeiro, pra tela de histórico.
export async function GET() {
  const sessoes = await query(
    `SELECT retell_call_id, status, iniciado_em, finalizado_em, duracao_segundos
     FROM chamadas
     WHERE retell_call_id LIKE 'live-%'
     ORDER BY iniciado_em DESC
     LIMIT 50`
  );

  return NextResponse.json({ sessoes });
}
