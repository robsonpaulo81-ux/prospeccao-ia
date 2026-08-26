import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { gerarSugestoesCoach, type TurnoTranscricao } from "@/lib/coach-engine";

// Endpoint chamado pelo app Electron (captura de tela + áudio) durante
// ligações/atendimentos feitos pelo próprio Robson (Zoom, Meet, WhatsApp).
//
// Diferente do webhook do Retell (que recebe eventos de chamadas feitas
// pela IA), este endpoint recebe o transcript acumulado localmente pelo
// app de captura (via Deepgram) + opcionalmente um print de tela, e
// devolve as sugestões na hora — sem precisar esperar o painel puxar
// via polling.
//
// Body esperado:
// {
//   "callId": "live-<algum-identificador-da-sessao>",
//   "callContext": "texto curto descrevendo o atendimento",
//   "transcript": [{ "speaker": "agente"|"lead", "text": "..." }, ...],
//   "screenshotBase64": "..." // opcional, só os bytes base64 (sem prefixo data:)
// }

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

    // Garante que existe uma linha em "chamadas" pra esse callId, pra manter
    // consistência com o fluxo do Retell (painel, histórico etc. dependem disso).
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

    return NextResponse.json({ ok: true, suggestions: sugestoes });
  } catch (err: any) {
    console.error("Erro no endpoint /api/coach/live:", err);
    return NextResponse.json({ error: err.message || "erro desconhecido" }, { status: 500 });
  }
}
