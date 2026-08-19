export const dynamic = "force-dynamic";

import { query } from "@/lib/db";
import FormularioTransacao from "./FormularioTransacao";
import TransacaoLinha from "./TransacaoLinha";
import KanbanFinanceiro from "./KanbanFinanceiro";
import GraficoFinanceiro from "../components/GraficoFinanceiro";

const ABAS = [
  { tipo: "reserva", titulo: "Reservas" },
  { tipo: "repasse", titulo: "Repasses" },
  { tipo: "distrato", titulo: "Distratos" },
];

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: { tipo?: string; view?: string };
}) {
  const tipoAtivo = searchParams?.tipo && ["reserva", "repasse", "distrato"].includes(searchParams.tipo)
    ? searchParams.tipo
    : "reserva";

  const modoKanban = searchParams?.view === "kanban";
  const modoMetricas = searchParams?.view === "metricas";

  const transacoes = modoKanban
    ? await query(`SELECT * FROM transacoes ORDER BY id DESC`)
    : !modoMetricas
    ? await query(
        `SELECT * FROM transacoes WHERE tipo = $1 ORDER BY data_transacao DESC NULLS LAST, id DESC`,
        [tipoAtivo]
      )
    : [];

  let dadosGrafico: { tipo: string; titulo: string; total: number; cor: string }[] = [];
  let totais = { reserva: { qtd: 0, soma: 0 }, repasse: { qtd: 0, soma: 0 }, distrato: { qtd: 0, soma: 0 } };

  if (modoMetricas) {
    const agregado = await query(`
      SELECT tipo, COUNT(*)::int AS qtd, COALESCE(SUM(valor_bruto), 0) AS soma
      FROM transacoes
      GROUP BY tipo
    `);
    const CORES: Record<string, string> = { reserva: "#3b82c4", repasse: "#0f9d78", distrato: "#c0392b" };
    const TITULOS: Record<string, string> = { reserva: "Reservas", repasse: "Repasses", distrato: "Distratos" };

    for (const tipo of ["reserva", "repasse", "distrato"] as const) {
      const linha = agregado.find((a: any) => a.tipo === tipo);
      totais[tipo] = { qtd: linha ? Number(linha.qtd) : 0, soma: linha ? Number(linha.soma) : 0 };
      dadosGrafico.push({ tipo, titulo: TITULOS[tipo], total: linha ? Number(linha.soma) : 0, cor: CORES[tipo] });
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: 18, fontWeight: 500, marginBottom: "1rem" }}>Financeiro</h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <a
          href={`/transacoes?view=lista&tipo=${tipoAtivo}`}
          style={{
            fontSize: 13,
            padding: "6px 14px",
            borderRadius: 6,
            textDecoration: "none",
            background: !modoKanban ? "#1a1a1a" : "var(--card-bg)",
            color: !modoKanban ? "#fff" : "var(--text)",
            border: "1px solid var(--border)",
          }}
        >
          Lista
        </a>
        <a
          href="/transacoes?view=metricas"
          style={{
            fontSize: 13,
            padding: "6px 14px",
            borderRadius: 6,
            textDecoration: "none",
            background: modoMetricas ? "#1a1a1a" : "var(--card-bg)",
            color: modoMetricas ? "#fff" : "var(--text)",
            border: "1px solid var(--border)",
          }}
        >
          Métricas
        </a>
        <a
          href="/transacoes?view=kanban"
          style={{
            fontSize: 13,
            padding: "6px 14px",
            borderRadius: 6,
            textDecoration: "none",
            background: modoKanban ? "#1a1a1a" : "var(--card-bg)",
            color: modoKanban ? "#fff" : "var(--text)",
            border: "1px solid var(--border)",
          }}
        >
          Kanban
        </a>
      </div>

      {modoMetricas ? (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
            {(
              [
                { titulo: "Reservas", tipo: "reserva" as const, cor: "#3b82c4", bg: "#e6f1fb" },
                { titulo: "Repasses", tipo: "repasse" as const, cor: "#0f9d78", bg: "#e1f5ee" },
                { titulo: "Distratos", tipo: "distrato" as const, cor: "#c0392b", bg: "#fcebeb" },
              ]
            ).map((c) => (
              <div key={c.tipo} style={{ background: c.bg, borderRadius: 12, padding: "1rem" }}>
                <p style={{ fontSize: 12, color: c.cor, fontWeight: 600, marginBottom: 4 }}>{c.titulo}</p>
                <p style={{ fontSize: 24, fontWeight: 700, color: "#222" }}>
                  {totais[c.tipo].soma.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </p>
                <p style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{totais[c.tipo].qtd} registro(s)</p>
              </div>
            ))}
          </div>
          <GraficoFinanceiro dados={dadosGrafico} />
        </div>
      ) : modoKanban ? (
        <KanbanFinanceiro transacoesIniciais={transacoes} />
      ) : (
        <>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {ABAS.map((aba) => (
          <a
            key={aba.tipo}
            href={`/transacoes?tipo=${aba.tipo}`}
            style={{
              fontSize: 13,
              padding: "6px 14px",
              borderRadius: 6,
              textDecoration: "none",
              background: tipoAtivo === aba.tipo ? "#1a1a1a" : "var(--card-bg)",
              color: tipoAtivo === aba.tipo ? "#fff" : "var(--text)",
              border: "1px solid var(--border)",
            }}
          >
            {aba.titulo}
          </a>
        ))}
      </div>

      <FormularioTransacao tipoInicial={tipoAtivo} />

      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left" }}>
              <th style={{ padding: "8px 10px" }}>Data</th>
              <th style={{ padding: "8px 10px" }}>Empreendimento</th>
              <th style={{ padding: "8px 10px" }}>Unidade</th>
              <th style={{ padding: "8px 10px" }}>Corretor</th>
              <th style={{ padding: "8px 10px" }}>Cliente</th>
              <th style={{ padding: "8px 10px" }}>Valor bruto</th>
              <th style={{ padding: "8px 10px" }}>Entrada</th>
              <th style={{ padding: "8px 10px" }}>Comissão</th>
              <th style={{ padding: "8px 10px" }}>Pagamento</th>
              <th style={{ padding: "8px 10px" }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {transacoes.map((t: any) => (
              <TransacaoLinha key={t.id} transacao={t} />
            ))}
            {transacoes.length === 0 && (
              <tr>
                <td colSpan={10} style={{ padding: "16px 10px", color: "var(--text-muted)" }}>
                  Nenhum registro ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
        </>
      )}
    </div>
  );
}
