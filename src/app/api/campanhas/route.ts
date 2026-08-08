import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  const campanhas = await query(`SELECT * FROM campanhas ORDER BY criado_em DESC`);
  return NextResponse.json(campanhas);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { nome, prompt_base, canal, voice_id } = body;

  if (!nome || !prompt_base) {
    return NextResponse.json({ error: "nome e prompt_base são obrigatórios" }, { status: 400 });
  }

  const [campanha] = await query(
    `INSERT INTO campanhas (nome, prompt_base, canal, voice_id) VALUES ($1, $2, $3, $4) RETURNING *`,
    [nome, prompt_base, canal ?? "voz", voice_id ?? null]
  );

  return NextResponse.json(campanha, { status: 201 });
}
