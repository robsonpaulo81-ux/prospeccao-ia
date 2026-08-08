import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  const leads = await query(`SELECT * FROM leads ORDER BY criado_em DESC LIMIT 200`);
  return NextResponse.json(leads);
}

// Aceita um lead único, ou um array de leads (para importação em massa via CSV já parseado no frontend)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const leads = Array.isArray(body) ? body : [body];

  const inseridos = [];
  for (const lead of leads) {
    const { nome, telefone, empresa, origem } = lead;
    if (!telefone) continue;

    const [row] = await query(
      `INSERT INTO leads (nome, telefone, empresa, origem) VALUES ($1, $2, $3, $4) RETURNING *`,
      [nome ?? null, telefone, empresa ?? null, origem ?? "manual"]
    );
    inseridos.push(row);
  }

  return NextResponse.json(inseridos, { status: 201 });
}
