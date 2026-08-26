import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { gerarSugestoesCoach, type TurnoTranscricao } from "@/lib/coach-engine";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { callId, callContext, transcript, screenshotBase64 } = body as {
      callId: string;
      callContext: string;
      transcript: TurnoTranscricao[];
      screenshotBase64?: string;
    };

    if (!callId || !Array.isArray(transcript)) {
      return NextResponse.json(
        { error: "callId e transcript (array) são obrigatórios" },
        { status: 400 }
      );
    }

    await query(
      `INSERT INTO chamadas (retell_call_id, status, iniciado_em)
       VALUES ($1, 'em_andamento', now())
       ON CONFLICT (retell_call_id) DO NOTHING`,
      [callId]
    );

    const sugestoes = await gerarSugestoesCoach({
      callContext: callContext || "Atendimento ao vivo (Zoom/Meet/WhatsApp) conduzido pelo próprio corretor",
      transcript,
      screenshotBase64,
    });

    for (const sugestao of sugestoes) {
      await query(
        `INSERT INTO coach_suggestions (call_id, suggestion_type, priority, text)
         VALUES ($1, $2, $3, $4)`,
        [callId, sugestao.type, sugestao.priority, sugestao.text]
      );
    }

    return NextResponse.json({ ok: true, suggestions: sugestoes }, { headers: CORS_HEADERS });
  } catch (err: any) {
    console.error("Erro no endpoint /api/coach/live:", err);
    return NextResponse.json(
      { error: err.message || "erro desconhecido" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
