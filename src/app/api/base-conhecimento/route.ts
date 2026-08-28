import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  const resultado = await query(`
    SELECT id, categoria, gatilho, conteudo, contexto, ativo, criado_em
    FROM base_conhecimento
    ORDER BY criado_em DESC
  `);
  return NextResponse.json(resultado);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { categoria, gatilho, conteudo, contexto } = body;

  if (!categoria || !gatilho || !conteudo) {
    return NextResponse.json({ error: 'categoria, gatilho e conteudo são obrigatórios' }, { status: 400 });
  }

  const resultado = await query(`
    INSERT INTO base_conhecimento (categoria, gatilho, conteudo, contexto)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `, [categoria, gatilho, conteudo, contexto || null]);

  return NextResponse.json(resultado[0]);
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { id, categoria, gatilho, conteudo, contexto, ativo } = body;

  if (!id) {
    return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 });
  }

  const resultado = await query(`
    UPDATE base_conhecimento
    SET categoria = $1, gatilho = $2, conteudo = $3, contexto = $4, ativo = $5
    WHERE id = $6
    RETURNING *
  `, [categoria, gatilho, conteudo, contexto || null, ativo, id]);

  return NextResponse.json(resultado[0]);
}
