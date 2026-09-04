"use client";

import React, { useState } from "react";
import { COLUNAS, FASE_LABEL, IMOVEL_LABEL, CIDADE_LABEL } from "@/lib/labels";
import { BotaoProcessarFila } from "@/components/BotaoProcessarFila";

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
