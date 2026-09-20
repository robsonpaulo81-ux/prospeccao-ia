"use client";
import { useMemo, useState } from "react";
import KanbanBoard from "./KanbanBoard";
import ListaLeads from "./ListaLeads";
import FollowUpPanel from "./FollowUpPanel";

export default function LeadsView({
  leadsIniciais,
  diasFollowUp,
}: {
  leadsIniciais: any[];
  diasFollowUp: number;
}) {
  const [modo, setModo] = useState<"kanban" | "lista">("kanban");
  const [busca, setBusca] = useState("");

  // Busca simples por nome, telefone e notas — ignora acentos e maiúsculas.
  const leadsFiltrados = useMemo(() => {
    const termo = busca
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .trim();
    if (!termo) return leadsIniciais;
    const termos = termo.split(/s+/);
    return leadsIniciais.filter((lead) => {
      const alvo = [lead.nome, lead.telefone, lead.notas]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "");
      return termos.every((t) => alvo.includes(t));
    });
  }, [leadsIniciais, busca]);

  return (
    <div>
      <FollowUpPanel leads={leadsFiltrados} limiteDias={diasFollowUp} />
      <div style={{ display: "flex", gap: 6, marginBottom: 12, alignItems: "center", flexWrap: "wrap" }}>
        <button
          onClick={() => setModo("kanban")}
          style={{
            fontSize: 12,
            padding: "5px 12px",
            border: "1px solid var(--accent-2)",
            borderRadius: 4,
            background: modo === "kanban" ? "var(--accent-2)" : "transparent",
            color: modo === "kanban" ? "#1a1a1a" : "var(--text)",
            cursor: "pointer",
          }}
        >
          Kanban
        </button>
        <button
          onClick={() => setModo("lista")}
          style={{
            fontSize: 12,
            padding: "5px 12px",
            border: "1px solid var(--accent-2)",
            borderRadius: 4,
            background: modo === "lista" ? "var(--accent-2)" : "transparent",
            color: modo === "lista" ? "#1a1a1a" : "var(--text)",
            cursor: "pointer",
          }}
        >
          Lista
        </button>
        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome, telefone ou notas..."
          style={{
            flex: 1,
            minWidth: 200,
            maxWidth: 360,
            fontSize: 13,
            padding: "6px 10px",
            border: "1px solid var(--border)",
            borderRadius: 4,
            background: "var(--card-bg)",
            color: "var(--text)",
          }}
        />
        {busca && (
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {leadsFiltrados.length} de {leadsIniciais.length}
          </span>
        )}
      </div>
      {modo === "kanban" ? (
        <KanbanBoard leadsIniciais={leadsFiltrados} />
      ) : (
        <ListaLeads leads={leadsFiltrados} />
      )}
    </div>
  );
}
