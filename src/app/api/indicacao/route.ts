import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

// Recebe o formulário público de indicação e grava:
// 1. o indicador (cria se não existir, reaproveita se já existir pelo telefone)
// 2. o lead indicado, já ligado ao indicador, na fase inicial do Kanban
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { indicadorNome, indicadorTelefone, leadNome, leadTelefone, interesse } = body;

  if (!indicadorNome || !leadNome || !leadTelefone) {
    return NextResponse.json(
      { error: "Nome do indicador, nome e telefone do indicado são obrigatórios." },
      { status: 400 }
    );
  }

  // 1. Busca indicador existente pelo telefone, se informado
  let indicador = null;
  if (indicadorTelefone) {
    const existentes = await query(
      `SELECT * FROM indicadores WHERE telefone = $1 LIMIT 1`,
      [indicadorTelefone]
    );
    indicador = existentes[0] ?? null;
  }

  // 2. Se não existe, cria um novo indicador com código único
  if (!indicador) {
    const codigo = `${indicadorNome.toLowerCase().replace(/\s+/g, "-")}-${Date.now()
      .toString()
      .slice(-4)}`;
    const novos = await query(
      `INSERT INTO indicadores (nome, telefone, codigo_indicacao) VALUES ($1, $2, $3) RETURNING *`,
      [indicadorNome, indicadorTelefone ?? null, codigo]
    );
    indicador = novos[0];
  }

  // 3. Cria o lead já ligado ao indicador, na fase inicial do Kanban
  const [leadInserido] = await query(
    `INSERT INTO leads (nome, telefone, tipo_imovel, fase, indicado_por, origem)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [leadNome, leadTelefone, interesse ?? null, "atendido_qualificacao", indicador.id, "indicacao"]
  );

  return NextResponse.json({ ok: true, lead: leadInserido, indicador }, { status: 201 });
}
