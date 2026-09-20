import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { normalizarTelefone, chaveTelefone } from "@/lib/telefone";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nome, telefone, tipoImovel, cidadeInteresse, notas } = body;

    if (!nome) {
      return NextResponse.json({ error: "Nome é obrigatório." }, { status: 400 });
    }

    // Telefone informado precisa ser utilizável; o normalizado vai na coluna
    // canônica usada pela deduplicação (índice único em telefone_normalizado).
    const telefoneNormalizado = normalizarTelefone(telefone);
    if (telefone && !telefoneNormalizado) {
      return NextResponse.json(
        { error: "Telefone inválido. Use DDD + número, ex: (61) 99999-8888." },
        { status: 400 }
      );
    }

    if (telefoneNormalizado) {
      const [existente] = await query(
        `SELECT id, nome, fase FROM leads WHERE telefone_normalizado = $1 LIMIT 1`,
        [telefoneNormalizado]
      );
      if (existente) {
        return NextResponse.json(
          {
            error: "Este telefone já está cadastrado.",
            lead_existente: existente,
          },
          { status: 409 }
        );
      }
    }

    const tipoImovelValido = tipoImovel === "casa" || tipoImovel === "apartamento" ? tipoImovel : null;
    const cidadeValida =
      cidadeInteresse === "aguas_lindas" || cidadeInteresse === "brasilia" ? cidadeInteresse : null;

    try {
      const [leadInserido] = await query(
        `INSERT INTO leads (nome, telefone, telefone_normalizado, tipo_imovel, cidade_interesse, fase, indicado_por, origem, tem_restricao, fase_atualizada_em, notas)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), $10) RETURNING *`,
        [nome, telefone || null, telefoneNormalizado, tipoImovelValido, cidadeValida, "novo", null, "manual", false, notas || null]
      );
      return NextResponse.json(leadInserido, { status: 201 });
    } catch (err: any) {
      // 23505 = violação de unique — outro cadastro venceu a corrida entre o
      // SELECT acima e o INSERT. Responde como duplicata, não como erro.
      if (err?.code === "23505") {
        return NextResponse.json(
          { error: "Este telefone já está cadastrado." },
          { status: 409 }
        );
      }
      throw err;
    }
  } catch (err: any) {
    console.error("Erro ao criar lead manualmente:", err);
    return NextResponse.json(
      { error: "Falha ao criar lead.", detalhe: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}

// (chaveTelefone continua disponível em @/lib/telefone para os testes —
// deduplicação continua compatível com o padrão do webhook Retell.
//  re-exportar aqui de rota API não é permitido pelo Next.js)
