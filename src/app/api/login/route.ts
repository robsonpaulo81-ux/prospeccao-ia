import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const senha = String(form.get("senha") || "");
  const senhaCorreta = process.env.DASHBOARD_PASSWORD || "";

  if (senha && senha === senhaCorreta) {
    const resposta = NextResponse.redirect(new URL("/", req.url));
    resposta.cookies.set("crm_auth", senha, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 dias
      path: "/",
    });
    return resposta;
  }

  return NextResponse.redirect(new URL("/login?erro=1", req.url));
}
