import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    ...
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
