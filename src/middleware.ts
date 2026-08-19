import { NextRequest, NextResponse } from "next/server";

// Caminhos que continuam públicos, sem exigir senha:
// - /login (a própria página de login)
// - /api/login (processa o login)
// - /indicar/* (o formulário público de indicação)
// - /api/indicacao (recebe as indicações)
// - /api/upload (recebe os documentos anexados)
const CAMINHOS_PUBLICOS = ["/login", "/api/login", "/indicar", "/api/indicacao", "/api/upload"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const ehPublico = CAMINHOS_PUBLICOS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  if (ehPublico) {
    return NextResponse.next();
  }

  const senhaCorreta = process.env.DASHBOARD_PASSWORD || "";
  const cookie = req.cookies.get("crm_auth")?.value;

  if (senhaCorreta && cookie === senhaCorreta) {
    return NextResponse.next();
  }

  const urlLogin = new URL("/login", req.url);
  return NextResponse.redirect(urlLogin);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:jpg|jpeg|png|svg|css|js)$).*)"],
};
