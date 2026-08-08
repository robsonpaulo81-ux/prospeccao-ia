"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NovaCampanhaPage() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [prompt, setPrompt] = useState("");
  const [canal, setCanal] = useState("voz");
  const [voiceId, setVoiceId] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    setSalvando(true);
    const res = await fetch("/api/campanhas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, prompt_base: prompt, canal, voice_id: voiceId }),
    });
    setSalvando(false);
    if (res.ok) router.push("/campanhas");
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: 8,
    borderRadius: 6,
    border: "1px solid #ccc",
    fontSize: 14,
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <h1 style={{ fontSize: 18, fontWeight: 500, marginBottom: "1rem" }}>Nova campanha</h1>

      <label style={{ fontSize: 12, color: "#666" }}>Nome da campanha</label>
      <input style={{ ...inputStyle, marginBottom: 12 }} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Prospecção Q3 - SaaS" />

      <label style={{ fontSize: 12, color: "#666" }}>Canal</label>
      <select style={{ ...inputStyle, marginBottom: 12 }} value={canal} onChange={(e) => setCanal(e.target.value)}>
        <option value="voz">Voz</option>
        <option value="texto">Texto</option>
      </select>

      <label style={{ fontSize: 12, color: "#666" }}>Voice ID (ElevenLabs)</label>
      <input style={{ ...inputStyle, marginBottom: 12 }} value={voiceId} onChange={(e) => setVoiceId(e.target.value)} placeholder="ID do seu clone no ElevenLabs" />

      <label style={{ fontSize: 12, color: "#666" }}>Prompt / roteiro do agente</label>
      <textarea
        style={{ ...inputStyle, marginBottom: 16, fontFamily: "monospace", fontSize: 13 }}
        rows={10}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Cole aqui o prompt do agente..."
      />

      <button
        onClick={salvar}
        disabled={salvando || !nome || !prompt}
        style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: "#222", color: "#fff", fontSize: 14 }}
      >
        {salvando ? "Salvando..." : "Criar campanha"}
      </button>
    </div>
  );
}
