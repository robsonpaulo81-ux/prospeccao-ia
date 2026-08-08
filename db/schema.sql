-- Prospecção IA — schema do banco de dados
-- Requer PostgreSQL 13+ (usa gen_random_uuid, disponível via pgcrypto)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Leads/contatos a serem prospectados
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255),
  telefone VARCHAR(20) NOT NULL,
  empresa VARCHAR(255),
  origem VARCHAR(100),
  status VARCHAR(50) DEFAULT 'novo',
  tags TEXT[],
  criado_em TIMESTAMPTZ DEFAULT now(),
  atualizado_em TIMESTAMPTZ DEFAULT now()
);

-- Campanhas de prospecção
CREATE TABLE IF NOT EXISTS campanhas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  prompt_base TEXT NOT NULL,
  voice_id VARCHAR(255),
  retell_agent_id VARCHAR(255),
  canal VARCHAR(20) NOT NULL DEFAULT 'voz',
  ativa BOOLEAN DEFAULT true,
  horario_inicio TIME DEFAULT '09:00',
  horario_fim TIME DEFAULT '18:00',
  criado_em TIMESTAMPTZ DEFAULT now()
);

-- Cada ligação/interação individual
CREATE TABLE IF NOT EXISTS chamadas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  retell_call_id VARCHAR(255) UNIQUE,
  lead_id UUID REFERENCES leads(id),
  campanha_id UUID REFERENCES campanhas(id),
  canal VARCHAR(20) NOT NULL DEFAULT 'voz',
  status VARCHAR(50) DEFAULT 'discando',
  duracao_segundos INT,
  gravacao_url TEXT,
  transcricao TEXT,
  resultado VARCHAR(50),
  iniciado_em TIMESTAMPTZ,
  finalizado_em TIMESTAMPTZ,
  custo_estimado NUMERIC(10,4)
);

-- Análise comportamental extraída de cada chamada
CREATE TABLE IF NOT EXISTS analises_chamada (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chamada_id UUID REFERENCES chamadas(id) UNIQUE,
  sentimento VARCHAR(20),
  score_interesse NUMERIC(3,2),
  objecoes TEXT[],
  palavras_chave TEXT[],
  tempo_ate_objecao_seg INT,
  resumo TEXT,
  criado_em TIMESTAMPTZ DEFAULT now()
);

-- Eventos granulares (para funil e replay da conversa)
CREATE TABLE IF NOT EXISTS eventos_chamada (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chamada_id UUID REFERENCES chamadas(id),
  tipo VARCHAR(50),
  conteudo TEXT,
  timestamp_ms INT,
  criado_em TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_chamadas_campanha ON chamadas(campanha_id);
CREATE INDEX IF NOT EXISTS idx_chamadas_status ON chamadas(status);
CREATE INDEX IF NOT EXISTS idx_chamadas_iniciado_em ON chamadas(iniciado_em);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_eventos_chamada_id ON eventos_chamada(chamada_id);

-- View agregada para o dashboard (evita recalcular tudo em tempo real)
CREATE MATERIALIZED VIEW IF NOT EXISTS funil_diario AS
SELECT
  DATE(iniciado_em) AS dia,
  campanha_id,
  COUNT(*) AS total_chamadas,
  COUNT(*) FILTER (WHERE status = 'concluida') AS atendidas,
  COUNT(*) FILTER (WHERE resultado = 'agendou') AS agendadas,
  ROUND(AVG(duracao_segundos), 0) AS duracao_media
FROM chamadas
WHERE iniciado_em IS NOT NULL
GROUP BY DATE(iniciado_em), campanha_id;

-- Para atualizar a view depois de novas chamadas, rode periodicamente (cron/job):
-- REFRESH MATERIALIZED VIEW funil_diario;
