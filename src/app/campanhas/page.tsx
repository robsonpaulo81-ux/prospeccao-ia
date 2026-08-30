import { query } from "@/lib/db";
export default async function CampanhasPage() {
  const campanhas = await query(`SELECT id, nome, canal, ativa FROM campanhas ORDER BY criado_em DESC`);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h1 style={{ fontSize: 18, fontWeight: 500 }}>Campanhas</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <a href="https://dashboard.retellai.com" target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, padding: "6px 12px", border: "1px solid #333", borderRadius: 6, textDecoration: "none", color: "#fff", background: "#333" }}>
            📞 Painel de Ligação IA
          </a>
          <a href="/campanhas/nova" style={{ fontSize: 13, padding: "6px 12px", border: "1px solid #ccc", borderRadius: 6, textDecoration: "none", color: "#333" }}>
            + Nova campanha
          </a>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {campanhas.map((c: any) => (
          <div key={c.id} style={{ background: "#fff", border: "1px solid #e5e3da", borderRadius: 8, padding: "14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 500 }}>{c.nome}</span>
              <span style={{ fontSize: 12, color: c.ativa ? "#2a7" : "#999" }}>{c.ativa ? "Ativa" : "Pausada"}</span>
            </div>
            <p style={{ fontSize: 12, color: "#777", margin: "4px 0 0" }}>Canal: {c.canal}</p>
          </div>
        ))}
        {campanhas.length === 0 && <p style={{ color: "#999", fontSize: 13 }}>Nenhuma campanha ainda.</p>}
      </div>
    </div>
  );
}
