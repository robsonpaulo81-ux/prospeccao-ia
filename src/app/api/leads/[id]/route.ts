import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { nome, telefone, tipo_imovel, cidade_interesse, notas } = body;

    const [atualizado] = await query(
      `UPDATE leads SET
        nome = $1,
        telefone = $2,
        tipo_imovel = $3,
        cidade_interesse = $4,
        notas = $5
       WHERE id = $6 RETURNING *`,
      [nome || null, telefone || null, tipo_imovel || null, cidade_interesse || null, notas || null, params.id]
    );

    if (!atualizado) {
      return NextResponse.json({ error: "Lead não encontrado." }, { status: 404 });
    }

    return NextResponse.json(atualizado);
  } catch (err: any) {
    console.error("Erro ao atualizar lead:", err);
    return NextResponse.json(
      { error: "Falha ao atualizar.", detalhe: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await query(`DELETE FROM leads WHERE id = $1`, [params.id]);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Erro ao cancelar lead:", err);
    return NextResponse.json(
      { error: "Falha ao cancelar.", detalhe: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
