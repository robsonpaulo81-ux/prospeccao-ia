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
   sugestão DEVE
