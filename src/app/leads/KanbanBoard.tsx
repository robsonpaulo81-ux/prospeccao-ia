"use client";

import { useState } from "react";

type Lead = {
  id: string;
  nome: string | null;
  telefone?: string | null;
  fase: string;
  tipo_imovel: string | null;
  cidade_interesse: string | null;
  tem_restricao: boolean;
  motivo_sem_interesse: string | null;
  documento_url: string | null;
  notas: string | null;
  criado_em?: string | null;
  dias_desde_indicacao?: number | null;
};

const COLUNAS = [
  { fase: "novo", titulo: "Novo", cor: "#f1efe8", corTexto: "#2c2c2a" },
  { fase: "atendimento", titulo: "Em atendimento", cor: "#e6f1fb", corTexto: "#0c447c" },
  { fase: "interessado", titulo: "Interessado", cor: "#e1f5ee", corTexto: "#085041" },
  { fase: "hot_lead", titulo: "Hot lead", cor: "#faeeda", corTexto: "#633806" },
  { fase: "pend_documentacao", titulo: "Pend. Documentação", cor: "#e8eaf6", corTexto: "#303f9f" },
  { fase: "aprovado", titulo: "Aprovado", cor: "#a5d6a7", corTexto: "#1b5e20" },
  { fase: "condicionado", titulo: "Condicionado", cor: "#ffe082", corTexto: "#7a4a00" },
  { fase: "reprovado", titulo: "Reprovado", cor: "#212121", corTexto: "#f5f5f5" },
  { fase: "restricao", titulo: "Tem restrição", cor: "#fcebeb", corTexto: "#791f1f" },
  { fase: "sem_interesse", titulo: "Sem interesse", cor: "#f1efe8", corTexto: "#5f5e5a" },
];

const FASE_LABEL: Record<string, string> = Object.fromEntries(
  COLUNAS.map((c) => [c.fase, c.titulo])
);

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

function documentosDoLead(documentoUrl: string | null): string[] {
  if (!documentoUrl) return [];
  try {
    const parsed = JSON.parse(documentoUrl);
    return Array.isArray(parsed) ? parsed : [documentoUrl];
  } catch {
    return [documentoUrl];
  }
}

function corDiasIndicacao(dias: number | null | undefined) {
  if (dias == null) return "#999";
  if (dias <= 7) return "#0f9d78";
  if (dias <= 20) return "#e8973a";
  return "#c0392b";
}

function formatarEvento(ev: any) {
  if (ev.tipo === "mudanca_fase") {
    const de = FASE_LABEL[ev.fase_anterior] || ev.fase_anterior || "—";
    const para = FASE_LABEL[ev.fase_nova] || ev.fase_nova;
    return `Mudou de "${de}" para "${para}"`;
  }
  if (ev.tipo === "whatsapp") return ev.descricao || "Mensagem no WhatsApp";
  if (ev.tipo === "ligacao") return ev.descricao || "Ligação registrada";
  return ev.descricao || ev.tipo;
}

function CardLead({
  lead,
  col,
  arrastandoId,
  setArrastandoId,
  onAtualizado,
}: {
  lead: Lead;
  col: { fase: string; titulo: string; cor: string; corTexto: string };
  arrastandoId: string | null;
  setArrastandoId: (id: string | null) => void;
  onAtualizado: (lead: Lead) => void;
}) {
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({
    nome: lead.nome || "",
    telefone: lead.telefone || "",
    tipo_imovel: lead.tipo_imovel || "",
    cidade_interesse: lead.cidade_interesse || "",
    notas: lead.notas || "",
  });

  const [mostrarHistorico, setMostrarHistorico] = useState(false);
  const [eventos, setEventos] = useState<any[]>([]);
  const [carregandoEventos, setCarregandoEventos] = useState(false);

  async function toggleHistorico() {
    if (!mostrarHistorico && eventos.length === 0) {
      setCarregandoEventos(true);
      try {
        const resp = await fetch(`/api/leads/${lead.id}/eventos`);
        const dados = await resp.json();
        setEventos(Array.isArray(dados) ? dados : []);
      } catch {
        setEventos([]);
      } finally {
        setCarregandoEventos(false);
      }
    }
    setMostrarHistorico((prev) => !prev);
  }

  const docs = documentosDoLead(lead.documento_url);

  function campo(nome: string, valor: string) {
    setForm((prev) => ({ ...prev, [nome]: valor }));
  }

  async function salvar() {
    setSalvando(true);
    try {
      const resp = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!resp.ok) throw new Error("Falha ao salvar.");
      const atualizado = await resp.json();
      onAtualizado({ ...lead, ...atualizado });
      setEditando(false);
    } catch {
      alert("Não foi possível salvar as alterações.");
    } finally {
      setSalvando(false);
    }
  }

  async function cancelar() {
    if (!confirm("Tem certeza que deseja cancelar (excluir) este lead?")) return;
    try {
      const resp = await fetch(`/api/leads/${lead.id}`, { method: "DELETE" });
      if (!resp.ok) throw new Error("Falha ao cancelar.");
      onAtualizado({ ...lead, _removido: true } as any);
    } catch {
      alert("Não foi possível cancelar o lead.");
    }
  }

  async function virarReserva() {
    if (!confirm(`Transformar "${lead.nome ?? "este lead"}" em uma reserva no Financeiro?`)) return;
    try {
      const resp = await fetch("/api/transacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "reserva",
          cliente: lead.nome || "",
          leadId: lead.id,
          dataTransacao: new Date().toISOString().slice(0, 10),
        }),
      });
      if (!resp.ok) throw new Error("Falha ao criar reserva.");
      alert("Reserva criada! Você pode completar os detalhes na tela Financeiro.");
    } catch {
      alert("Não foi possível criar a reserva.");
    }
  }

  const estiloInput: React.CSSProperties = {
    width: "100%",
    padding: "4px 6px",
    fontSize: 11,
    border: "1px solid rgba(0,0,0,0.15)",
    borderRadius: 4,
    marginBottom: 4,
  };

  if (editando) {
    return (
      <div style={{ background: col.cor, borderRadius: 6, padding: "0.5rem 0.6rem" }}>
        <input style={estiloInput} placeholder="Nome" value={form.nome} onChange={(e) => campo("nome", e.target.value)} />
        <input style={estiloInput} placeholder="Telefone" value={form.telefone} onChange={(e) => campo("telefone", e.target.value)} />
        <select style={estiloInput} value={form.tipo_imovel} onChange={(e) => campo("tipo_imovel", e.target.value)}>
          <option value="">Tipo de imóvel</option>
          <option value="casa">Casa</option>
          <option value="apartamento">Apê</option>
        </select>
        <select style={estiloInput} value={form.cidade_interesse} onChange={(e) => campo("cidade_interesse", e.target.value)}>
          <option value="">Cidade</option>
          <option value="aguas_lindas">Águas Lindas</option>
          <option value="brasilia">Brasília</option>
        </select>
        <textarea style={{ ...estiloInput, minHeight: 40 }} placeholder="Observações" value={form.notas} onChange={(e) => campo("notas", e.target.value)} />
        <div style={{ display: "flex", gap: 4 }}>
          <button onClick={salvar} disabled={salvando} style={{ fontSize: 10, padding: "3px 7px", border: "none", borderRadius: 4, background: "#1a1a1a", color: "#fff", cursor: "pointer" }}>
            {salvando ? "..." : "Salvar"}
          </button>
          <button onClick={() => setEditando(false)} style={{ fontSize: 10, padding: "3px 7px", border: "1px solid rgba(0,0,0,0.2)", borderRadius: 4, background: "transparent", cursor: "pointer" }}>
            Cancelar edição
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
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
      <p style={{ fontSize: 13, fontWeight: 500, color: col.corTexto, marginBottom: 4, display: "flex", alignItems: "center", gap: 6, justifyContent: "space-between" }}>
