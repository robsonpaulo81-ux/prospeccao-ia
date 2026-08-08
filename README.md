# Prospecção IA

App de prospecção com agentes de IA de voz (Retell + ElevenLabs) e texto, com dashboard de análise comportamental.

## Stack

- **Frontend/backend**: Next.js 14 (App Router) + TypeScript
- **Banco**: PostgreSQL
- **Voz**: Retell AI (orquestração) + ElevenLabs (voz clonada)
- **Deploy sugerido**: Vercel (app) + Supabase ou Neon (Postgres gerenciado)

## O que já vem pronto neste scaffold

- Schema completo do banco (`db/schema.sql`) com leads, campanhas, chamadas, análises e eventos
- Dados de exemplo (`db/seed.sql`) para você ver o dashboard funcionando antes de plugar o Retell de verdade
- Cliente de conexão com o banco (`src/lib/db.ts`)
- Cliente stub da API do Retell (`src/lib/retell.ts`) — funções prontas, só faltam suas chaves
- Endpoint de webhook (`src/app/api/webhooks/retell/route.ts`) que recebe eventos de chamada e grava no banco
- Rotas de API para campanhas, leads e chamadas
- Páginas do dashboard: visão geral, campanhas, nova campanha, leads, detalhe de chamada
- View materializada `funil_diario` para as métricas do dashboard não recalcularem tudo em tempo real

## O que falta você configurar

1. **Banco de dados**: suba um Postgres (local via Docker, ou um serviço gerenciado como Neon/Supabase — têm tier gratuito)
2. **Conta no Retell**: retellai.com → pegar API key
3. **Conectar seu voice_id do ElevenLabs** dentro do agente no Retell (você já tem o clone pronto)
4. **Variáveis de ambiente**: copiar `.env.example` para `.env.local` e preencher

## Passo a passo para rodar localmente

```bash
# 1. Instalar dependências (requer Node 18+)
npm install

# 2. Subir um Postgres local (se não tiver um gerenciado ainda)
docker compose up -d

# 3. Criar as tabelas
psql $DATABASE_URL -f db/schema.sql

# 4. (Opcional) popular com dados de exemplo pra ver o dashboard funcionando
psql $DATABASE_URL -f db/seed.sql

# 5. Configurar variáveis de ambiente
cp .env.example .env.local
# edite .env.local com sua DATABASE_URL, RETELL_API_KEY, ELEVENLABS_VOICE_ID

# 6. Rodar em desenvolvimento
npm run dev
```

Acesse http://localhost:3000

## Conectar o Retell de verdade

1. Crie o agente no Retell (Dashboard → LLM → Create LLM), usando o prompt de `docs/prompt-agente.md` (o mesmo que já te entreguei antes)
2. No seletor de voz do agente, adicione seu voice_id do ElevenLabs
3. Compre um número em Phone Numbers → Buy Number (mais simples que importar do Twilio pra começar)
4. Em Settings → Webhooks, aponte o webhook de eventos para:
   `https://SEU-DOMINIO/api/webhooks/retell`
5. Preencha `RETELL_API_KEY` e `RETELL_AGENT_ID` no `.env.local`

A partir daí, toda chamada feita pelo Retell vai gravar automaticamente em `chamadas` e `eventos_chamada`, e você pode rodar o job de análise (ver `src/lib/retell.ts`, função `analisarChamada`) pra popular `analises_chamada`.

## Estrutura de pastas

```
src/
  app/
    page.tsx                    -> Dashboard (visão geral)
    campanhas/page.tsx          -> Lista de campanhas
    campanhas/nova/page.tsx     -> Criar campanha
    leads/page.tsx              -> Lista de leads
    chamadas/[id]/page.tsx      -> Detalhe de uma chamada
    api/
      webhooks/retell/route.ts  -> Recebe eventos do Retell
      campanhas/route.ts        -> CRUD de campanhas
      leads/route.ts            -> CRUD de leads + import CSV
      chamadas/route.ts         -> Lista chamadas
      analytics/funil/route.ts  -> Métricas agregadas do funil
  lib/
    db.ts                       -> Pool de conexão Postgres
    retell.ts                   -> Cliente da API do Retell
db/
  schema.sql                    -> Todas as tabelas e índices
  seed.sql                      -> Dados de exemplo
```

## Próximos passos sugeridos

- Autenticação (NextAuth ou Clerk) antes de colocar em produção
- Rate limiting no endpoint de webhook
- Fila (ex: BullMQ) para o job de análise pós-chamada, em vez de rodar síncrono
- App de texto/WhatsApp como segundo canal, reusando o mesmo prompt-base
