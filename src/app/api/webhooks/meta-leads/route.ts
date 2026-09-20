import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { notificarLeadNovo } from '@/lib/notificacoes';
import { normalizarTelefone } from '@/lib/telefone';

const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || '';
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || '';

// Verificação do webhook (Meta chama isso uma vez ao configurar)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse('Forbidden', { status: 403 });
}

// Recebe os leads novos do Meta Lead Ads
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const entries = body.entry || [];

    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        if (change.field === 'leadgen') {
          const leadgenId = change.value?.leadgen_id;
          if (leadgenId && ACCESS_TOKEN) {
            const leadRes = await fetch(
              `https://graph.facebook.com/v19.0/${leadgenId}?access_token=${ACCESS_TOKEN}`
            );
            const leadData = await leadRes.json();
            const fieldData = leadData.field_data || [];
            const getField = (name: string) =>
              fieldData.find((f: any) => f.name === name)?.values?.[0] || null;

            const nome = getField('full_name') || getField('nome') || 'Lead Meta Ads';
            const telefone = getField('phone_number') || getField('telefone') || '';
            const telefoneNormalizado = normalizarTelefone(telefone);

            // Idempotência: a Meta reentrega webhooks quando duvida do 200.
            // Se o telefone já existe, NÃO insere de novo nem re-notifica —
            // responde 200 normal para a Meta parar de reenviar.
            if (telefoneNormalizado) {
              const [existente] = await query(
                `SELECT id FROM leads WHERE telefone_normalizado = $1 LIMIT 1`,
                [telefoneNormalizado]
              );
              if (existente) {
                continue;
              }

              try {
                await query(
                  `INSERT INTO leads (nome, telefone, telefone_normalizado, origem, fase, criado_em)
                   VALUES ($1, $2, $3, 'meta_ads', 'novo', NOW())`,
                  [nome, telefone, telefoneNormalizado]
                );

                // Avisa o dono do CRM no WhatsApp (fire-and-forget)
                notificarLeadNovo({ nome, telefone, origem: "meta_ads" }).catch(() => {});
              } catch (insertErr: any) {
                if (insertErr?.code !== '23505') throw insertErr;
                // Perdeu a corrida para outra entrega simultânea — ignora.
              }
            } else {
              // Sem telefone utilizável, cadastra mesmo assim (comportamento antigo)
              await query(
                `INSERT INTO leads (nome, telefone, origem, fase, criado_em)
                 VALUES ($1, $2, 'meta_ads', 'novo', NOW())`,
                [nome, telefone]
              );
            }
          }
        }
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (err: any) {
    console.error('Erro no webhook Meta Leads:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
