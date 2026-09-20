import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { normalizarTelefone } from "@/lib/telefone";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { nome, telefone, tipo_imovel, cidade_interesse, notas, fase } = body;

    // Se está trocando o telefone, o número novo precisa ser utilizável e não
    // pode pertencer a outro lead (o índice único em telefone_normalizado protege).
    let telefoneNormalizado: string | null | undefined;
    if (telefone !== undefined) {
      telefoneNormalizado = telefone ? normalizarTelefone(telefone) : null;
      if (telefone && !telefoneNormalizado) {
        return NextResponse.json(
          { error: "Telefone inválido. Use DDD + número, ex: (61) 99999-8888." },
          { status: 400 }
        );
      }
      if (telefoneNormalizado) {
        const [outro] = await query(
          `SELECT id FROM leads WHERE telefone_normalizado = $1 AND id <> $2 LIMIT 1`,
          [telefoneNormalizado, params.id]
        );
        if (outro) {
          return NextResponse.json(
            { error: "Este telefone já está em uso por outro lead." },
            { status: 409 }
          );
        }
      }
    }

    const campos: string[] = [];
    const valores: any[] = [];
    let i = 1;

    if (nome !== undefined) { campos.push(`nome = $${i++}`); valores.push(nome); }
    if (telefone !== undefined) {
      campos.push(`telefone = $${i++}`); valores.push(telefone);
      campos.push(`telefone_normalizado = $${i++}`); valores.push(telefoneNormalizado);
    }
    if (tipo_imovel !== undefined) { campos.push(`tipo_imovel = $${i++}`); valores.push(tipo_imovel); }
    if (cidade_interesse !== undefined) { campos.push(`cidade_interesse = $${i++}`); valores.push(cidade_interesse); }
    if (notas !== undefined) { campos.push(`notas = $${i++}`); valores.push(notas); }
    if (fase !== undefined) { campos.push(`fase = $${i++}`); valores.push(fase); }

    if (campos.length === 0) {
      return NextResponse.json({ error: "Nada para atualizar." }, { status: 400 });
    }

    valores.push(params.id);

    try {
      const [atualizado] = await query(
        `UPDATE leads SET ${campos.join(", ")} WHERE id = $${i} RETURNING *`,
        valores
      );

      if (!atualizado) {
        return NextResponse.json({ error: "Lead não encontrado." }, { status: 404 });
      }

      return NextResponse.json(atualizado);
    } catch (err: any) {
      if (err?.code === "23505") {
        return NextResponse.json(
          { error: "Este telefone já está em uso por outro lead." },
          { status: 409 }
        );
      }
      throw err;
    }
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
