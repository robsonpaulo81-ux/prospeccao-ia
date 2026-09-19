import { NextRequest, NextResponse } from "next/server";
import { gerarToken, AUTH_COOKIE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const senha = String(form.get("senha") || "");
  const senhaCorreta = process.env.DASHBOARD_PASSWORD || "";

  if (senha && senhaCorreta && senha === senhaCorreta) {
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

  return NextResponse.redirect(new URL("/login?erro=1", req.url));
}
