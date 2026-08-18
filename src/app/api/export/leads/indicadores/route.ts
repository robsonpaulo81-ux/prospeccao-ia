import { NextResponse } from "next/server";
import { query } from "@/lib/db";

function paraCsv(linhas: any[], colunas: { chave: string; titulo: string }[]) {
  const cabecalho = colunas.map((c) => `"${c.titulo}"`).join(",");
  const corpo = linhas
    .map((linha) =>
      colunas
        .map((c) => `"${String(linha[c.chave] ?? "").replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\n");
  return cabecalho + "\n" + corpo;
}

export async function GET() {
  const indicadores = await query(`
    SELECT
      i.nome,
      i.telefone,
      COUNT(l.id) AS total_leads,
      COUNT(l.id) FILTER (WHERE l.fase = 'novo') AS novo,
      COUNT(l.id) FILTER (WHERE l.fase = 'atendimento') AS atendimento,
      COUNT(l.id) FILTER (WHERE l.fase = 'interessado') AS interessado,
      COUNT(l.id) FILTER (WHERE l.fase = 'hot_lead') AS hot_lead,
      COUNT(l.id) FILTER (WHERE l.fase = 'restricao') AS restricao,
      COUNT(l.id) FILTER (WHERE l.fase = 'sem_interesse') AS sem_interesse
    FROM indicadores i
    LEFT JOIN leads l ON l.indicado_por = i.id
    GROUP BY i.id
    ORDER BY total_leads DESC
  `);

  const csv = paraCsv(indicadores, [
    { chave: "nome", titulo: "Indicador" },
    { chave: "telefone", titulo: "Telefone" },
    { chave: "total_leads", titulo: "Total de leads" },
    { chave: "novo", titulo: "Novo" },
    { chave: "atendimento", titulo: "Em atendimento" },
    { chave: "interessado", titulo: "Interessado" },
    { chave: "hot_lead", titulo: "Hot lead" },
    { chave: "restricao", titulo: "Restrição" },
    { chave: "sem_interesse", titulo: "Sem interesse" },
  ]);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="indicadores.csv"`,
    },
  });
}
