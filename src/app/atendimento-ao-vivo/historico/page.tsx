"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Sessao = {
  retell_call_id: string;
  status: string;
  iniciado_em: string;
  finalizado_em: string | null;
  duracao_segundos: number | null;
};

function formatarData(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function formatarDuracao(segundos: number | null) {
  if (!segundos) return "—";
  const min = Math.floor(segundos / 60);
  const seg = segundos % 60;
  return `${min}m ${seg}s`;
}

export default function HistoricoAtendimentoAoVivoPage() {
  const [sessoes, setSessoes] = useState<Sessao[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    fetch("/api/coach/live/historico", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        setSessoes(data.sessoes ?? []);
        setCarregando(false);
      })
      .catch(() => setCarregando(false));
  }, []);

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700 }}>Histórico de atendimentos ao vivo</h1>
        <Link href="/atendimento-ao-vivo" style={{ fontSize: 13 }}>
          ← voltar
        </Link>
      </div>

      {carregando && <p>Carregando...</p>}

      {!carregando && sessoes.length === 0 && (
        <p style={{ opacity: 0.7, fontSize: 13 }}>Nenhum atendimento registrado ainda.</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {sessoes.map((s) => (
          <Link
            key={s.retell_call_id}
            href={`/atendimento-ao-vivo/historico/${s.retell_call_id}`}
            style={{
              display: "block",
              padding: 12,
              border: "1px solid #ccc",
              borderRadius: 8,
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span>{formatarData(s.iniciado_em)}</span>
              <span style={{ opacity: 0.7 }}>{formatarDuracao(s.duracao_segundos)}</span>
            </div>
            <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>
              {s.status === "concluida" ? "Concluída" : "Em andamento"}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
