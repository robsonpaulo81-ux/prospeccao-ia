"use client";
import { useState } from "react";

export function BotaoProcessarAnalises() {
  const [carregando, setCarregando] = useState(false);
  const [resultado, setResultado] = useState<string | null>(null);

  async function processar() {
    setCarregando(true);
    setResultado(null);
    try {
      const resp = await fetch("/api/analises/processar", { method: "POST" });
      const data = await resp.json();
      if (data.processadas === 0 && data.erros === 0) {
        setResultado("✓ Nenhuma chamada na fila de análise");
      } else {
        setResultado(`✅ ${data.processadas} analisada(s)${data.erros ? `, ${data.erros} erro(s)` : ""}`);
      }
    } catch (e) {
      setResultado("❌ Erro ao processar análises");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={processar}
        disabled={carregando}
        className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        {carregando ? "Analisando..." : "🧠 Processar análises agora"}
      </button>
      {resultado && <span className="text-sm text-gray-300">{resultado}</span>}
    </div>
  );
}
