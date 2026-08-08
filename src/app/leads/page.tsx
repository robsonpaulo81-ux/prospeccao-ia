import { query } from "@/lib/db";

export default async function LeadsPage() {
  const leads = await query(`SELECT * FROM leads ORDER BY criado_em DESC`);

  return (
    <div>
      <h1 style={{ fontSize: 18, fontWeight: 500, marginBottom: "1rem" }}>Leads</h1>

      <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse", background: "#fff", border: "1px solid #e5e3da", borderRadius: 8 }}>
        <thead>
          <tr style={{ color: "#999", textAlign: "left" }}>
            <th style={{ padding: "10px 12px" }}>Nome</th>
            <th>Empresa</th>
            <th>Origem</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((l: any) => (
            <tr key={l.id} style={{ borderTop: "1px solid #eee" }}>
              <td style={{ padding: "10px 12px" }}>{l.nome ?? l.telefone}</td>
              <td>{l.empresa ?? "—"}</td>
              <td>{l.origem ?? "—"}</td>
              <td>{l.status}</td>
            </tr>
          ))}
          {leads.length === 0 && (
            <tr><td colSpan={4} style={{ padding: "12px", color: "#999" }}>Nenhum lead ainda — rode db/seed.sql para ver exemplos.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
