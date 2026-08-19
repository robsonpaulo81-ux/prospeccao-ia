export const dynamic = "force-dynamic";

import { query } from "@/lib/db";
import KanbanBoard from "./KanbanBoard";
import ExportButtons from "../components/ExportButtons";
import AutoAtualizar from "../components/AutoAtualizar";

export default async function LeadsPage() {
  const leads = await query(`
    SELECT id, nome, telefone, fase, tipo_imovel, cidade_interesse, tem_restricao, motivo_sem_interesse, documento_url, notas
    FROM leads
    ORDER BY fase_atualizada_em DESC
  `);

  return (
    <div>
      <AutoAtualizar />
      <h1 style={{ fontSize: 18, fontWeight: 500, marginBottom: "1rem" }}>Leads</h1>
      <ExportButtons csvUrl="/api/export/leads" />
      <KanbanBoard leadsIniciais={leads} />
    </div>
  );
}
