import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

// Recebe o formulário público de indicação e grava:
// 1. o indicador (cria se não existir, reaproveita se já existir pelo telefone)
// 2. o lead indicado, já ligado ao indicador, na fase inicial do Kanban
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { indicadorNome, indicadorTelefone, leadNome, leadTelefone, interesse, documentoUrls, notas } = body;

    if (!indicadorNome || !leadNome || !leadTelefone) {
      return NextResponse.json(
        { error: "Nome do indicador, nome e telefone do indicado são obrigatórios." },
        { status: 400 }
      );
    }

    let indicador = null;
    if (indicadorTelefone) {
      const existentes = await query(
        `SELECT * FROM indicadores WHERE telefone = $1 LIMIT 1`,
        [indicadorTelefone]
      );
      indicador = existentes[0] ?? null;
    }

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

    const tipoImovelValido = interesse === "casa" || interesse === "apartamento" ? interesse : null;

    const documentosArray: string[] = Array.isArray(documentoUrls) ? documentoUrls : [];

    const [leadInserido] = await query(
      `INSERT INTO leads (nome, telefone, tipo_imovel, fase, indicado_por, origem, tem_restricao, fase_atualizada_em, documento_url, notas)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8, $9) RETURNING *`,
      [leadNome, leadTelefone, tipoImovelValido, "novo", indicador.id, "indicacao", false, documentosArray.length > 0 ? JSON.stringify(documentosArray) : null, notas ?? null]
    );

    return NextResponse.json({ ok: true, lead: leadInserido, indicador }, { status: 201 });
  } catch (err: any) {
    console.error("Erro ao processar indicacao:", err);
    return NextResponse.json(
      { error: "Falha ao registrar indicacao.", detalhe: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
