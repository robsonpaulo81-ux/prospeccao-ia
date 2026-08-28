"use client";

// Página /atendimento-ao-vivo — mostra o painel de sugestões do Live Coach
// (app Electron) para a sessão mais recente que estiver rodando.
// Reaproveita o mesmo LiveCoachPanel já usado nas chamadas do Retell.

import { useEffect, useState } from "react";
import { LiveCoachPanel } from "@/components/LiveCoachPanel";

export default function AtendimentoAoVivoPage() {
  const [callId, setCallId] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let cancelado = false;

    async function buscarSessaoAtual() {
      try {
        const res = await fetch("/api/coach-suggestions/latest", {
          cache: "no-store",
        });
        const data = await res.json();
        if (!cancelado) {
          setCallId(data.callId ?? null);
          setCarregando(false);
        }
      } catch {
        // Falha silenciosa — próxima tentativa em 5s.
      }
    }

    buscarSessaoAtual();
    const intervalo = setInterval(buscarSessaoAtual, 5000);
    return () => {
      cancelado = true;
      clearInterval(intervalo);
    };
  }, []);

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px 16px" }}>
      <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
        Atendimento ao vivo
      </h1>

      {carregando && <p>Verificando atendimentos em andamento...</p>}

      {!carregando && !callId && (
        <p>Nenhum atendimento ao vivo em andamento no momento.</p>
      )}

      {!carregando && callId && <LiveCoachPanel callId={callId} ativo={true} />}
    </div>
  );
}
