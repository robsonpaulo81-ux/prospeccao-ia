import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventos = await query(
      `SELECT * FROM lead_eventos WHERE lead_id = $1 ORDER BY criado_em DESC`,
      [params.id]
    );
    return NextResponse.json(eventos);
  } catch (err: any) {
    return NextResponse.json(
      { error: "Falha ao buscar eventos.", detalhe: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { tipo, descricao } = body;

    if (!tipo) {
      return NextResponse.json({ error: "Tipo é obrigatório." }, { status: 400 });
    }

    const [evento] = await query(
      `INSERT INTO lead_eventos (lead_id, tipo, descricao)
       VALUES ($1, $2, $3) RETURNING *`,
      [params.id, tipo, descricao || null]
    );

    return NextResponse.json(evento);
  } catch (err: any) {
    return NextResponse.json(
      { error: "Falha ao criar evento.", detalhe: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
