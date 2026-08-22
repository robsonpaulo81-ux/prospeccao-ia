// src/app/api/voice/outbound/route.ts
//
// Este é o endpoint configurado no campo "Voice Request URL" da TwiML App
// no console da Twilio. Toda vez que alguém aperta "Ligar" no discador do
// navegador, a Twilio chama ESTE endpoint perguntando "para onde eu ligo?"
// — a resposta é um XML (TwiML) instruindo a Twilio a discar o número
// desejado, usando o número principal (3530) como identificador de quem
// está ligando (Caller ID).
import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";

const VoiceResponse = twilio.twiml.VoiceResponse;

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const numeroDestino = formData.get("To") as string | null;

  const twiml = new VoiceResponse();

  if (!numeroDestino) {
    twiml.say(
      { language: "pt-BR" },
      "Número de destino não informado. Encerrando a chamada."
    );
    return new NextResponse(twiml.toString(), {
      headers: { "Content-Type": "text/xml" },
    });
  }

  const dial = twiml.dial({
    // Número que aparece no identificador de chamadas de quem recebe
    callerId: "+556136863530",
    // Passa o call SID para o webhook de status conseguir identificar
    // essa ligação depois (usado pelo live coach para achar as
    // sugestões certas na tela)
    answerOnBridge: true,
  });
  dial.number(numeroDestino);

  return new NextResponse(twiml.toString(), {
    headers: { "Content-Type": "text/xml" },
  });
}
