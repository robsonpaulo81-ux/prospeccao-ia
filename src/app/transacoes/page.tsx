export const dynamic = "force-dynamic";

import { query } from "@/lib/db";
import FormularioTransacao from "./FormularioTransacao";
import TransacaoLinha from "./TransacaoLinha";
import KanbanFinanceiro from "./KanbanFinanceiro";

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

  const transacoes = modoKanban
    ? await query(`SELECT * FROM transacoes ORDER BY id DESC`)
    : await query(
        `SELECT * FROM transacoes WHERE tipo = $1 ORDER BY data_transacao DESC NULLS LAST, id DESC`,
        [tipoAtivo]
      );

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

      {modoKanban ? (
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
