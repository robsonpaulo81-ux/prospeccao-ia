"use client";

import { useState } from "react";

type DadoFase = {
  fase: string;
  titulo: string;
  cor: string;
  total: number;
};

const ICONE_FASE: Record<string, string> = {
  novo: "🆕",
  atendimento: "💬",
  interessado: "👍",
  hot_lead: "🔥",
  analise_cca: "📋",
  pend_documentacao: "📁",
  aprovado: "✅",
  condicionado: "⏳",
  reprovado: "⛔",
  restricao: "⚠️",
  interesse_futuro: "📅",
  sem_interesse: "🗑️",
};

export default function FunilVendas({ dadosFase, totalLeads }: { dadosFase: DadoFase[]; totalLeads: number }) {
  const [modo, setModo] = useState<"barras" | "ranking">("barras");
  const maiorTotal = Math.max(1, ...dadosFase.map((d) => d.total));

  const dadosOrdenados = [...dadosFase].sort((a, b) => b.total - a.total);
  const aprovados = dadosFase.find((d) => d.fase === "aprovado")?.total ?? 0;
  const conversaoGeral = totalLeads > 0 ? (aprovados / totalLeads) * 100 : 0;

  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: "1.25rem", border: "1px solid #e5e3da", marginTop: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: "#333" }}>Funil de vendas</p>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={() => setModo("barras")}
            style={{
              fontSize: 11,
              padding: "4px 10px",
              border: "1px solid #1a1a1a",
              borderRadius: 4,
              background: modo === "barras" ? "#1a1a1a" : "transparent",
              color: modo === "barras" ? "#fff" : "#1a1a1a",
              cursor: "pointer",
            }}
          >
            Barras
          </button>
          <button
            onClick={() => setModo("ranking")}
            style={{
              fontSize: 11,
              padding: "4px 10px",
              border: "1px solid #1a1a1a",
              borderRadius: 4,
              background: modo === "ranking" ? "#1a1a1a" : "transparent",
              color: modo === "ranking" ? "#fff" : "#1a1a1a",
              cursor: "pointer",
            }}
          >
            Ranking
          </button>
        </div>
      </div>

      {modo === "barras" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {dadosFase.map((d) => {
            const porcentagemDoTotal = totalLeads > 0 ? (d.total / totalLeads) * 100 : 0;
            const larguraBarra = (d.total / maiorTotal) * 100;
            return (
              <div key={d.fase}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#333" }}>{d.titulo}</span>
                  <span style={{ fontSize: 12, color: "#666" }}>
                    {d.total} lead{d.total !== 1 ? "s" : ""} · {porcentagemDoTotal.toFixed(1)}%
                  </span>
                </div>
                <div style={{ background: "#f2f0e9", borderRadius: 6, height: 14, overflow: "hidden" }}>
                  <div style={{ width: `${larguraBarra}%`, background: d.cor, height: "100%", borderRadius: 6, transition: "width 0.3s" }} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", fontSize: 11, color: "#999", fontWeight: 600, padding: "0 4px", marginBottom: 8 }}>
            <span>ETAPA</span>
            <span style={{ textAlign: "center" }}>QTD.</span>
            <span style={{ textAlign: "right" }}>% DO TOTAL</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {dadosOrdenados.map((d) => {
              const porcentagemDoTotal = totalLeads > 0 ? (d.total / totalLeads) * 100 : 0;
              return (
                <div
                  key={d.fase}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr 1fr",
                    alignItems: "center",
                    background: d.cor,
                    borderRadius: 8,
                    padding: "10px 12px",
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", display: "flex", alignItems: "center", gap: 8 }}>
                    <span>{ICONE_FASE[d.fase] ?? "•"}</span> {d.titulo}
                  </span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a", textAlign: "center" }}>{d.total}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", textAlign: "right" }}>{porcentagemDoTotal.toFixed(2)}%</span>
                </div>
              );
            })}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 16,
              padding: "10px 12px",
              background: "#1a1a1a",
              borderRadius: 8,
              color: "#fff",
            }}
          >
            <span style={{ fontSize: 12 }}>
              TOTAL DE LEADS: <strong style={{ fontSize: 15 }}>{totalLeads}</strong>
            </span>
            <span style={{ fontSize: 12 }}>
              CONVERSÃO (Aprovado): <strong style={{ fontSize: 15 }}>{conversaoGeral.toFixed(2)}%</strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
