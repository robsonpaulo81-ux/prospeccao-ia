"use client";

import React, { useState } from "react";
import { COLUNAS, FASE_LABEL, IMOVEL_LABEL, CIDADE_LABEL } from "@/lib/labels";

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

const MOTIVO_LABEL: Record<string, string> = { ja_comprou: "Já comprou", interesse_futuro: "Interesse futuro" };

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
    return "Mudou de \"" + de + "\" para \"" + para + "\"";
  }
  if (ev.tipo === "whatsapp") return ev.descricao || "Mensagem no WhatsApp";
  if (ev.tipo === "ligacao") return ev.descricao || "Ligação registrada";
  return ev.descricao || ev.tipo;
}

function CardLead({ lead, col, arrastandoId, setArrastandoId, onAtualizado }: { lead: Lead; col: { fase: string; titulo: string; cor: string; corTexto: string }; arrastandoId: string | null; setArrastandoId: (id: string | null) => void; onAtualizado: (lead: Lead) => void; }) {
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({ nome: lead.nome || "", telefone: lead.telefone || "", tipo_imovel: lead.tipo_imovel || "", cidade_interesse: lead.cidade_interesse || "", notas: lead.notas || "" });
  const [mostrarHistorico, setMostrarHistorico] = useState(false);
  const [eventos, setEventos] = useState<any[]>([]);
  const [carregandoEventos, setCarregandoEventos] = useState(false);
  const [mostrarFormLigacao, setMostrarFormLigacao] = useState(false);
  const [resumoLigacao, setResumoLigacao] = useState("");
  const [salvandoLigacao, setSalvandoLigacao] = useState(false);

  async function carregarEventos() {
    setCarregandoEventos(true);
    try {
      const resp = await fetch("/api/leads/" + lead.id + "/eventos");
      const dados = await resp.json();
      setEventos(Array.isArray(dados) ? dados : []);
    } catch {
      setEventos([]);
    } finally {
      setCarregandoEventos(false);
    }
  }

  async function toggleHistorico() {
    if (!mostrarHistorico) {
      await carregarEventos();
    }
    setMostrarHistorico((prev) => !prev);
  }

  async function registrarLigacao() {
    if (!resumoLigacao.trim()) {
      alert("Descreve rapidamente o que foi conversado na ligação.");
      return;
    }
    setSalvandoLigacao(true);
    try {
      const resp = await fetch("/api/leads/" + lead.id + "/eventos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: "ligacao", descricao: resumoLigacao.trim() }),
      });
      if (!resp.ok) throw new Error("Falha ao registrar.");
      setResumoLigacao("");
      setMostrarFormLigacao(false);
      if (mostrarHistorico) {
        await carregarEventos();
      } else {
        setMostrarHistorico(true);
        await carregarEventos();
      }
    } catch {
      alert("Não foi possível registrar a ligação.");
    } finally {
      setSalvandoLigacao(false);
    }
  }

  const docs = documentosDoLead(lead.documento_url);

  function campo(nome: string, valor: string) {
    setForm((prev) => ({ ...prev, [nome]: valor }));
  }

  async function salvar() {
    setSalvando(true);
    try {
      const resp = await fetch("/api/leads/" + lead.id, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
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
      const resp = await fetch("/api/leads/" + lead.id, { method: "DELETE" });
      if (!resp.ok) throw new Error("Falha ao cancelar.");
      onAtualizado({ ...lead, _removido: true } as any);
    } catch {
      alert("Não foi possível cancelar o lead.");
    }
  }

  async function virarReserva() {
    if (!confirm("Transformar \"" + (lead.nome ?? "este lead") + "\" em uma reserva no Financeiro?")) return;
    try {
      const resp = await fetch("/api/transacoes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tipo: "reserva", cliente: lead.nome || "", leadId: lead.id, dataTransacao: new Date().toISOString().slice(0, 10) }) });
      if (!resp.ok) throw new Error("Falha ao criar reserva.");
      alert("Reserva criada! Você pode completar os detalhes na tela Financeiro.");
    } catch {
      alert("Não foi possível criar a reserva.");
    }
  }

  const estiloInput: React.CSSProperties = { width: "100%", padding: "4px 6px", fontSize: 11, border: "1px solid rgba(0,0,0,0.15)", borderRadius: 4, marginBottom: 4 };

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
          <button onClick={salvar} disabled={salvando} style={{ fontSize: 10, padding: "3px 7px", border: "none", borderRadius: 4, background: "#1a1a1a", color: "#fff", cursor: "pointer" }}>{salvando ? "..." : "Salvar"}</button>
          <button onClick={() => setEditando(false)} style={{ fontSize: 10, padding: "3px 7px", border: "1px solid rgba(0,0,0,0.2)", borderRadius: 4, background: "transparent", cursor: "pointer" }}>Cancelar edição</button>
        </div>
      </div>
    );
  }

  return (
    <div draggable onDragStart={() => setArrastandoId(lead.id)} onDragEnd={() => setArrastandoId(null)} style={{ background: col.cor, borderRadius: 6, padding: "0.5rem 0.6rem", cursor: "grab", opacity: arrastandoId === lead.id ? 0.5 : 1 }}>
      <p style={{ fontSize: 13, fontWeight: 500, color: col.corTexto, marginBottom: 4, display: "flex", alignItems: "center", gap: 6, justifyContent: "space-between" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {lead.nome ?? "Lead sem nome"}
          {docs.length > 0 && (<span title={docs.length + " documento(s) anexado(s)"} style={{ fontSize: 11 }}>📎{docs.length > 1 ? docs.length : ""}</span>)}
        </span>
        {lead.dias_desde_indicacao != null && (
          <span title="Dias desde a indicação" style={{ fontSize: 10, fontWeight: 700, color: corDiasIndicacao(lead.dias_desde_indicacao), background: corDiasIndicacao(lead.dias_desde_indicacao) + "22", padding: "2px 6px", borderRadius: 8, whiteSpace: "nowrap" }}>
            {lead.dias_desde_indicacao}d
          </span>
        )}
      </p>
      <p style={{ fontSize: 11, color: col.corTexto }}>
        {[lead.tipo_imovel && IMOVEL_LABEL[lead.tipo_imovel], lead.cidade_interesse && CIDADE_LABEL[lead.cidade_interesse], lead.tem_restricao && "Restrição", lead.motivo_sem_interesse && MOTIVO_LABEL[lead.motivo_sem_interesse]].filter(Boolean).join(" · ") || "Sem detalhes ainda"}
      </p>

      {docs.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
          {docs.map(function (url, i) {
            return React.createElement("a", { key: url, href: url, target: "_blank", rel: "noopener noreferrer", onClick: function (e: any) { e.stopPropagation(); }, style: { fontSize: 10, color: col.corTexto, background: "rgba(255,255,255,0.6)", padding: "2px 6px", borderRadius: 4, textDecoration: "none" } }, "Doc " + (i + 1));
          })}
        </div>
      )}

      {lead.notas && (
        <p style={{ fontSize: 11, color: col.corTexto, marginTop: 6, fontStyle: "italic", opacity: 0.85 }}>"{lead.notas}"</p>
      )}

      <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
        <button onClick={() => setEditando(true)} style={{ fontSize: 10, padding: "3px 7px", border: "1px solid rgba(0,0,0,0.2)", borderRadius: 4, background: "rgba(255,255,255,0.5)", color: col.corTexto, cursor: "pointer" }}>Editar</button>
        <button onClick={virarReserva} style={{ fontSize: 10, padding: "3px 7px", border: "1px solid #0f9d78", borderRadius: 4, background: "rgba(255,255,255,0.5)", color: "#0f9d78", cursor: "pointer" }}>Virar Reserva</button>
        <button onClick={cancelar} style={{ fontSize: 10, padding: "3px 7px", border: "1px solid #c0392b", borderRadius: 4, background: "rgba(255,255,255,0.5)", color: "#c0392b", cursor: "pointer" }}>Cancelar</button>
        <button onClick={toggleHistorico} style={{ fontSize: 10, padding: "3px 7px", border: "1px solid rgba(0,0,0,0.2)", borderRadius: 4, background: "rgba(255,255,255,0.5)", color: col.corTexto, cursor: "pointer" }}>{mostrarHistorico ? "Ocultar histórico" : "Histórico"}</button>
        <button onClick={() => setMostrarFormLigacao((prev) => !prev)} style={{ fontSize: 10, padding: "3px 7px", border: "1px solid #0c447c", borderRadius: 4, background: "rgba(255,255,255,0.5)", color: "#0c447c", cursor: "pointer" }}>+ Ligação</button>
      </div>

      {mostrarFormLigacao && (
        <div style={{ marginTop: 8, borderTop: "1px solid rgba(0,0,0,0.1)", paddingTop: 6 }}>
          <textarea
            value={resumoLigacao}
            onChange={(e) => setResumoLigacao(e.target.value)}
            placeholder="Resumo rápido da ligação (o que foi falado, próximo passo...)"
            style={{ width: "100%", minHeight: 50, fontSize: 11, padding: "4px 6px", border: "1px solid rgba(0,0,0,0.15)", borderRadius: 4, marginBottom: 4 }}
          />
          <div style={{ display: "flex", gap: 4 }}>
            <button onClick={registrarLigacao} disabled={salvandoLigacao} style={{ fontSize: 10, padding: "3px 7px", border: "none", borderRadius: 4, background: "#0c447c", color: "#fff", cursor: "pointer" }}>
              {salvandoLigacao ? "Salvando..." : "Salvar ligação"}
            </button>
            <button onClick={() => { setMostrarFormLigacao(false); setResumoLigacao(""); }} style={{ fontSize: 10, padding: "3px 7px", border: "1px solid rgba(0,0,0,0.2)", borderRadius: 4, background: "transparent", cursor: "pointer" }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {mostrarHistorico && (
        <div style={{ marginTop: 8, borderTop: "1px solid rgba(0,0,0,0.1)", paddingTop: 6 }}>
          {carregandoEventos && <p style={{ fontSize: 10, color: col.corTexto }}>Carregando...</p>}
          {!carregandoEventos && eventos.length === 0 && (<p style={{ fontSize: 10, color: col.corTexto, opacity: 0.7 }}>Nenhum evento ainda.</p>)}
          {!carregandoEventos && eventos.map((ev) => (
            <div key={ev.id} style={{ fontSize: 10, color: col.corTexto, marginBottom: 4 }}>
              <span style={{ opacity: 0.6 }}>{new Date(ev.criado_em).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
              {" — "}
              {formatarEvento(ev)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

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
      const res = await fetch("/api/leads/" + id + "/fase", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fase: novaFase }) });
      if (!res.ok) throw new Error("Falha ao salvar");
    } catch {
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, fase: faseAnterior } : l)));
      setErro("Não deu pra salvar a mudança. Tenta de novo.");
    }
  }

  function handleAtualizado(leadAtualizado: Lead & { _removido?: boolean }) {
    if (leadAtualizado._removido) {
      setLeads((prev) => prev.filter((l) => l.id !== leadAtualizado.id));
    } else {
      setLeads((prev) => prev.map((l) => (l.id === leadAtualizado.id ? leadAtualizado : l)));
    }
  }

  return (
    <div>
      {erro && <p style={{ fontSize: 13, color: "#791f1f", marginBottom: 12 }}>{erro}</p>}
      <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
        {COLUNAS.map((col) => {
          const leadsDaColuna = leads.filter((l) => l.fase === col.fase);
          const emFoco = colunaSobre === col.fase;
          return (
            <div key={col.fase} onDragOver={(e) => { e.preventDefault(); setColunaSobre(col.fase); }} onDragLeave={() => setColunaSobre((prev) => (prev === col.fase ? null : prev))} onDrop={(e) => { e.preventDefault(); setColunaSobre(null); if (arrastandoId) moverLead(arrastandoId, col.fase); }} style={{ minWidth: 240, flex: "0 0 240px", background: emFoco ? "#faf8f2" : "#fff", border: emFoco ? "1px dashed #b4b2a9" : "1px solid #e5e3da", borderRadius: 8, padding: "0.75rem" }}>
              <p style={{ fontSize: 12, color: "#777", marginBottom: 10, display: "flex", justifyContent: "space-between" }}>
                <span>{col.titulo}</span>
                <span>{leadsDaColuna.length}</span>
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {leadsDaColuna.map((lead) => (
                  <CardLead key={lead.id} lead={lead} col={col} arrastandoId={arrastandoId} setArrastandoId={setArrastandoId} onAtualizado={handleAtualizado} />
                ))}
                {leadsDaColuna.length === 0 && (<p style={{ fontSize: 12, color: "#aaa" }}>Nenhum lead aqui</p>)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
