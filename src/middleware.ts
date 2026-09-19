import { NextRequest, NextResponse } from "next/server";
import { tokenValido, AUTH_COOKIE } from "@/lib/auth";

// Caminhos que continuam públicos, sem exigir senha:
// - /login (a própria página de login)
// - /api/login (processa o login)
// - /api/logout (encerra a sessão)
// - /indicar/* (o formulário público de indicação)
// - /api/indicacao (recebe as indicações)
// - /api/upload (recebe os documentos anexados)
// - /api/webhooks (recebe eventos do Retell, sem login)
// - /api/coach (recebe transcript/print do app Live Coach, sem login)
const CAMINHOS_PUBLICOS = ["/login", "/api/login", "/api/logout", "/indicar", "/api/indicacao", "/api/upload", "/api/webhooks", "/api/coach"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ehPublico = CAMINHOS_PUBLICOS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  if (ehPublico) {
    return NextResponse.next();
  }

  // Token assinado (HMAC) em vez da senha em texto plano no cookie —
  // ver src/lib/auth.ts. Se DASHBOARD_PASSWORD mudar, todos os tokens antigos
  // param de valer sozinhos.
  const cookie = req.cookies.get(AUTH_COOKIE)?.value;
  if (await tokenValido(cookie, process.env.DASHBOARD_PASSWORD || "")) {
    return NextResponse.next();
  }

  const urlLogin = new URL("/login", req.url);
  return NextResponse.redirect(urlLogin);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\.(?:jpg|jpeg|png|svg|css|js)$).*)"],
};
