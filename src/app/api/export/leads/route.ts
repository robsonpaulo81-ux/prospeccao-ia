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
  const leads = await query(`
    SELECT nome, telefone, fase, tipo_imovel, cidade_interesse, tem_restricao, motivo_sem_interesse, origem, criado_em
    FROM leads
    ORDER BY fase_atualizada_em DESC
  `);

  const csv = paraCsv(leads, [
    { chave: "nome", titulo: "Nome" },
    { chave: "telefone", titulo: "Telefone" },
    { chave: "fase", titulo: "Fase" },
    { chave: "tipo_imovel", titulo: "Tipo de imóvel" },
    { chave: "cidade_interesse", titulo: "Cidade de interesse" },
    { chave: "tem_restricao", titulo: "Tem restrição" },
    { chave: "motivo_sem_interesse", titulo: "Motivo sem interesse" },
    { chave: "origem", titulo: "Origem" },
    { chave: "criado_em", titulo: "Criado em" },
  ]);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leads.csv"`,
    },
  });
}
