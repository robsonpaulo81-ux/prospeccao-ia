import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { analisarChamada } from "@/lib/retell";

// Configure esta URL no Retell em Settings -> Webhooks:
// https://SEU-DOMINIO/api/webhooks/retell
//
// Eventos tratados: call_started, call_ended, call_analyzed
// Referência do formato de payload: https://docs.retellai.com/features/webhook

// Normaliza telefone para comparação (mantém só dígitos, sem + nem espaços)
function normalizarTelefone(tel: string | null | undefined): string | null {
  if (!tel) return null;
  return tel.replace(/\D/g, "");
}

// Mapeia o resultado da análise pós-chamada do Retell para o enum usado no banco.
// Ajuste os nomes de campo aqui conforme o que você configurou em
// "Extração de dados pós-chamada" no agente do Retell.
function mapearResultado(callAnalysis: any): string | null {
  if (!callAnalysis) return null;

  const custom = callAnalysis.custom_analysis_data ?? {};

  // Exemplo: se você tem um campo booleano "agendamento" ou "agendou" configurado
  if (custom.agendamento === true || custom.agendou === true) {
    return "agendou";
  }
  if (custom.qualificado === true) {
    return "qualificado";
  }
  if (callAnalysis.call_successful === false) {
    return "sem_sucesso";
  }
  if (callAnalysis.call_successful === true) {
    return "contato_efetivo";
  }
  return null;
}

export async function POST(req: NextRequest) {
  const payload = await req.json();
  const evento = payload.event as string;
  const call = payload.call ?? {};

  const retellCallId: string = call.call_id;
  if (!retellCallId) {
    return NextResponse.json({ error: "call_id ausente no payload" }, { status: 400 });
  }

  if (evento === "call_started") {
    // Número do lead: em chamada de saída é to_number; em chamada recebida é from_number
    const direction = call.direction ?? (call.to_number ? "outbound" : "inbound");
    const numeroLead =
      direction === "outbound" ? call.to_number : call.from_number;
    const telefoneNormalizado = normalizarTelefone(numeroLead);

    // Lookup do lead pelo telefone
    let leadId: string | null = null;
    if (telefoneNormalizado) {
      const [lead] = await query(
        `SELECT id FROM leads WHERE regexp_replace(telefone, '\\D', '', 'g') = $1 LIMIT 1`,
        [telefoneNormalizado]
      );
      leadId = lead?.id ?? null;
    }

    // Lookup da campanha pelo agent_id do Retell
    let campanhaId: string | null = null;
    if (call.agent_id) {
      const [campanha] = await query(
        `SELECT id FROM campanhas WHERE retell_agent_id = $1 LIMIT 1`,
        [call.agent_id]
      );
      campanhaId = campanha?.id ?? null;
    }

    await query(
      `INSERT INTO chamadas (retell_call_id, lead_id, campanha_id, status, iniciado_em)
       VALUES ($1, $2, $3, 'em_andamento', now())
       ON CONFLICT (retell_call_id) DO UPDATE SET
         lead_id = COALESCE(chamadas.lead_id, EXCLUDED.lead_id),
         campanha_id = COALESCE(chamadas.campanha_id, EXCLUDED.campanha_id),
         status = 'em_andamento'`,
      [retellCallId, leadId, campanhaId]
    );
  }

  if (evento === "call_ended") {
    const duracaoSegundos = call.duration_ms ? Math.round(call.duration_ms / 1000) : null;
    const transcricao = call.transcript ?? null;

    // Custo vem em centavos de dólar na API do Retell (call_cost.combined_cost)
    const custoEstimado =
      call.call_cost?.combined_cost != null
        ? call.call_cost.combined_cost / 100
        : null;

    await query(
      `UPDATE chamadas
       SET status = 'concluida',
           duracao_segundos = $2,
           transcricao = $3,
           gravacao_url = $4,
           custo_estimado = COALESCE($5, custo_estimado),
           finalizado_em = now()
       WHERE retell_call_id = $1`,
      [retellCallId, duracaoSegundos, transcricao, call.recording_url ?? null, custoEstimado]
    );
  }

  if (evento === "call_analyzed") {
    const resultado = mapearResultado(call.call_analysis);
    const transcricao = call.transcript ?? null;

    if (resultado) {
      await query(
        `UPDATE chamadas SET resultado = $2 WHERE retell_call_id = $1`,
        [retellCallId, resultado]
      );
    }

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
  }

  return NextResponse.json({ ok: true });
}
