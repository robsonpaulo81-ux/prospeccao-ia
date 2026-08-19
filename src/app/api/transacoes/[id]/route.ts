import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
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

    const [atualizado] = await query(
      `UPDATE transacoes SET
        tipo = COALESCE($1, tipo),
        empreendimento = $2,
        unidade = $3,
        corretor = $4,
        cliente = $5,
        valor_bruto = $6,
        valor_entrada = $7,
        comissao_corretor = $8,
        forma_pagamento = $9,
        data_transacao = $10
       WHERE id = $11 RETURNING *`,
      [
        tipo || null,
        empreendimento || null,
        unidade || null,
        corretor || null,
        cliente || null,
        valorBruto || null,
        valorEntrada || null,
        comissaoCorretor || null,
        formaPagamento || null,
        dataTransacao || null,
        params.id,
      ]
    );

    if (!atualizado) {
      return NextResponse.json({ error: "Registro não encontrado." }, { status: 404 });
    }

    return NextResponse.json(atualizado);
  } catch (err: any) {
    console.error("Erro ao atualizar transacao:", err);
    return NextResponse.json(
      { error: "Falha ao atualizar.", detalhe: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await query(`DELETE FROM transacoes WHERE id = $1`, [params.id]);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Erro ao cancelar transacao:", err);
    return NextResponse.json(
      { error: "Falha ao cancelar.", detalhe: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
