import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// Retorna o callId da sessão de atendimento ao vivo (Live Coach) mais recente,
// pra a tela /atendimento-ao-vivo saber qual painel de sugestões mostrar.
export async function GET() {
  const [chamada] = await query(
    `SELECT retell_call_id FROM chamadas
     WHERE retell_call_id LIKE 'live-%'
     ORDER BY iniciado_em DESC
     LIMIT 1`
  );

  return NextResponse.json({ callId: chamada?.retell_call_id ?? null });
}
