import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

// Recebe um arquivo enviado pelo formulário público de indicação
// e salva no armazenamento de arquivos (Vercel Blob), retornando o link.
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const arquivo = formData.get("arquivo") as File | null;

    if (!arquivo) {
      return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
    }

    const nomeUnico = `documentos/${Date.now()}-${arquivo.name}`;
    const resultado = await put(nomeUnico, arquivo, { access: "public" });

    return NextResponse.json({ url: resultado.url }, { status: 201 });
  } catch (err: any) {
    console.error("Erro ao enviar arquivo:", err);
    return NextResponse.json(
      { error: "Falha ao enviar arquivo.", detalhe: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
