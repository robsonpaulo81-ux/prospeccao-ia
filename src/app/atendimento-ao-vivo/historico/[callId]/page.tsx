"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LiveCoachPanel } from "@/components/LiveCoachPanel";

type Sessao = {
  retell_call_id: string;
  status: string;
  transcricao: string | null;
  iniciado_em: string;
  finalizado_em: string | null;
  duracao_segundos: number | null;
};

export default function DetalheAtendimentoAoVivoPage({
  params,
}: {
  params: { callId: string };
}) {
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    fetch(`/api/coach/live/detalhe/${params.callId}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        setSessao(data.sessao ?? null);
        setCarregando(false);
      })
      .catch(() => setCarregando(false));
  }, [params.callId]);

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "24px 16px" }}>
      <Link href="/atendimento-ao-vivo/historico" style={{ fontSize: 13 }}>
        ← voltar pro histórico
      </Link>

      <h1 style={{ fontSize: 18, fontWeight: 700, margin: "12px 0 20px" }}>
        Atendimento de{" "}
        {sessao ? new Date(sessao.iniciado_em).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "..."}
      </h1>

      {carregando && <p>Carregando...</p>}
      {!carregando && !sessao && <p>Sessão não encontrada.</p>}

      {sessao && (
        <>
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Transcrição</p>
            <div
              style={{
                whiteSpace: "pre-wrap",
                border: "1px solid #ccc",
                borderRadius: 8,
                padding: 12,
                fontSize: 13,
                maxHeight: 320,
                overflowY: "auto",
              }}
            >
              {sessao.transcricao || "Nenhuma transcrição salva para esta sessão."}
            </div>
          </div>

          <LiveCoachPanel callId={sessao.retell_call_id} ativo={false} />
        </>
      )}
    </div>
  );
}
