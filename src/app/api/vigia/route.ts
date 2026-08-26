import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages } = body;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 500,
        system:
          'Você é a VIGIA, uma assistente de voz em português do Brasil que enxerga a tela do usuário em tempo real através de capturas de tela. Responda de forma natural, direta e curta, como numa conversa falada (evite listas, markdown ou formatação — isso será lido em voz alta). Comente o que vê na tela quando for relevante para a pergunta. Se a tela não ajudar a responder, responda normalmente com seu conhecimento geral.',
        messages,
      }),
    });

    const data = await response.json();

    if (data.error) {
      return NextResponse.json({ error: data.error.message || 'erro da API' }, { status: 500 });
    }

    const textBlock = (data.content || []).find((b: any) => b.type === 'text');
    const answer = textBlock ? textBlock.text : '(sem resposta)';

    return NextResponse.json({ answer });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'erro desconhecido' }, { status: 500 });
  }
}
