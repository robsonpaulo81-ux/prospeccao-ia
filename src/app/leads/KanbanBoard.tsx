"use client";

import { useState } from "react";

type Lead = {
  id: string;
  nome: string | null;
  fase: string;
  tipo_imovel: string | null;
  cidade_interesse: string | null;
  tem_restricao: boolean;
  motivo_sem_interesse: string | null;
};

const COLUNAS: { fase: string; titulo: string; cor: string; corTexto: string }[] = [
  { fase: "novo", titulo: "Novo", cor: "#f1efe8", corTexto: "#2c2c2a" },
  { fase: "atendimento", titulo: "Em atendimento", cor: "#e6f1fb", corTexto: "#0c447c" },
  { fase: "interessado", titulo: "Interessado", cor: "#e1f5ee", corTexto: "#085041" },
  { fase: "hot_lead", titulo: "Hot lead", cor: "#faeeda", corTexto: "#633806" },
  { fase: "restricao", titulo: "Tem restrição", cor: "#fcebeb", corTexto: "#791f1f" },
  { fase: "sem_interesse", titulo: "Sem interesse", cor: "#f1efe8", corTexto: "#5f5e5a" },
];

const IMOVEL_LABEL: Record<string, string> = {
  casa: "Casa",
  apartamento: "Apê",
};

const CIDADE_LABEL: Record<string, string> = {
  aguas_lindas: "Águas Lindas",
  brasilia: "Brasília",
};

const MOTIVO_LABEL: Record<string, string> = {
  ja_comprou: "Já comprou",
  interesse_futuro: "Interesse futuro",
};

export default function KanbanBoard({ leadsIniciais }: { leadsIniciais: Lead[] }) {
  const [leads, setLeads] = useState<Lead[]>(leadsIniciais);
  const [arrastandoId, setArrastandoId] = useState<string | null>(null);
  const [colunaSobre, setColunaSobre] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function moverLead(id: string, novaFase: string) {
    const leadAtual = leads.find((l) => l.id === id);
    if (!leadAtual || leadAtual.fase === novaFase) return;

    const faseAnterior = leadAtual.fase;
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, fase: novaFase } : l)));
    setErro(null);

    try {
      const res = await fetch(`/api/leads/${id}/fase`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fase: novaFase }),
      });
      if (!res.ok) throw new Error("Falha ao salvar");
    } catch {
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, fase: faseAnterior } : l)));
      setErro("Não deu pra salvar a mudança. Tenta de novo.");
    }
  }

  return (
    <div>
      {erro && (
        <p style={{ fontSize: 13, color: "#791f1f", marginBottom: 12 }}>{erro}</p>
      )}
      <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
        {COLUNAS.map((col) => {
          const leadsDaColuna = leads.filter((l) => l.fase === col.fase);
          const emFoco = colunaSobre === col.fase;

          return (
            <div
              key={col.fase}
              onDragOver={(e) => {
                e.preventDefault();
                setColunaSobre(col.fase);
              }}
              onDragLeave={() => setColunaSobre((prev) => (prev === col.fase ? null : prev))}
              onDrop={(e) => {
                e.preventDefault();
                setColunaSobre(null);
                if (arrastandoId) moverLead(arrastandoId, col.fase);
              }}
              style={{
                minWidth: 220,
                flex: "0 0 220px",
                background: emFoco ? "#faf8f2" : "#fff",
                border: emFoco ? "1px dashed #b4b2a9" : "1px solid #e5e3da",
                borderRadius: 8,
                padding: "0.75rem",
              }}
            >
              <p style={{ fontSize: 12, color: "#777", marginBottom: 10, display: "flex", justifyContent: "space-between" }}>
                <span>{col.titulo}</span>
                <span>{leadsDaColuna.length}</span>
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {leadsDaColuna.map((lead) => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={() => setArrastandoId(lead.id)}
                    onDragEnd={() => setArrastandoId(null)}
                    style={{
                      background: col.cor,
                      borderRadius: 6,
                      padding: "0.5rem 0.6rem",
                      cursor: "grab",
                      opacity: arrastandoId === lead.id ? 0.5 : 1,
                    }}
                  >
                    <p style={{ fontSize: 13, fontWeight: 500, color: col.corTexto, marginBottom: 4 }}>
                      {lead.nome ?? "Lead sem nome"}
                    </p>
                    <p style={{ fontSize: 11, color: col.corTexto }}>
                      {[
                        lead.tipo_imovel && IMOVEL_LABEL[lead.tipo_imovel],
                        lead.cidade_interesse && CIDADE_LABEL[lead.cidade_interesse],
                        lead.tem_restricao && "Restrição",
                        lead.motivo_sem_interesse && MOTIVO_LABEL[lead.motivo_sem_interesse],
                      ]
                        .filter(Boolean)
                        .join(" · ") || "Sem detalhes ainda"}
                    </p>
                  </div>
                ))}
                {leadsDaColuna.length === 0 && (
                  <p style={{ fontSize: 12, color: "#aaa" }}>Nenhum lead aqui</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
