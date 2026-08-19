import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

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

    // 1. Tenta achar o indicador pelo telefone, se informado
    if (indicadorTelefone) {
      const porTelefone = await query(
        `SELECT * FROM indicadores WHERE telefone = $1 LIMIT 1`,
        [indicadorTelefone]
      );
      indicador = porTelefone[0] ?? null;
    }

    // 2. Se não achou pelo telefone, tenta pelo nome (ignorando maiúsculas/minúsculas)
    if (!indicador) {
      const porNome = await query(
        `SELECT * FROM indicadores WHERE LOWER(nome) = LOWER($1) LIMIT 1`,
        [indicadorNome]
      );
      indicador = porNome[0] ?? null;
    }

    // 3. Se ainda não existe, cria um novo indicador
    if (!indicador) {
      const codigo = `${indicadorNome.toLowerCase().replace(/\s+/g, "-")}-${Date.now()
        .toString()
        .slice(-4)}`;
      const novos = await query(
        `INSERT INTO indicadores (nome, telefone, codigo_indicacao) VALUES ($1, $2, $3) RETURNING *`,
        [indicadorNome, indicadorTelefone ?? null, codigo]
      );
      indicador = novos[0];
    } else if (indicadorTelefone && !indicador.telefone) {
      // Se achou o indicador pelo nome mas ele ainda não tinha telefone salvo, atualiza
      await query(`UPDATE indicadores SET telefone = $1 WHERE id = $2`, [indicadorTelefone, indicador.id]);
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
