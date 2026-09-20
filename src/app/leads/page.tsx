export const dynamic = "force-dynamic";

import { query } from "@/lib/db";
import LeadsView from "./LeadsView";
import ExportButtons from "../components/ExportButtons";
import AutoAtualizar from "../components/AutoAtualizar";
import NovoLeadForm from "./NovoLeadForm";

// Quantos dias sem atividade um lead interessado/hot lead é considerado parado
// para follow-up. Centralizado aqui — mudar o limite de negócio é mudar só isto.
const DIAS_FOLLOW_UP = 7;

export default async function LeadsPage() {
  const leads = await query(`
    SELECT l.id, l.nome, l.telefone, l.fase, l.tipo_imovel, l.cidade_interesse, l.tem_restricao, l.motivo_sem_interesse, l.documento_url, l.notas,
           l.criado_em,
           (CURRENT_DATE - (l.criado_em AT TIME ZONE 'America/Sao_Paulo')::date) AS dias_desde_indicacao,
           ultima_atividade.ua,
           (EXTRACT(EPOCH FROM (now() - ultima_atividade.ua)) / 86400)::int AS dias_sem_atividade
    FROM leads l
    LEFT JOIN LATERAL (
      SELECT GREATEST(
        COALESCE((SELECT MAX(criado_em) FROM lead_eventos WHERE lead_id = l.id), l.fase_atualizada_em, l.criado_em),
        l.fase_atualizada_em,
        l.criado_em
      ) AS ua
    ) ultima_atividade ON true
    ORDER BY l.fase_atualizada_em DESC
    LIMIT 1000
  `);

  return (
    <div>
      <AutoAtualizar />
      <h1 style={{ fontSize: 18, fontWeight: 500, marginBottom: "1rem" }}>Leads</h1>
      <ExportButtons csvUrl="/api/export/leads" />
      <NovoLeadForm />
            <LeadsView leadsIniciais={leads} diasFollowUp={DIAS_FOLLOW_UP} />
    </div>
  );
}
