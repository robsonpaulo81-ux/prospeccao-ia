import React from "react";
import { query } from "@/lib/db";

const LABEL_ATENDIMENTO: Record<string, string> = {
  atendida: "Atendida",
  nao_atendida: "Não atendida",
  recusada: "Recusada",
  teste: "Ligação teste",
};

const COR_ATENDIMENTO: Record<string, string> = {
  atendida: "#2a7",
  nao_atendida: "#c99b1c",
  recusada: "#c0392b",
  teste: "#888",
};

export default async function CampanhasPage() {
  const campanhas = await query(`SELECT id, nome, canal, ativa FROM campanhas ORDER BY criado_em DESC`);

  const contadores = await query(`
    SELECT resultado_atendimento, COUNT(*)::int AS total
    FROM chamadas
    WHERE resultado_atendimento IS NOT NULL
    GROUP BY resultado_atendimento
  `);

  const contadorPorTipo: Record<string, number> = { atendida: 0, nao_atendida: 0, recusada: 0, teste: 0 };
  for (const c of contadores as any[]) {
    contadorPorTipo[c.resultado_atendimento] = c.total;
  }

  const chamadasRecentes = await query(`
    SELECT c.id, c.resultado_atendimento, c.duracao_segundos, c.finalizado_em,
           l.nome AS lead_nome, camp.nome AS campanha_nome
    FROM chamadas c
    LEFT JOIN leads l ON l.id = c.lead_id
    LEFT JOIN campanhas camp ON camp.id = c.campanha_id
    WHERE c.finalizado_em IS NOT NULL
    ORDER BY c.finalizado_em DESC
    LIMIT 15
  `);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h1 style={{ fontSize: 18, fontWeight: 500 }}>Campanhas</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <a href="https://dashboard.retellai.com" target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, padding: "6px 12px", border: "1px solid #333", borderRadius: 6, textDecoration: "none", color: "#fff", background: "#333" }}>
            📞 Painel de Ligação IA
          </a>
          <a href="/mensagens" style={{ fontSize: 13, padding: "6px 12px", border: "1px solid #333", borderRadius: 6, textDecoration: "none", color: "#fff", background: "#333" }}>
            💬 Painel Mensagens IA
          </a>
        </div>
      </div>

      {/* Dashboard de chamadas */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: "1.5rem" }}>
        {(["atendida", "nao_atendida", "recusada", "teste"] as const).map((tipo) => (
          <div key={tipo} style={{ background: "#fff", border: "1px solid #e5e3da", borderRadius: 8, padding: "14px 16px" }}>
            <p style={{ fontSize: 12, color: "#777", marginBottom: 4 }}>{LABEL_ATENDIMENTO[tipo]}</p>
            <p style={{ fontSize: 26, fontWeight: 600, color: COR_ATENDIMENTO[tipo] }}>{contadorPorTipo[tipo]}</p>
          </div>
        ))}
      </div>

      {/* Lista de campanhas */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: "1.5rem" }}>
        {(campanhas as any[]).map((c) => (
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

      {/* Histórico de chamadas finalizadas */}
      <div style={{ background: "#fff", border: "1px solid #e5e3da", borderRadius: 8, padding: "1rem" }}>
        <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>Últimas ligações</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {(chamadasRecentes as any[]).map((c) =>
            React.createElement(
              "a",
              {
                key: c.id,
                href: `/chamadas/${c.id}`,
                style: {
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  textDecoration: "none",
                  color: "#333",
                  padding: "8px 0",
                  borderBottom: "1px solid #f0efe9",
                  fontSize: 13,
                },
              },
              React.createElement(
                "span",
                null,
                c.lead_nome ?? "Lead sem nome",
                " ",
                React.createElement("span", { style: { color: "#999" } }, "· ", c.campanha_nome ?? "sem campanha")
              ),
              React.createElement(
                "span",
                { style: { display: "flex", alignItems: "center", gap: 10 } },
                c.duracao_segundos != null &&
                  React.createElement(
                    "span",
                    { style: { color: "#999", fontSize: 12 } },
                    `${Math.floor(c.duracao_segundos / 60)}m${String(c.duracao_segundos % 60).padStart(2, "0")}s`
                  ),
                React.createElement(
                  "span",
                  { style: { color: COR_ATENDIMENTO[c.resultado_atendimento] ?? "#999", fontWeight: 500 } },
                  LABEL_ATENDIMENTO[c.resultado_atendimento] ?? "—"
                )
              )
            )
          )}
          {chamadasRecentes.length === 0 && <p style={{ color: "#999", fontSize: 13 }}>Nenhuma ligação finalizada ainda.</p>}
        </div>
      </div>
    </div>
  );
}
