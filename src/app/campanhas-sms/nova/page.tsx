"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NovaCampanhaSMS() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [fase, setFase] = useState("");
  const [cidade, setCidade] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [totalDestinatarios, setTotalDestinatarios] = useState<number | null>(null);

  const criarCampanha = async () => {
    setEnviando(true);
    const res = await fetch("/api/campanhas-sms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome,
        mensagem,
        filtros: { fase: fase || undefined, cidade: cidade || undefined },
      }),
    });
    const data = await res.json();
    setTotalDestinatarios(data.total);
    setEnviando(false);
    return data.campanhaId;
  };

  const enviarAgora = async () => {
    const campanhaId = await criarCampanha();
    await fetch(`/api/campanhas-sms/${campanhaId}/enviar`, { method: "POST" });
    router.push("/campanhas-sms");
  };

  const caracteres = mensagem.length;
  const partesSMS = Math.ceil(caracteres / 160) || 1;

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold">Nova Campanha SMS</h1>

      <div>
        <label className="text-sm font-medium">Nome da campanha</label>
        <input
          className="w-full border rounded p-2"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex: Reativação leads frios agosto"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Mensagem</label>
        <textarea
          className="w-full border rounded p-2"
          rows={4}
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
        />
        <p className="text-xs text-gray-500">
          {caracteres} caracteres · {partesSMS} parte(s) de SMS
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium">Fase (opcional)</label>
          <input className="w-full border rounded p-2" value={fase} onChange={(e) => setFase(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium">Cidade (opcional)</label>
          <input className="w-full border rounded p-2" value={cidade} onChange={(e) => setCidade(e.target.value)} />
        </div>
      </div>

      <button
        onClick={enviarAgora}
        disabled={enviando || !nome || !mensagem}
        className="w-full bg-red-600 text-white rounded p-2 font-medium disabled:opacity-50"
      >
        {enviando ? "Enviando..." : "Enviar campanha"}
      </button>

      {totalDestinatarios !== null && (
        <p className="text-sm text-gray-600">Enviado para {totalDestinatarios} leads.</p>
      )}
    </div>
  );
}
