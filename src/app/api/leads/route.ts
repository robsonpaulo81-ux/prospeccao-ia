export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { normalizarTelefone } from "@/lib/telefone";

export async function GET() {
  const leads = await query(`SELECT * FROM leads ORDER BY criado_em DESC LIMIT 200`);
  return NextResponse.json(leads);
}

// Aceita um lead único, ou um array de leads (para importação em massa via CSV já parseado no frontend).
// Na importação, cada linha é processada de forma independente: duplicada ou
// inválida não derruba o resto — o resultado separa inseridos/duplicados/inválidos.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const leads = Array.isArray(body) ? body : [body];

  const inseridos: any[] = [];
  const duplicados: any[] = [];
  const invalidos: any[] = [];

  for (const lead of leads) {
    const { nome, telefone, empresa, origem } = lead;
    if (!telefone) {
      invalidos.push({ nome: nome ?? null, motivo: "sem telefone" });
      continue;
    }

    const telefoneNormalizado = normalizarTelefone(telefone);
    if (!telefoneNormalizado) {
      invalidos.push({ nome: nome ?? null, telefone, motivo: "telefone inválido" });
      continue;
    }

    const [existente] = await query(
      `SELECT id FROM leads WHERE telefone_normalizado = $1 LIMIT 1`,
      [telefoneNormalizado]
    );
    if (existente) {
      duplicados.push({ nome: nome ?? null, telefone, lead_existente_id: existente.id });
      continue;
    }

    try {
      const [row] = await query(
        `INSERT INTO leads (nome, telefone, telefone_normalizado, empresa, origem) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [nome ?? null, telefone, telefoneNormalizado, empresa ?? null, origem ?? "manual"]
      );
      inseridos.push(row);
    } catch (err: any) {
      if (err?.code === "23505") {
        duplicados.push({ nome: nome ?? null, telefone, motivo: "cadastrado em paralelo" });
      } else {
        throw err;
      }
    }
  }

  return NextResponse.json({ inseridos, duplicados, invalidos }, { status: 201 });
}
