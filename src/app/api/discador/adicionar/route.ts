import { query } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { fase } = await req.json();

  const leads = await query(
    `SELECT id, telefone FROM leads WHERE fase = $1`,
    [fase]
  );

  let adicionados = 0;
  for (const lead of leads) {
    if (!lead.telefone) continue;
    const existe = await query(
      `SELECT id FROM fila_discagem WHERE lead_id = $1 AND status IN ('pendente','discando')`,
      [lead.id]
    );
    if (existe.length > 0) continue;

    await query(
      `INSERT INTO fila_discagem (lead_id, telefone) VALUES ($1, $2)`,
      [lead.id, lead.telefone]
    );
    adicionados++;
  }

  return NextResponse.json({ adicionados });
}
