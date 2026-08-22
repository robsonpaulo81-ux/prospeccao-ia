// src/app/api/voice/token/route.ts
//
// Gera um Access Token temporário do Twilio, usado pelo navegador para
// se autenticar e fazer ligações via Twilio Voice SDK (WebRTC).
//
// O painel/dashboard chama esse endpoint ao carregar a tela do discador,
// pega o token, e usa ele para inicializar o Device do Voice SDK.
import { NextResponse } from "next/server";
import twilio from "twilio";

const AccessToken = twilio.jwt.AccessToken;
const VoiceGrant = AccessToken.VoiceGrant;

export async function GET() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID!;
  const apiKeySid = process.env.TWILIO_API_KEY_SID!;
  const apiKeySecret = process.env.TWILIO_API_KEY_SECRET!;
  const twimlAppSid = process.env.TWILIO_TWIML_APP_SID!;

  if (!accountSid || !apiKeySid || !apiKeySecret || !twimlAppSid) {
    return NextResponse.json(
      { error: "Variáveis de ambiente da Twilio não configuradas." },
      { status: 500 }
    );
  }

  // Identifica quem está pegando o token — por enquanto um valor fixo,
  // mas isso pode virar o ID do usuário logado quando o discador for
  // usado por mais de uma pessoa.
  const identity = "robson";

  const accessToken = new AccessToken(accountSid, apiKeySid, apiKeySecret, {
    identity,
    ttl: 3600, // token válido por 1 hora
  });

  const voiceGrant = new VoiceGrant({
    outgoingApplicationSid: twimlAppSid,
    incomingAllow: false, // por enquanto só ligações de saída
  });

  accessToken.addGrant(voiceGrant);

  return NextResponse.json({ token: accessToken.toJwt(), identity });
}
