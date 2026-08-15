// src/components/LiveCoachPanel.tsx
//
// Painel de sugestões em tempo real para a tela de detalhe da chamada.
// Faz polling em /api/coach-suggestions/[callId] a cada 3 segundos enquanto
// a chamada está em andamento.
//
// Uso: <LiveCoachPanel callId={chamada.retell_call_id} ativo={chamada.status === "em_andamento"} />

"use client";

import { useEffect, useState } from "react";
import styles from "./LiveCoachPanel.module.css";

type Sugestao = {
  suggestion_type: string;
  priority: "alta" | "media" | "baixa";
  text: string;
  created_at: string;
};

const RODULO_TIPO: Record<string, string> = {
  objecao: "Objeção",
  pergunta_qualificacao: "Qualificação",
  sinal_de_compra: "Sinal de compra",
  alerta: "Alerta",
  proxima_pergunta: "Próxima pergunta",
  pergunta_nao_respondida: "Pergunta insistida",
  clareza_comunicacao: "Clareza",
};

export function LiveCoachPanel({
  callId,
  ativo,
}: {
  callId: string;
  ativo: boolean;
}) {
  const [sugestoes, setSugestoes] = useState<Sugestao[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!callId) return;

    let cancelado = false;

    async function buscar() {
      try {
        const res = await fetch(`/api/coach-suggestions/${callId}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelado) {
          setSugestoes(data.suggestions ?? []);
          setCarregando(false);
        }
      } catch {
        // Falha silenciosa — próximo polling tenta de novo.
      }
    }

    buscar();

    if (!ativo) return;

    const intervalo = setInterval(buscar, 3000);
    return () => {
      cancelado = true;
      clearInterval(intervalo);
    };
  }, [callId, ativo]);

  if (carregando) {
    return (
      <div className={styles.painel}>
        <p className={styles.textoVazio}>Carregando sugestões...</p>
      </div>
    );
  }

  if (sugestoes.length === 0) {
    return (
      <div className={styles.painel}>
        <h3 className={styles.titulo}>Live Coach</h3>
        <p className={styles.textoVazio}>
          {ativo
            ? "Nenhuma sugestão ainda — aguardando a conversa se desenvolver."
            : "Nenhuma sugestão foi gerada nesta chamada."}
        </p>
      </div>
    );
  }

  const [maisRecente, ...anteriores] = sugestoes;

  return (
    <div className={styles.painel}>
      <div className={styles.cabecalho}>
        <h3 className={styles.titulo}>Live Coach</h3>
        {ativo && (
          <span className={styles.aoVivo}>
            <span className={styles.pontoPulsando} />
            ao vivo
          </span>
        )}
      </div>

      <div
        className={`${styles.sugestaoDestaque} ${
          styles[`prioridade-${maisRecente.priority}`] ?? ""
        }`}
      >
        <span className={styles.tipoLabel}>
          {RODULO_TIPO[maisRecente.suggestion_type] ?? maisRecente.suggestion_type}
        </span>
        <p className={styles.textoSugestao}>{maisRecente.text}</p>
      </div>

      {anteriores.length > 0 && (
        <details className={styles.historico}>
          <summary className={styles.historicoResumo}>
            Ver sugestões anteriores ({anteriores.length})
          </summary>
          <ul className={styles.historicoLista}>
            {anteriores.map((s, i) => (
              <li key={i} className={styles.historicoItem}>
                <span className={styles.historicoItemTipo}>
                  {RODULO_TIPO[s.suggestion_type] ?? s.suggestion_type}:
                </span>{" "}
                {s.text}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
