import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { analisarChamada } from "@/lib/retell";
import { gerarSugestoesCoach, type TurnoTranscricao } from "@/lib/coach-engine";

// Configure esta URL no Retell em Settings -> Webhooks:
// https://SEU-DOMINIO/api/webhooks/retell
//
// Eventos tratados: call_started, call_ended, call_analyzed, transcript_updated
// Referência do formato de payload: https://docs.retellai.com/features/webhook

function normalizarTelefone(tel: string | null | undefined): string | null {
  if (!tel) return null;
  return tel.replace(/\D/g, "");
}

function mapearResultado(callAnalysis: any): string | null {
  if (!callAnalysis) return null;
  const custom = callAnalysis.custom_analysis_data ?? {};
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

// Decide a fase do Kanban a partir da análise da IA.
// Restrição e "sem interesse" têm prioridade sobre interesse/hot lead.
function definirFase(analise: {
  tem_restricao: boolean;
  motivo_sem_interesse: string | null;
  hot_lead: boolean;
  tipo_imovel: string | null;
  cidade_interesse: string | null;
}): string {
  if (analise.tem_restricao) return "restricao";
  if (analise.motivo_sem_interesse) return "sem_interesse";
  if (analise.hot_lead) return "hot_lead";
  if (analise.tipo_imovel || analise.cidade_interesse) return "interessado";
  return "atendimento";
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
    const direction = call.direction ?? (call.to_number ? "outbound" : "inbound");
    const numeroLead =
      direction === "outbound" ? call.to_number : call.from_number;
    const telefoneNormalizado = normalizarTelefone(numeroLead);

    let leadId: string | null = null;
    if (telefoneNormalizado) {
      const [lead] = await query(
        `SELECT id FROM leads WHERE regexp_replace(telefone, '\\D', '', 'g') = $1 LIMIT 1`,
        [telefoneNormalizado]
      );
      leadId = lead?.id ?? null;
    }

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

  if (evento === "transcript_updated") {
    try {
      await processarTranscriptUpdate(retellCallId, call);
    } catch (err) {
      console.error("Erro processando transcript_updated:", err);
    }
    return NextResponse.json({ ok: true });
  }

  if (evento === "call_ended") {
    const duracaoSegundos = call.duration_ms ? Math.round(call.duration_ms / 1000) : null;
    const transcricao = call.transcript ?? null;
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

    if (transcricao) {
      const [chamada] = await query(
        `SELECT id, lead_id FROM chamadas WHERE retell_call_id = $1`,
        [retellCallId]
      );

      if (chamada) {
        const analise = await analisarChamada(transcricao);

        await query(
          `INSERT INTO analises_chamada (chamada_id, sentimento, score_interesse, objecoes, palavras_chave, resumo)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (chamada_id) DO UPDATE SET
             sentimento = $2, score_interesse = $3, objecoes = $4, palavras_chave = $5, resumo = $6`,
          [chamada.id, analise.sentimento, analise.score_interesse, analise.objecoes, analise.palavras_chave, analise.resumo]
        );

        // Atualiza o card do lead no Kanban com o que a IA identificou na ligação
               if (chamada.lead_id) {
          const novaFase = definirFase(analise);
          await query(
            `UPDATE leads
             SET fase = $2,
                 tipo_imovel = COALESCE($3, tipo_imovel),
                 cidade_interesse = COALESCE($4, cidade_interesse),
                 tem_restricao = $5,
                 motivo_sem_interesse = $6,
                 fase_atualizada_em = now()
             WHERE id = $1`,
            [
              chamada.lead_id,
              novaFase,
              analise.tipo_imovel,
              analise.cidade_interesse,
              analise.tem_restricao,
              analise.motivo_sem_interesse,
            ]
          );
        }
      }
    }
  }

  return NextResponse.json({ ok: true });
}

async function processarTranscriptUpdate(retellCallId: string, call: any) {
  const rawTranscript = call.transcript_object;
  if (!rawTranscript || !Array.isArray(rawTranscript)) return;

  const transcript: TurnoTranscricao[] = rawTranscript.map((turno: any) => ({
    speaker: turno.role === "agent" ? "agente" : "lead",
    text: turno.content,
  }));

  let callContext =
    "SDR ligando para lead do programa Minha Casa Minha Vida, objetivo: qualificar e agendar demo";
  if (call.agent_id) {
    const [campanha] = await query(
      `SELECT nome FROM campanhas WHERE retell_agent_id = $1 LIMIT 1`,
      [call.agent_id]
    );
    if (campanha?.nome) {
      callContext = `SDR ligando para lead da campanha "${campanha.nome}", objetivo: qualificar e agendar demo`;
    }
  }

  const sugestoes = await gerarSugestoesCoach({ callContext, transcript });
  if (sugestoes.length === 0) return;

  for (const sugestao of sugestoes) {
    await query(
      `INSERT INTO coach_suggestions (call_id, suggestion_type, priority, text)
       VALUES ($1, $2, $3, $4)`,
      [retellCallId, sugestao.type, sugestao.priority, sugestao.text]
    );
  }
}
