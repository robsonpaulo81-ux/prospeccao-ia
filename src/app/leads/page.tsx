export const dynamic = "force-dynamic";

import { query } from "@/lib/db";
import KanbanBoard from "./KanbanBoard";

export default async function LeadsPage() {
  const leads = await query(`
    SELECT id, nome, fase, tipo_imovel, cidade_interesse, tem_restricao, motivo_sem_interesse
    FROM leads
    ORDER BY fase_atualizada_em DESC
  `);

  return (
    <div>
      <h1 style={{ fontSize: 18, fontWeight: 500, marginBottom: "1rem" }}>Leads</h1>
      <KanbanBoard leadsIniciais={leads} />
    </div>
  );
}
