export const dynamic = "force-dynamic";

import { query } from "@/lib/db";
import FormularioTransacao from "./FormularioTransacao";
import TransacaoLinha from "./TransacaoLinha";
import KanbanFinanceiro from "./KanbanFinanceiro";
import GraficoFinanceiro from "../components/GraficoFinanceiro";
import AutoAtualizar from "../components/AutoAtualizar";

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

  const baseSelect = `
    SELECT t.*,
           CASE
             WHEN t.lead_id IS NOT NULL AND t.data_transacao IS NOT NULL
               THEN (t.data_transacao::date - (l.criado_em AT TIME ZONE 'America/Sao_Paulo')::date)
             ELSE NULL
           END AS sla_dias
    FROM transacoes t
    LEFT JOIN leads l ON l.id = t.lead_id
  `;

  const transacoes = modoKanban
    ? await query(`${baseSelect} ORDER BY t.id DESC`)
    : !modoMetricas
    ? await query(
        `${baseSelect} WHERE t.tipo = $1 ORDER BY t.data_transacao DESC NULLS LAST, t.id DESC`,
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
      <AutoAtualizar />
      <h1 style={{ fontSize: 18, fontWeight: 500, marginBottom: "1rem", color: "var(--accent-2)" }}>Financeiro</h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <a
          href={`/transacoes?view=lista&tipo=${tipoAtivo}`}
          style={{
            fontSize: 13,
            padding: "6px 14px",
            borderRadius: 6,
            textDecoration: "none",
            background: !modoKanban ? "var(--accent-2)" : "var(--card-bg)",
            color: !modoKanban ? "#1a1a1a" : "var(--text)",
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
            background: modoMetricas ? "var(--accent-2)" : "var(--card-bg)",
            color: modoMetricas ? "#1a1a1a" : "var(--text)",
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
            background: modoKanban ? "var(--accent-2)" : "var(--card-bg)",
            color: modoKanban ? "#1a1a1a" : "var(--text)",
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
                { titulo: "Reservas", tipo: "reserva" as const, cor: "#3b82c4" },
                { titulo: "Repasses", tipo: "repasse" as const, cor: "#0f9d78" },
                { titulo: "Distratos", tipo: "distrato" as const, cor: "#c0392b" },
              ]
            ).map((c) => (
              <div key={c.tipo} style={{ background: "var(--card-bg)", border: `1px solid ${c.cor}`, borderRadius: 12, padding: "1rem" }}>
                <p style={{ fontSize: 12, color: c.cor, fontWeight: 600, marginBottom: 4 }}>{c.titulo}</p>
                <p style={{ fontSize: 24, fontWeight: 700, color: "var(--text)" }}>
                  {totais[c.tipo].soma.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </p>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{totais[c.tipo].qtd} registro(s)</p>
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
              background: tipoAtivo === aba.tipo ? "var(--accent-2)" : "var(--card-bg)",
              color: tipoAtivo === aba.tipo ? "#1a1a1a" : "var(--text)",
              border: "1px solid var(--border)",
            }}
          >
            {aba.titulo}
          </a>
        ))}
      </div>

      <FormularioTransacao tipoInicial={tipoAtivo} />

      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13, color: "var(--text)" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left" }}>
              <th style={{ padding: "8px 10px", color: "var(--accent-2)" }}>Data</th>
              <th style={{ padding: "8px 10px", color: "var(--accent-2)" }}>Empreendimento</th>
              <th style={{ padding: "8px 10px", color: "var(--accent-2)" }}>Unidade</th>
              <th style={{ padding: "8px 10px", color: "var(--accent-2)" }}>Corretor</th>
              <th style={{ padding: "8px 10px", color: "var(--accent-2)" }}>Cliente</th>
              <th style={{ padding: "8px 10px", color: "var(--accent-2)" }}>Valor bruto</th>
              <th style={{ padding: "8px 10px", color: "var(--accent-2)" }}>Entrada</th>
              <th style={{ padding: "8px 10px", color: "var(--accent-2)" }}>Comissão</th>
              <th style={{ padding: "8px 10px", color: "var(--accent-2)" }}>Pagamento</th>
              <th style={{ padding: "8px 10px", textAlign: "center", color: "var(--accent-2)" }}>SLA</th>
              <th style={{ padding: "8px 10px", color: "var(--accent-2)" }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {transacoes.map((t: any) => (
              <TransacaoLinha key={t.id} transacao={t} />
            ))}
            {transacoes.length === 0 && (
              <tr>
                <td colSpan={11} style={{ padding: "16px 10px", color: "var(--text-muted)" }}>
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
