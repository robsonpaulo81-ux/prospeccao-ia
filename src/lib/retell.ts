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

export type AnaliseChamada = {
  sentimento: "positivo" | "neutro" | "negativo";
  score_interesse: number;
  objecoes: string[];
  palavras_chave: string[];
  resumo: string;
  tipo_imovel: "casa" | "apartamento" | null;
  cidade_interesse: "aguas_lindas" | "brasilia" | null;
  tem_restricao: boolean;
  motivo_sem_interesse: "ja_comprou" | "interesse_futuro" | null;
  hot_lead: boolean;
};

const PROMPT_SISTEMA = `Você analisa transcrições de ligações de prospecção do programa Minha Casa Minha Vida (Caixa).
Responda APENAS com um JSON válido, sem markdown, sem texto antes ou depois, no formato exato:
{
  "sentimento": "positivo" | "neutro" | "negativo",
  "score_interesse": número de 0 a 1,
  "objecoes": [lista de objeções levantadas pelo lead, strings curtas],
  "palavras_chave": [lista de palavras-chave relevantes],
  "resumo": "resumo em até 2 frases",
  "tipo_imovel": "casa" | "apartamento" | null (null se não mencionado),
  "cidade_interesse": "aguas_lindas" | "brasilia" | null (null se não mencionado ou outra cidade),
  "tem_restricao": true se o lead mencionou nome sujo, CPF negativado, restrição no SPC/Serasa, ou dificuldade de aprovação de crédito; false caso contrário,
  "motivo_sem_interesse": "ja_comprou" | "interesse_futuro" | null (preencher só se o lead claramente não tem interesse agora),
  "hot_lead": true se o lead demonstrou interesse real, não tem restrição, e está pronto para avançar agora; false caso contrário
}`;

// Roda a análise comportamental pós-chamada usando a transcrição completa,
// via API da Anthropic (Claude).
export async function analisarChamada(transcricao: string): Promise<AnaliseChamada> {
  const fallback: AnaliseChamada = {
    sentimento: "neutro",
    score_interesse: 0.5,
    objecoes: [],
    palavras_chave: [],
    resumo: "Não foi possível analisar esta chamada automaticamente.",
    tipo_imovel: null,
    cidade_interesse: null,
    tem_restricao: false,
    motivo_sem_interesse: null,
    hot_lead: false,
  };

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 1000,
        system: PROMPT_SISTEMA,
        messages: [{ role: "user", content: `Transcrição da chamada:\n\n${transcricao}` }],
      }),
    });

    if (!res.ok) {
      console.error("Erro na API da Anthropic:", res.status, await res.text());
      return fallback;
    }

    const data = await res.json();
    const textoResposta = data.content?.find((b: any) => b.type === "text")?.text ?? "";
    const limpo = textoResposta.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(limpo);

    return {
      sentimento: parsed.sentimento ?? "neutro",
      score_interesse: typeof parsed.score_interesse === "number" ? parsed.score_interesse : 0.5,
      objecoes: Array.isArray(parsed.objecoes) ? parsed.objecoes : [],
      palavras_chave: Array.isArray(parsed.palavras_chave) ? parsed.palavras_chave : [],
      resumo: parsed.resumo ?? fallback.resumo,
      tipo_imovel: parsed.tipo_imovel ?? null,
      cidade_interesse: parsed.cidade_interesse ?? null,
      tem_restricao: Boolean(parsed.tem_restricao),
      motivo_sem_interesse: parsed.motivo_sem_interesse ?? null,
      hot_lead: Boolean(parsed.hot_lead),
    };
  } catch (err) {
    console.error("Erro processando análise da chamada:", err);
    return fallback;
  }
}
