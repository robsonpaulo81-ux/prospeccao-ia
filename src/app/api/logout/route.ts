import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const resposta = NextResponse.redirect(new URL("/login", req.url));
  resposta.cookies.set(AUTH_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return resposta;
}

export async function GET(req: NextRequest) {
  return POST(req);
}
