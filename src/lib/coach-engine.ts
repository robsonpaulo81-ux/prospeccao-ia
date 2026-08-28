import { query } from '@/lib/db';
// src/lib/coach-engine.ts
//
// Motor de coaching v2 — recebe o transcript acumulado de uma chamada e devolve
// sugestões acionáveis para o agente, via LLM.
//
// Requer a env var ANTHROPIC_API_KEY configurada na Vercel.
//
// v2.1: aceita opcionalmente um print da tela do agente (base64 JPEG) no
// momento da análise — usado pelo capturador Electron (VIGIA) para dar
// mais contexto ao motor (ex: o que está aberto no CRM, perfil do lead na tela).
//
// v2.2: consulta a tabela base_conhecimento (objeção/gatilho -> resposta) e
// injeta as entradas relevantes no prompt, para o motor priorizar respostas
// já validadas em vez de improvisar só em cima do transcript.

export type TurnoTranscricao = {
  speaker: "agente" | "lead";
  text: string;
};

export type Sugestao = {
  type:
    | "objecao"
    | "pergunta_qualificacao"
    | "sinal_de_compra"
    | "alerta"
    | "proxima_pergunta"
    | "pergunta_nao_respondida"
    | "clareza_comunicacao";
  priority: "alta" | "media" | "baixa";
  text: string;
};

const SYSTEM_PROMPT_TEMPLATE = `Você é um copiloto de vendas em tempo real. Você recebe o transcript de uma ligação
em andamento entre um SDR (agente) e um lead, e sua função é gerar sugestões curtas
e acionáveis para o agente usar na próxima fala.

CONTEXTO DA LIGAÇÃO: {call_context}

PERGUNTA REPETIDA DETECTADA: {repeated_question}

{screenshot_note}

REGRAS:
1. Responda SOMENTE em JSON válido, sem texto antes ou depois, sem markdown.
2. Gere no máximo 2 sugestões por vez — priorize a mais urgente.
3. Cada sugestão deve ter no máximo 20 palavras. Curta o suficiente para ler em 2 segundos.
4. Não sugira nada se a fala do lead for neutra/sem sinal claro (retorne suggestions: []).
5. Priorize nesta ordem: pergunta_nao_respondida (se repeated_question=true) > objeções >
   sinais de compra > clareza_comunicacao > perguntas de qualificação em aberto > alertas
   de condução.
6. Se PERGUNTA REPETIDA DETECTADA for true E o assunto for valor de parcela/entrada, a
   sugestão DEVE instruir o agente a dar uma FAIXA APROXIMADA de valor (não mais desviar
   pro especialista) — ex: "parcelas geralmente entre R$X e R$Y pra essa faixa de renda".
   Para outras perguntas repetidas (não sobre valores), gere tipo "pergunta_nao_respondida"
   com priority "alta" indicando que o lead está insistindo/impaciente.
7. Se o agente usou algum termo que claramente confundiu o lead (o lead pergunta "o que é
   isso?" ou reage com estranhamento a uma palavra/gíria), gere tipo "clareza_comunicacao"
   sugerindo reformular em linguagem simples.
8. Nunca invente informação sobre o lead que não esteja no transcript.
9. Se houver um print de tela anexado, use-o apenas como contexto de apoio (ex: dados do
   lead visíveis no CRM) — nunca deixe de seguir as regras acima por causa dele.
10. Tom da sugestão: direto, como uma anotação de colega experiente, não como script decorado.
11. Se houver uma seção "BASE DE CONHECIMENTO RELEVANTE" abaixo, priorize essas respostas
    já validadas em vez de improvisar — adapte o tom, mas não contrarie o conteúdo.

TRANSCRIPT ATÉ AGORA:
{transcript_so_far}

Gere as sugestões para a próxima fala do agente.`;

/**
 * Heurística barata (sem LLM) pra detectar se o lead está repetindo essencialmente
 * a mesma pergunta 2x seguidas sem ter recebido resposta direta do agente entre elas.
 */
function detectarPerguntaRepetida(transcript: TurnoTranscricao[]): boolean {
  const falasDoLead = transcript.filter((t) => t.speaker === "lead");
  if (falasDoLead.length < 2) return false;

  const ultima = normalizar(falasDoLead[falasDoLead.length - 1].text);
  const anterior = normalizar(falasDoLead[falasDoLead.length - 2].text);

  const palavrasUltima = new Set(ultima.split(" ").filter((w) => w.length > 3));
  const palavrasAnterior = new Set(anterior.split(" ").filter((w) => w.length > 3));
  const overlap = [...palavrasUltima].filter((w) => palavrasAnterior.has(w)).length;
  const menorConjunto = Math.min(palavrasUltima.size, palavrasAnterior.size) || 1;

  const similaridadeAlta = overlap / menorConjunto >= 0.4; // 40%+ de palavras-chave em comum
  const ambasSaoPerguntas = ultima.includes("?") && anterior.includes("?");

  return similaridadeAlta && ambasSaoPerguntas;
}

function normalizar(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/[^a-z0-9?\s]/g, "")
    .trim();
}

/**
 * Filtro barato pra evitar chamar o LLM quando a fala nova do lead é irrelevante
 * demais para gerar qualquer sugestão útil (ex: "é", "ok", "tá").
 */
function valeAPenaAnalisar(ultimaFalaLead: string): boolean {
  const limpo = normalizar(ultimaFalaLead);
  const numPalavras = limpo.split(" ").filter(Boolean).length;
  return numPalavras >= 3;
}

/**
 * Busca na base_conhecimento entradas ativas cujo gatilho bata com a última fala
 * do lead, e devolve um bloco de texto pronto para anexar ao transcript enviado
 * ao motor. Retorna string vazia se nada bater (o prompt fica igual a antes).
 */
async function buscarBaseConhecimento(transcriptRecente: string): Promise<string> {
  const resultado = await query(`
    SELECT categoria, conteudo, contexto
    FROM base_conhecimento
    WHERE ativo = true
    AND EXISTS (
      SELECT 1 FROM unnest(string_to_array(gatilho, ',')) AS palavra
      WHERE $1 ILIKE '%' || trim(palavra) || '%'
    )
  `, [transcriptRecente]);

  if (resultado.length === 0) return '';

  const entradas = resultado
    .map((r: any) => `- [${r.categoria}] ${r.conteudo}`)
    .join('\n');

  return `\n\nBASE DE CONHECIMENTO RELEVANTE (priorize isso ao gerar a sugestão):\n${entradas}`;
}

export async function gerarSugestoesCoach(params: {
  callContext: string;
  transcript: TurnoTranscricao[];
  /**
   * Print da tela do agente no momento da análise, em base64 (só os bytes,
   * sem o prefixo "data:image/jpeg;base64,"). Opcional — quando ausente,
   * o motor se comporta exatamente como antes (só texto).
   */
  screenshotBase64?: string;
}): Promise<Sugestao[]> {
  const { callContext, transcript, screenshotBase64 } = params;

  const ultimaFalaLead = [...transcript].reverse().find((t) => t.speaker === "lead");
  if (!ultimaFalaLead || !valeAPenaAnalisar(ultimaFalaLead.text)) {
    return [];
  }

  const perguntaRepetida = detectarPerguntaRepetida(transcript);

  const textoTranscript = transcript
    .map((t) => `${t.speaker}: ${t.text}`)
    .join("\n");

  const screenshotNote = screenshotBase64
    ? "Um print da tela do agente no momento atual está anexado a esta mensagem."
    : "Nenhum print de tela foi anexado desta vez.";

  const contextoBaseConhecimento = await buscarBaseConhecimento(ultimaFalaLead.text);

  const systemPrompt = SYSTEM_PROMPT_TEMPLATE.replace("{call_context}", callContext)
    .replace("{repeated_question}", String(perguntaRepetida))
    .replace("{screenshot_note}", screenshotNote)
    .replace("{transcript_so_far}", textoTranscript + contextoBaseConhecimento);

  // Monta o conteúdo da mensagem: texto sempre, imagem só se houver print.
  const userContent: any[] = [];
  if (screenshotBase64) {
    userContent.push({
      type: "image",
      source: { type: "base64", media_type: "image/jpeg", data: screenshotBase64 },
    });
  }
  userContent.push({
    type: "text",
    text: "Gere as sugestões agora, no formato JSON definido.",
  });

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY as string,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 300,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userContent,
        },
      ],
    }),
  });

  if (!response.ok) {
    console.error("Erro ao chamar Anthropic API:", await response.text());
    return [];
  }

  const data = await response.json();
  const textBlock = data.content?.find((b: any) => b.type === "text");
  if (!textBlock) return [];

  try {
    const cleaned = textBlock.text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return parsed.suggestions ?? [];
  } catch (err) {
    console.error("Falha ao parsear resposta do motor de coach:", err, textBlock.text);
    return [];
  }
}
