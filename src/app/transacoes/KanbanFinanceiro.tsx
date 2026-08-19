"use client";

import { useState } from "react";

type Transacao = {
  id: number;
  tipo: string;
  empreendimento: string | null;
  unidade: string | null;
  corretor: string | null;
  cliente: string | null;
  valor_bruto: string | null;
};

const COLUNAS: { tipo: string; titulo: string; cor: string; corTexto: string }[] = [
  { tipo: "reserva", titulo: "Reservas", cor: "#e6f1fb", corTexto: "#0c447c" },
  { tipo: "repasse", titulo: "Repasses", cor: "#e1f5ee", corTexto: "#085041" },
  { tipo: "distrato", titulo: "Distratos", cor: "#fcebeb", corTexto: "#791f1f" },
];

function formatarMoeda(valor: string | null) {
  if (!valor) return "-";
  const numero = Number(valor);
  return numero.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function KanbanFinanceiro({ transacoesIniciais }: { transacoesIniciais: Transacao[] }) {
  const [transacoes, setTransacoes] = useState<Transacao[]>(transacoesIniciais);
  const [arrastandoId, setArrastandoId] = useState<number | null>(null);
  const [colunaSobre, setColunaSobre] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function mover(id: number, novoTipo: string) {
    const atual = transacoes.find((t) => t.id === id);
    if (!atual || atual.tipo === novoTipo) return;

    const tipoAnterior = atual.tipo;
    setTransacoes((prev) => prev.map((t) => (t.id === id ? { ...t, tipo: novoTipo } : t)));
    setErro(null);

    try {
      const res = await fetch(`/api/transacoes/${id}/fase`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: novoTipo }),
      });
      if (!res.ok) throw new Error("Falha ao mover");
    } catch {
      setTransacoes((prev) => prev.map((t) => (t.id === id ? { ...t, tipo: tipoAnterior } : t)));
      setErro("Não deu pra salvar a mudança. Tenta de novo.");
    }
  }

  return (
    <div>
      {erro && <p style={{ fontSize: 13, color: "#791f1f", marginBottom: 12 }}>{erro}</p>}
      <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
        {COLUNAS.map((col) => {
          const itens = transacoes.filter((t) => t.tipo === col.tipo);
          const emFoco = colunaSobre === col.tipo;

          return (
            <div
              key={col.tipo}
              onDragOver={(e) => {
                e.preventDefault();
                setColunaSobre(col.tipo);
              }}
              onDragLeave={() => setColunaSobre((prev) => (prev === col.tipo ? null : prev))}
              onDrop={(e) => {
                e.preventDefault();
                setColunaSobre(null);
                if (arrastandoId) mover(arrastandoId, col.tipo);
              }}
              style={{
                minWidth: 240,
                flex: "0 0 240px",
                background: emFoco ? "rgba(128,128,128,0.08)" : "var(--card-bg)",
                border: emFoco ? "1px dashed #b4b2a9" : "1px solid var(--border)",
                borderRadius: 8,
                padding: "0.75rem",
              }}
            >
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 10, display: "flex", justifyContent: "space-between" }}>
                <span>{col.titulo}</span>
                <span>{itens.length}</span>
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {itens.map((t) => (
                  <div
                    key={t.id}
                    draggable
                    onDragStart={() => setArrastandoId(t.id)}
                    onDragEnd={() => setArrastandoId(null)}
                    style={{
                      background: col.cor,
                      borderRadius: 6,
                      padding: "0.5rem 0.6rem",
                      cursor: "grab",
                      opacity: arrastandoId === t.id ? 0.5 : 1,
                    }}
                  >
                    <p style={{ fontSize: 13, fontWeight: 500, color: col.corTexto, marginBottom: 4 }}>
                      {t.cliente || "Sem cliente"}
                    </p>
                    <p style={{ fontSize: 11, color: col.corTexto }}>
                      {[t.empreendimento, t.unidade].filter(Boolean).join(" · ") || "Sem detalhes"}
                    </p>
                    {t.corretor && (
                      <p style={{ fontSize: 11, color: col.corTexto, marginTop: 2 }}>
                        Corretor: {t.corretor}
                      </p>
                    )}
                    <p style={{ fontSize: 12, color: col.corTexto, marginTop: 4, fontWeight: 600 }}>
                      {formatarMoeda(t.valor_bruto)}
                    </p>
                  </div>
                ))}
                {itens.length === 0 && <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Nenhum registro aqui</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
