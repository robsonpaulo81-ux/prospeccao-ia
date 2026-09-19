"use client";
import { useState } from "react";
import { COLUNAS, CIDADE_LABEL, IMOVEL_LABEL } from "@/lib/labels";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  fontSize: 13,
  border: "1px solid var(--border)",
  borderRadius: 6,
  background: "var(--card-bg)",
  color: "var(--text)",
  boxSizing: "border-box",
};

export default function NovaCampanhaSMS() {
  const [nome, setNome] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [fase, setFase] = useState("");
  const [cidade, setCidade] = useState("");
  const [tipoImovel, setTipoImovel] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [totalDestinatarios, setTotalDestinatarios] = useState<number | null>(null);

  async function enviarAgora() {
    setEnviando(true);
    setErro(null);
    try {
      const res = await fetch("/api/campanhas-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          mensagem,
          filtros: {
            fase: fase || undefined,
            cidade: cidade || undefined,
            tipo_imovel: tipoImovel || undefined,
          },
        }),
      });
      if (!res.ok) throw new Error("Falha ao criar campanha");
      const data = await res.json();

      const resEnvio = await fetch(`/api/campanhas-sms/${data.campanhaId}/enviar`, { method: "POST" });
      if (!resEnvio.ok) throw new Error("Falha ao enviar campanha");
      setTotalDestinatarios(data.total);
    } catch {
      setErro("Não deu pra enviar a campanha. Tenta de novo.");
    } finally {
      setEnviando(false);
    }
  }

  const caracteres = mensagem.length;
  const partesSMS = Math.ceil(caracteres / 160) || 1;

  return (
    <div style={{ maxWidth: 560 }}>
      <h1 style={{ fontSize: 18, fontWeight: 500, marginBottom: "1rem" }}>Nova Campanha SMS</h1>

      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4, color: "var(--text)" }}>
          Nome da campanha
        </label>
        <input
          style={inputStyle}
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex: Reativação leads frios setembro"
        />
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4, color: "var(--text)" }}>
          Mensagem
        </label>
        <textarea
          style={{ ...inputStyle, resize: "vertical" }}
          rows={4}
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          placeholder="Ex: Oi {nome}! Passando pra avisar que abriram novas unidades no Minha Casa Minha Vida. Posso te ajudar?"
        />
        <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
          {caracteres} caracteres · {partesSMS} parte(s) de SMS
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4, color: "var(--text)" }}>
            Fase (opcional)
          </label>
          <select style={inputStyle} value={fase} onChange={(e) => setFase(e.target.value)}>
            <option value="">Todas as fases</option>
            {COLUNAS.map((c) => (
              <option key={c.fase} value={c.fase}>
                {c.titulo}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4, color: "var(--text)" }}>
            Cidade (opcional)
          </label>
          <select style={inputStyle} value={cidade} onChange={(e) => setCidade(e.target.value)}>
            <option value="">Todas as cidades</option>
            {Object.entries(CIDADE_LABEL).map(([valor, titulo]) => (
              <option key={valor} value={valor}>
                {titulo}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4, color: "var(--text)" }}>
            Imóvel (opcional)
          </label>
          <select style={inputStyle} value={tipoImovel} onChange={(e) => setTipoImovel(e.target.value)}>
            <option value="">Todos</option>
            {Object.entries(IMOVEL_LABEL).map(([valor, titulo]) => (
              <option key={valor} value={valor}>
                {titulo}
              </option>
            ))}
          </select>
        </div>
      </div>

      {erro && <p style={{ fontSize: 13, color: "#c0392b", marginBottom: 12 }}>{erro}</p>}

      <button
        onClick={enviarAgora}
        disabled={enviando || !nome || !mensagem}
        style={{
          width: "100%",
          padding: "12px",
          fontSize: 14,
          fontWeight: 600,
          color: "#fff",
          background: "#1a1a1a",
          border: "none",
          borderRadius: 8,
          cursor: enviando || !nome || !mensagem ? "default" : "pointer",
          opacity: enviando || !nome || !mensagem ? 0.5 : 1,
        }}
      >
        {enviando ? "Enviando..." : "Enviar campanha"}
      </button>

      {totalDestinatarios !== null && (
        <p style={{ fontSize: 13, color: "#0f9d78", marginTop: 12 }}>
          ✅ Campanha criada e disparada para {totalDestinatarios} lead(s). Veja o histórico{" "}
          <a href="/mensagens" style={{ color: "var(--accent-2)" }}>aqui</a>.
        </p>
      )}
    </div>
  );
}
