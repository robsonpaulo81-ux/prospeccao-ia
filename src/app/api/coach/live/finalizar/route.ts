import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// Chamado quando o usuário clica "Parar captura" — salva a transcrição
// completa da sessão pra poder ser revista depois no histórico.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { callId, transcript } = body as {
      callId: string;
      transcript: { speaker: "agente" | "lead"; text: string }[];
    };

    if (!callId) {
      return NextResponse.json({ error: "callId é obrigatório" }, { status: 400, headers: CORS_HEADERS });
    }

    const textoCompleto = (transcript || [])
      .map((t) => `${t.speaker === "agente" ? "Você" : "Lead"}: ${t.text}`)
      .join("\n");

    await query(
      `UPDATE chamadas
       SET status = 'concluida',
           transcricao = $2,
           duracao_segundos = EXTRACT(EPOCH FROM (now() - iniciado_em))::int,
           finalizado_em = now()
       WHERE retell_call_id = $1`,
      [callId, textoCompleto]
    );

    return NextResponse.json({ ok: true }, { headers: CORS_HEADERS });
  } catch (err: any) {
    console.error("Erro ao finalizar sessão do Live Coach:", err);
    return NextResponse.json({ error: err.message || "erro desconhecido" }, { status: 500, headers: CORS_HEADERS });
  }
}
