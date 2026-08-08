import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { analisarChamada } from "@/lib/retell";

// Configure esta URL no Retell em Settings -> Webhooks:
// https://SEU-DOMINIO/api/webhooks/retell
//
// Eventos tratados: call_started, call_ended, call_analyzed
// Referência do formato de payload: https://docs.retellai.com/features/webhook

export async function POST(req: NextRequest) {
  const payload = await req.json();
  const evento = payload.event as string;
  const call = payload.call ?? {};

  const retellCallId: string = call.call_id;
  if (!retellCallId) {
    return NextResponse.json({ error: "call_id ausente no payload" }, { status: 400 });
  }

  if (evento === "call_started") {
    await query(
      `INSERT INTO chamadas (retell_call_id, status, iniciado_em)
       VALUES ($1, 'em_andamento', now())
       ON CONFLICT (retell_call_id) DO UPDATE SET status = 'em_andamento'`,
      [retellCallId]
    );
  }

  if (evento === "call_ended") {
    const duracaoSegundos = call.duration_ms ? Math.round(call.duration_ms / 1000) : null;
    const transcricao = call.transcript ?? null;

    await query(
      `UPDATE chamadas
       SET status = 'concluida',
           duracao_segundos = $2,
           transcricao = $3,
           gravacao_url = $4,
           finalizado_em = now()
       WHERE retell_call_id = $1`,
      [retellCallId, duracaoSegundos, transcricao, call.recording_url ?? null]
    );

    // Dispara a análise comportamental de forma assíncrona (não bloqueia a resposta do webhook)
    if (transcricao) {
      const [chamada] = await query(`SELECT id FROM chamadas WHERE retell_call_id = $1`, [retellCallId]);
      if (chamada) {
        const analise = await analisarChamada(transcricao);
        await query(
          `INSERT INTO analises_chamada (chamada_id, sentimento, score_interesse, objecoes, palavras_chave, resumo)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (chamada_id) DO UPDATE SET
             sentimento = $2, score_interesse = $3, objecoes = $4, palavras_chave = $5, resumo = $6`,
          [chamada.id, analise.sentimento, analise.score_interesse, analise.objecoes, analise.palavras_chave, analise.resumo]
        );
      }
    }
  }

  return NextResponse.json({ ok: true });
}
