import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { tipo } = body;

    if (!["reserva", "repasse", "distrato"].includes(tipo)) {
      return NextResponse.json({ error: "Tipo inválido." }, { status: 400 });
    }

    const [atualizado] = await query(
      `UPDATE transacoes SET tipo = $1 WHERE id = $2 RETURNING *`,
      [tipo, params.id]
    );

    if (!atualizado) {
      return NextResponse.json({ error: "Registro não encontrado." }, { status: 404 });
    }

    return NextResponse.json(atualizado);
  } catch (err: any) {
    console.error("Erro ao mover transacao:", err);
    return NextResponse.json(
      { error: "Falha ao mover.", detalhe: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
