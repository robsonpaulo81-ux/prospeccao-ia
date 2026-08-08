-- Dados de exemplo — rode depois de schema.sql para ver o dashboard populado

INSERT INTO campanhas (id, nome, prompt_base, voice_id, canal, ativa)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Q3 outbound', 'Você é um SDR consultivo...', 'SEU_VOICE_ID_ELEVENLABS', 'voz', true),
  ('22222222-2222-2222-2222-222222222222', 'Leads inbound site', 'Você é um SDR consultivo...', 'SEU_VOICE_ID_ELEVENLABS', 'voz', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO leads (id, nome, telefone, empresa, origem, status)
VALUES
  ('33333333-3333-3333-3333-333333333333', 'Marcos Silva', '+5511999990001', 'Acme Ltda', 'CSV import', 'agendado'),
  ('44444444-4444-4444-4444-444444444444', 'Ana Ferreira', '+5511999990002', 'Beta Corp', 'CRM', 'perdido'),
  ('55555555-5555-5555-5555-555555555555', 'João Pereira', '+5511999990003', 'Delta SA', 'Formulário', 'em_contato')
ON CONFLICT (id) DO NOTHING;

INSERT INTO chamadas (id, lead_id, campanha_id, canal, status, duracao_segundos, transcricao, resultado, iniciado_em, finalizado_em, custo_estimado)
VALUES
  (
    'a1111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    'voz', 'concluida', 268,
    'Agente: Oi Marcos, tudo bem? [...] Marcos: Tá, manda uma proposta então, bora marcar uma call.',
    'agendou', now() - interval '2 hours', now() - interval '2 hours' + interval '268 seconds', 0.32
  ),
  (
    'a2222222-2222-2222-2222-222222222222',
    '44444444-4444-4444-4444-444444444444',
    '11111111-1111-1111-1111-111111111111',
    'voz', 'concluida', 95,
    'Agente: Oi Ana [...] Ana: Não tenho interesse agora, obrigada.',
    'recusou', now() - interval '1 day', now() - interval '1 day' + interval '95 seconds', 0.11
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO analises_chamada (chamada_id, sentimento, score_interesse, objecoes, resumo)
VALUES
  ('a1111111-1111-1111-1111-111111111111', 'positivo', 0.82, ARRAY['preço'], 'Lead levantou objeção de preço logo no início, mas reverteu após o agente redirecionar para valor. Fechou pedindo proposta e call.'),
  ('a2222222-2222-2222-2222-222222222222', 'neutro', 0.15, ARRAY['sem tempo agora'], 'Lead encerrou rapidamente sem abrir espaço para argumentação.')
ON CONFLICT (chamada_id) DO NOTHING;

REFRESH MATERIALIZED VIEW funil_diario;
