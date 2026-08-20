import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nome, telefone, tipoImovel, cidadeInteresse, notas } = body;

    if (!nome) {
      return NextResponse.json({ error: "Nome é obrigatório." }, { status: 400 });
    }

    const tipoImovelValido = tipoImovel === "casa" || tipoImovel === "apartamento" ? tipoImovel : null;
    const cidadeValida =
      cidadeInteresse === "aguas_lindas" || cidadeInteresse === "brasilia" ? cidadeInteresse : null;

    const [leadInserido] = await query(
      `INSERT INTO leads (nome, telefone, tipo_imovel, cidade_interesse, fase, indicado_por, origem, tem_restricao, fase_atualizada_em, notas)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9) RETURNING *`,
      [nome, telefone || null, tipoImovelValido, cidadeValida, "novo", null, "manual", false, notas || null]
    );

    return NextResponse.json(leadInserido, { status: 201 });
  } catch (err: any) {
    console.error("Erro ao criar lead manualmente:", err);
    return NextResponse.json(
      { error: "Falha ao criar lead.", detalhe: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
