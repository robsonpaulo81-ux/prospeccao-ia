"use client";
import { useState } from "react";
import KanbanBoard from "./KanbanBoard";
import ListaLeads from "./ListaLeads";
export default function LeadsView({ leadsIniciais }: { leadsIniciais: any[] }) {
  const [modo, setModo] = useState<"kanban" | "lista">("kanban");
  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
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
      </div>
      {modo === "kanban" ? (
        <KanbanBoard leadsIniciais={leadsIniciais} />
      ) : (
        <ListaLeads leads={leadsIniciais} />
      )}
    </div>
  );
}
