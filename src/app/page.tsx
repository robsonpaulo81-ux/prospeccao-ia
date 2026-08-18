export const dynamic = "force-dynamic";

import { query } from "@/lib/db";
import DashboardCharts from "./components/DashboardCharts";

const CORES_FASE: Record<string, { titulo: string; cor: string }> = {
  novo: { titulo: "Novo", cor: "#b4b2a9" },
  atendimento: { titulo: "Em atend.", cor: "#3b82c4" },
  interessado: { titulo: "Interessado", cor: "#0f9d78" },
  hot_lead: { titulo: "Hot lead", cor: "#e8973a" },
  restricao: { titulo: "Restrição", cor: "#c0392b" },
  sem_interesse: { titulo: "Sem interesse", cor: "#999" },
};

export default async function VisaoGeralPage() {
  const [totalLeads] = await query(`SELECT COUNT(*)::int AS total FROM leads`);
  const [totalIndicadores] = await query(
    `SELECT COUNT(DISTINCT indicado_por)::int AS total FROM leads WHERE indicado_por IS NOT NULL`
  );
  const [hotLeads] = await query(`SELECT COUNT(*)::int AS total FROM leads WHERE fase = 'hot_lead'`);
  const [indicacoesLeads] = await query(`SELECT COUNT(*)::int AS total FROM leads WHERE origem = 'indicacao'`);

  const porFase = await query(`
    SELECT fase, COUNT(*)::int AS total FROM leads GROUP BY fase
  `);

  const dadosFase = Object.entries(CORES_FASE).map(([fase, info]) => {
    const encontrado = porFase.find((f: any) => f.fase === fase);
    return { fase, titulo: info.titulo, cor: info.cor, total: encontrado ? encontrado.total : 0 };
  });

  const topIndicadores = await query(`
    SELECT i.nome, COUNT(l.id)::int AS total
    FROM indicadores i
    JOIN leads l ON l.indicado_por = i.id
    GROUP BY i.id
    ORDER BY total DESC
    LIMIT 5
  `);

  const cards = [
    { titulo: "Total de leads", valor: totalLeads.total, cor: "#3b82c4", bg: "#e6f1fb" },
    { titulo: "Hot leads 🔥", valor: hotLeads.total, cor: "#e8973a", bg: "#faeeda" },
    { titulo: "Indicadores ativos", valor: totalIndicadores.total, cor: "#0f9d78", bg: "#e1f5ee" },
    { titulo: "Leads por indicação", valor: indicacoesLeads.total, cor: "#8b5cf6", bg: "#f0ebfd" },
  ];

  return (
    <div>
      <h1 style={{ fontSize: 18, fontWeight: 500, marginBottom: "1.25rem" }}>Visão geral</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
        {cards.map((c) => (
          <div key={c.titulo} style={{ background: c.bg, borderRadius: 12, padding: "1rem" }}>
            <p style={{ fontSize: 12, color: c.cor, fontWeight: 600, marginBottom: 4 }}>{c.titulo}</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: "#222" }}>{c.valor}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        <DashboardCharts dadosFase={dadosFase} />

        <div style={{ background: "#fff", borderRadius: 12, padding: "1.25rem", border: "1px solid #e5e3da" }}>
          <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: "#333" }}>Top indicadores</p>
          {topIndicadores.length === 0 ? (
            <p style={{ fontSize: 13, color: "#999" }}>Nenhuma indicação ainda.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {topIndicadores.map((ind: any, i: number) => (
                <div key={ind.nome} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span>
                    {["🥇", "🥈", "🥉"][i] ?? "•"} {ind.nome}
                  </span>
                  <strong>{ind.total}</strong>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
