export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { analisarChamada } from "@/lib/retell";

// Processa a fila de análises pós-chamada em background.
//
// Por que existe: a análise (chamada à Anthropic) leva de 5 a 20 segundos.
// Rodar dentro do webhook do Retell atrasava a resposta do webhook — e o Retell
// corta webhooks lentos, podendo reenviar o evento em duplicidade. Agora o
// webhook só grava a chamada com analise_status = 'pendente' e este job faz o
// trabalho pesado depois, acionado pelo cron da Vercel (ver vercel.json).
//
// Mesmo padrão do /api/discador/processar: idempotente, em lotes pequenos.

const LOTE = 5;

// Mesma regra que existia no webhook: traduz a análise em fase do funil.
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

export async function POST() {
  // Pega chamadas concluídas com transcrição que ainda não foram analisadas.
  // FOR UPDATE SKIP LOCKED evita dois crons concorrentes pegarem a mesma linha.
  const fila = await query(
    `SELECT c.id, c.transcricao, c.lead_id
     FROM chamadas c
     LEFT JOIN analises_chamada a ON a.chamada_id = c.id
     WHERE c.status = 'concluida'
       AND c.transcricao IS NOT NULL
       AND c.transcricao <> ''
       AND a.id IS NULL
     ORDER BY c.finalizado_em DESC NULLS LAST
     LIMIT $1
     FOR UPDATE OF c SKIP LOCKED`,
    [LOTE]
  );

  const processadas: string[] = [];
  const erros: string[] = [];

  for (const chamada of fila) {
    try {
      const analise = await analisarChamada(chamada.transcricao);
      await query(
        `INSERT INTO analises_chamada (chamada_id, sentimento, score_interesse, objecoes, palavras_chave, resumo)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (chamada_id) DO UPDATE
           SET sentimento = $2, score_interesse = $3, objecoes = $4, palavras_chave = $5, resumo = $6`,
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
          [chamada.lead_id, novaFase, analise.tipo_imovel, analise.cidade_interesse, analise.tem_restricao, analise.motivo_sem_interesse]
        );

        await query(
          `INSERT INTO lead_eventos (lead_id, tipo, descricao)
           VALUES ($1, 'ligacao', $2)`,
          [chamada.lead_id, analise.resumo || "Ligação via IA (Retell) sem resumo gerado."]
        );
      }

      processadas.push(chamada.id);
    } catch (err) {
      console.error(`Erro analisando chamada ${chamada.id}:`, err);
      erros.push(chamada.id);
    }
  }

  return NextResponse.json({ ok: true, processadas: processadas.length, erros: erros.length });
}
