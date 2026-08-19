import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  const tipo = req.nextUrl.searchParams.get("tipo");
  const transacoes = tipo
    ? await query(`SELECT * FROM transacoes WHERE tipo = $1 ORDER BY data_transacao DESC NULLS LAST, id DESC`, [tipo])
    : await query(`SELECT * FROM transacoes ORDER BY data_transacao DESC NULLS LAST, id DESC`);
  return NextResponse.json(transacoes);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      tipo,
      empreendimento,
      unidade,
      corretor,
      cliente,
      valorBruto,
      valorEntrada,
      comissaoCorretor,
      formaPagamento,
      dataTransacao,
    } = body;

    if (!tipo || !["reserva", "repasse", "distrato"].includes(tipo)) {
      return NextResponse.json({ error: "Tipo inválido." }, { status: 400 });
    }

    const [inserido] = await query(
      `INSERT INTO transacoes
        (tipo, empreendimento, unidade, corretor, cliente, valor_bruto, valor_entrada, comissao_corretor, forma_pagamento, data_transacao)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        tipo,
        empreendimento || null,
        unidade || null,
        corretor || null,
        cliente || null,
        valorBruto || null,
        valorEntrada || null,
        comissaoCorretor || null,
        formaPagamento || null,
        dataTransacao || null,
      ]
    );

    return NextResponse.json(inserido, { status: 201 });
  } catch (err: any) {
    console.error("Erro ao criar transacao:", err);
    return NextResponse.json(
      { error: "Falha ao salvar.", detalhe: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
