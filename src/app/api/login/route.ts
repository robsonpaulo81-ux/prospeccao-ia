import { NextRequest, NextResponse } from "next/server";
import { gerarToken, AUTH_COOKIE } from "@/lib/auth";
import { ipDaRequisicao, loginPermitido, registrarFalha, limparFalhas } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = ipDaRequisicao(req);

  const { permitido, restamSegundos } = loginPermitido(ip);
  if (!permitido) {
    const minutos = Math.ceil(restamSegundos / 60);
    return NextResponse.redirect(new URL(`/login?bloqueado=${minutos}`, req.url));
  }

  const form = await req.formData();
  const senha = String(form.get("senha") || "");
  const senhaCorreta = process.env.DASHBOARD_PASSWORD || "";

  if (senha && senhaCorreta && senha === senhaCorreta) {
    limparFalhas(ip);
    const token = await gerarToken(senhaCorreta);
    const resposta = NextResponse.redirect(new URL("/", req.url));
    resposta.cookies.set(AUTH_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 dias
      path: "/",
    });
    return resposta;
  }

  registrarFalha(ip);
  return NextResponse.redirect(new URL("/login?erro=1", req.url));
}
