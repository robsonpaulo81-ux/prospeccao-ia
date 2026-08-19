import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  const tipo = req.nextUrl.searchParams.get("tipo");

  // inclui a data de indicação do lead vinculado e o SLA em dias
  const base = `
    SELECT t.*,
           l.criado_em AS lead_criado_em,
           CASE
             WHEN t.lead_id IS NOT NULL AND t.data_transacao IS NOT NULL
               THEN (t.data_transacao::date - l.criado_em::date)
             ELSE NULL
           END AS sla_dias
    FROM transacoes t
    LEFT JOIN leads l ON l.id = t.lead_id
  `;

  const transacoes = tipo
    ? await query(`${base} WHERE t.tipo = $1 ORDER BY t.data_transacao DESC NULLS LAST, t.id DESC`, [tipo])
    : await query(`${base} ORDER BY t.data_transacao DESC NULLS LAST, t.id DESC`);

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
      leadId, // NOVO: opcional, vincula a transação a um lead
    } = body;

    if (!tipo || !["reserva", "repasse", "distrato"].includes(tipo)) {
      return NextResponse.json({ error: "Tipo inválido." }, { status: 400 });
    }

    const [inserido] = await query(
      `INSERT INTO transacoes
        (tipo, empreendimento, unidade, corretor, cliente, valor_bruto, valor_entrada, comissao_corretor, forma_pagamento, data_transacao, lead_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
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
        leadId || null,
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
