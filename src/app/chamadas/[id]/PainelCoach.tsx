"use client";

import { useEffect, useState } from "react";

type Sugestao = {
  suggestion_type: string;
  priority: number;
  text: string;
  created_at: string;
};

const cardStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e5e3da",
  borderRadius: 8,
  padding: "1rem",
};

const tipoLabel: Record<string, string> = {
  pergunta_nao_respondida: "Pergunta não respondida",
  clareza_comunicacao: "Clareza de comunicação",
};

export default function PainelCoach({ chamadaId }: { chamadaId: string }) {
  const [sugestoes, setSugestoes] = useState<Sugestao[]>([]);
  const [ativo, setAtivo] = useState(true);

  useEffect(() => {
    let intervalo: ReturnType<typeof setInterval>;

    async function buscar() {
      try {
        const res = await fetch(`/api/coach-suggestions/${chamadaId}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        setSugestoes(data.suggestions ?? []);
      } catch {
        // silencioso: próxima tentativa em 3s
      }
    }

    buscar();
    intervalo = setInterval(buscar, 3000);

    return () => clearInterval(intervalo);
  }, [chamadaId]);

  if (!ativo) return null;

  return (
    <div style={{ ...cardStyle, marginBottom: 16 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <p style={{ fontSize: 13, color: "#555" }}>
          Sugestões em tempo real
        </p>
        <button
          onClick={() => setAtivo(false)}
          style={{
            fontSize: 11,
            color: "#999",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          ocultar
        </button>
      </div>

      {sugestoes.length === 0 && (
        <p style={{ fontSize: 12, color: "#999" }}>
          Aguardando sugestões...
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {sugestoes.map((s, i) => (
          <div
            key={i}
            style={{
              background: "#fff9e8",
              border: "1px solid #f0e4b8",
              borderRadius: 6,
              padding: "0.6rem 0.75rem",
            }}
          >
            <p style={{ fontSize: 11, color: "#a68b2c", marginBottom: 2 }}>
              {tipoLabel[s.suggestion_type] ?? s.suggestion_type}
            </p>
            <p style={{ fontSize: 13, lineHeight: 1.4 }}>{s.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
