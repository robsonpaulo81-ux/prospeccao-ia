// Cliente da API do Retell — cobre o essencial: criar chamada outbound e
// processar a análise pós-chamada. Preencha RETELL_API_KEY no .env.local.
// Docs oficiais: https://docs.retellai.com

const RETELL_BASE_URL = "https://api.retellai.com";

function headers() {
  return {
    Authorization: `Bearer ${process.env.RETELL_API_KEY}`,
    "Content-Type": "application/json",
  };
}

// Dispara uma chamada outbound para um lead usando o agente configurado
export async function criarChamadaOutbound(params: {
  telefone: string;
  agentId?: string;
  metadata?: Record<string, unknown>;
}) {
  const res = await fetch(`${RETELL_BASE_URL}/v2/create-phone-call`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      from_number: process.env.RETELL_FROM_NUMBER,
      to_number: params.telefone,
      override_agent_id: params.agentId ?? process.env.RETELL_AGENT_ID,
      metadata: params.metadata,
    }),
  });

  if (!res.ok) {
    throw new Error(`Falha ao criar chamada no Retell: ${res.status} ${await res.text()}`);
  }

  return res.json();
}

// Busca detalhes de uma chamada específica (usado após o webhook de "call_ended")
export async function buscarChamada(retellCallId: string) {
  const res = await fetch(`${RETELL_BASE_URL}/v2/get-call/${retellCallId}`, {
    headers: headers(),
  });

  if (!res.ok) {
    throw new Error(`Falha ao buscar chamada no Retell: ${res.status}`);
  }

  return res.json();
}

// Roda a análise comportamental pós-chamada usando a transcrição completa.
// Aqui você chamaria seu LLM de preferência (Claude, GPT-4o etc) com um prompt
// pedindo sentimento, score de interesse, objeções e resumo em JSON.
// Deixado como stub para você plugar a chamada de LLM que preferir.
export async function analisarChamada(transcricao: string) {
  // Exemplo do formato de retorno esperado, para preencher analises_chamada:
  return {
    sentimento: "neutro" as "positivo" | "neutro" | "negativo",
    score_interesse: 0.5,
    objecoes: [] as string[],
    palavras_chave: [] as string[],
    resumo: "Análise ainda não implementada — plugue seu LLM aqui.",
  };
}
