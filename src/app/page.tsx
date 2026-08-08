import { query } from "@/lib/db";

async function getMetricas() {
  const [{ total, atendidas, agendadas, custo }] = await query<{
    total: string;
    atendidas: string;
    agendadas: string;
    custo: string;
  }>(`
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE status = 'concluida') AS atendidas,
      COUNT(*) FILTER (WHERE resultado = 'agendou') AS agendadas,
      COALESCE(SUM(custo_estimado), 0) AS custo
    FROM chamadas
    WHERE iniciado_em > now() - interval '7 days'
  `);

  return {
    total: Number(total),
    atendidas: Number(atendidas),
    agendadas: Number(agendadas),
    custo: Number(custo),
  };
}

async function getChamadasRecentes() {
  return query(`
    SELECT c.id, l.nome AS lead_nome, camp.nome AS campanha_nome, c.resultado, a.sentimento
    FROM chamadas c
    LEFT JOIN leads l ON l.id = c.lead_id
    LEFT JOIN campanhas camp ON camp.id = c.campanha_id
    LEFT JOIN analises_chamada a ON a.chamada_id = c.id
    ORDER BY c.iniciado_em DESC
    LIMIT 10
  `);
}

export default async function DashboardPage() {
  const metricas = await getMetricas();
  const chamadas = await getChamadasRecentes();

  const cardStyle: React.CSSProperties = {
    background: "#fff",
    borderRadius: 8,
    padding: "1rem",
    border: "1px solid #e5e3da",
  };

  return (
    <div>
      <h1 style={{ fontSize: 18, fontWeight: 500, marginBottom: "1rem" }}>Últimos 7 dias</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: "1.5rem" }}>
        <div style={cardStyle}><p style={{ fontSize: 13, color: "#777" }}>Chamadas</p><p style={{ fontSize: 24, fontWeight: 500 }}>{metricas.total}</p></div>
        <div style={cardStyle}><p style={{ fontSize: 13, color: "#777" }}>Atendidas</p><p style={{ fontSize: 24, fontWeight: 500 }}>{metricas.atendidas}</p></div>
        <div style={cardStyle}><p style={{ fontSize: 13, color: "#777" }}>Agendamentos</p><p style={{ fontSize: 24, fontWeight: 500 }}>{metricas.agendadas}</p></div>
        <div style={cardStyle}><p style={{ fontSize: 13, color: "#777" }}>Custo total</p><p style={{ fontSize: 24, fontWeight: 500 }}>R$ {metricas.custo.toFixed(2)}</p></div>
      </div>

      <div style={cardStyle}>
        <p style={{ fontSize: 13, color: "#555", marginBottom: 10 }}>Chamadas recentes</p>
        <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ color: "#999", textAlign: "left" }}>
              <th style={{ padding: "6px 0" }}>Lead</th>
              <th>Campanha</th>
              <th>Resultado</th>
              <th>Sentimento</th>
            </tr>
          </thead>
          <tbody>
            {chamadas.map((c: any) => (
              <tr key={c.id} style={{ borderTop: "1px solid #eee" }}>
                <td style={{ padding: "8px 0" }}>{c.lead_nome ?? "—"}</td>
                <td>{c.campanha_nome ?? "—"}</td>
                <td>{c.resultado ?? "—"}</td>
                <td>{c.sentimento ?? "—"}</td>
              </tr>
            ))}
            {chamadas.length === 0 && (
              <tr><td colSpan={4} style={{ padding: "12px 0", color: "#999" }}>Nenhuma chamada ainda — rode db/seed.sql para ver dados de exemplo.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
