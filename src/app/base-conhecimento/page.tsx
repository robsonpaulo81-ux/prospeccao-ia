"use client";

import { useEffect, useState } from "react";

type Entrada = {
  id: number;
  categoria: string;
  gatilho: string;
  conteudo: string;
  contexto: string | null;
  ativo: boolean;
  criado_em: string;
};

export default function BaseConhecimentoPage() {
  const [entradas, setEntradas] = useState<Entrada[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [editando, setEditando] = useState<Entrada | null>(null);

  const [categoria, setCategoria] = useState("objecao");
  const [gatilho, setGatilho] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [contexto, setContexto] = useState("");

  async function carregar() {
    setCarregando(true);
    const res = await fetch("/api/base-conhecimento");
    const data = await res.json();
    setEntradas(data);
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  function limparFormulario() {
    setEditando(null);
    setCategoria("objecao");
    setGatilho("");
    setConteudo("");
    setContexto("");
  }

  function preencherParaEdicao(entrada: Entrada) {
    setEditando(entrada);
    setCategoria(entrada.categoria);
    setGatilho(entrada.gatilho);
    setConteudo(entrada.conteudo);
    setContexto(entrada.contexto || "");
  }

  async function salvar() {
    if (!gatilho || !conteudo) {
      alert("Preencha ao menos o gatilho e o conteúdo.");
      return;
    }

    if (editando) {
      await fetch("/api/base-conhecimento", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editando.id,
          categoria,
          gatilho,
          conteudo,
          contexto,
          ativo: editando.ativo,
        }),
      });
    } else {
      await fetch("/api/base-conhecimento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoria, gatilho, conteudo, contexto }),
      });
    }

    limparFormulario();
    carregar();
  }

  async function alternarAtivo(entrada: Entrada) {
    await fetch("/api/base-conhecimento", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...entrada, ativo: !entrada.ativo }),
    });
    carregar();
  }

  return (
    <div style={{ padding: "24px", maxWidth: "900px", margin: "0 auto" }}>
      <h1>Base de Conhecimento</h1>
      <p>Entradas usadas pelo Live Coach para sugerir respostas já validadas.</p>

      <div style={{ border: "1px solid #ccc", borderRadius: "8px", padding: "16px", marginBottom: "24px" }}>
        <h3>{editando ? `Editando entrada #${editando.id}` : "Nova entrada"}</h3>

        <label>Categoria</label>
        <select value={categoria} onChange={(e) => setCategoria(e.target.value)} style={{ display: "block", width: "100%", marginBottom: "12px" }}>
          <option value="objecao">Objeção</option>
          <option value="politica">Política</option>
          <option value="argumento">Argumento</option>
          <option value="faq">FAQ</option>
        </select>

        <label>Gatilho (palavras-chave separadas por vírgula)</label>
        <input
          type="text"
          value={gatilho}
          onChange={(e) => setGatilho(e.target.value)}
          style={{ display: "block", width: "100%", marginBottom: "12px" }}
        />

        <label>Conteúdo (a resposta que a IA deve sugerir)</label>
        <textarea
          value={conteudo}
          onChange={(e) => setConteudo(e.target.value)}
          rows={4}
          style={{ display: "block", width: "100%", marginBottom: "12px" }}
        />

        <label>Contexto (opcional)</label>
        <input
          type="text"
          value={contexto}
          onChange={(e) => setContexto(e.target.value)}
          style={{ display: "block", width: "100%", marginBottom: "12px" }}
        />

        <button onClick={salvar}>{editando ? "Salvar alterações" : "Adicionar entrada"}</button>
        {editando && (
          <button onClick={limparFormulario} style={{ marginLeft: "8px" }}>
            Cancelar edição
          </button>
        )}
      </div>

      {carregando ? (
        <p>Carregando...</p>
      ) : (
        entradas.map((entrada) => (
          <div
            key={entrada.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "12px",
              marginBottom: "12px",
              opacity: entrada.ativo ? 1 : 0.5,
            }}
          >
            <strong>[{entrada.categoria}]</strong> {entrada.gatilho}
            <p>{entrada.conteudo}</p>
            {entrada.contexto && <p style={{ fontSize: "0.85em", color: "#666" }}>{entrada.contexto}</p>}
            <button onClick={() => preencherParaEdicao(entrada)}>Editar</button>
            <button onClick={() => alternarAtivo(entrada)} style={{ marginLeft: "8px" }}>
              {entrada.ativo ? "Desativar" : "Ativar"}
            </button>
          </div>
        ))
      )}
    </div>
  );
}
