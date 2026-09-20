"use client";
import { WhatsAppButton, faseTitulo } from "./WhatsAppButton";

// Painel de follow-up: leads interessados/hot que esfriaram — sem atividade
// há dias_sem_atividade >= limite. Mostra sempre, acima do Kanban/Lista.
const FASES_FIRMWARE = ["interessado", "hot_lead"];

export default function FollowUpPanel({
  leads,
  limiteDias,
}: {
  leads: any[];
  limiteDias: number;
}) {
  const parados = leads
    .filter(
      (l) =>
        FASES_FIRMWARE.includes(l.fase) &&
        l.dias_sem_atividade != null &&
        l.dias_sem_atividade >= limiteDias
    )
    .sort((a, b) => {
      // hot leads parados primeiro, depois os mais tempo sem contato
      if (a.fase !== b.fase) return a.fase === "hot_lead" ? -1 : 1;
      return b.dias_sem_atividade - a.dias_sem_atividade;
    })
    .slice(0, 8);

  if (parados.length === 0) return null;

  return (
    <div
      style={{
        background: "#fff8e6",
        border: "1px solid #e8973a",
        borderRadius: 10,
        padding: "0.9rem 1.1rem",
        marginBottom: 16,
      }}
    >
      <p style={{ fontSize: 13, fontWeight: 700, color: "#633806", marginBottom: 2 }}>
        ⏰ Follow-up — leads parados há {limiteDias}+ dias
      </p>
      <p style={{ fontSize: 11, color: "#8a6a3b", marginBottom: 10 }}>
        Interessados e hot leads sem nenhuma movimentação recente. Um contato agora pode recuperar a venda.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {parados.map((lead) => (
          <div
            key={lead.id}
            style={{
              background: "var(--card-bg)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "8px 10px",
              display: "flex",
              flexDirection: "column",
              gap: 4,
              minWidth: 200,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>
                {lead.nome || "Lead sem nome"}
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: lead.fase === "hot_lead" ? "#c0392b" : "#e8973a",
                  background: lead.fase === "hot_lead" ? "#fcebeb" : "#faeeda",
                  padding: "2px 6px",
                  borderRadius: 8,
                  whiteSpace: "nowrap",
                }}
              >
                {lead.dias_sem_atividade}d
              </span>
            </div>
            <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
              {faseTitulo(lead.fase)} · {lead.telefone || "sem telefone"}
            </span>
            <WhatsAppButton telefone={lead.telefone} nome={lead.nome} leadId={lead.id} pequeno />
          </div>
        ))}
      </div>
    </div>
  );
}
