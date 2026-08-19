export const dynamic = "force-dynamic";

import { query } from "@/lib/db";
import FormularioTransacao from "./FormularioTransacao";

const ABAS = [
  { tipo: "reserva", titulo: "Reservas" },
  { tipo: "repasse", titulo: "Repasses" },
  { tipo: "distrato", titulo: "Distratos" },
];

function formatarMoeda(valor: string | null) {
  if (!valor) return "-";
  const numero = Number(valor);
  return numero.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarData(data: string | null) {
  if (!data) return "-";
  return new Date(data).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: { tipo?: string };
}) {
  const tipoAtivo = searchParams?.tipo && ["reserva", "repasse", "distrato"].includes(searchParams.tipo)
    ? searchParams.tipo
    : "reserva";

  const transacoes = await query(
    `SELECT * FROM transacoes WHERE tipo = $1 ORDER BY data_transacao DESC NULLS LAST, id DESC`,
    [tipoAtivo]
  );

  return (
    <div>
      <h1 style={{ fontSize: 18, fontWeight: 500, marginBottom: "1rem" }}>Financeiro</h1>

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
            </tr>
          </thead>
          <tbody>
            {transacoes.map((t: any) => (
              <tr key={t.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "8px 10px" }}>{formatarData(t.data_transacao)}</td>
                <td style={{ padding: "8px 10px" }}>{t.empreendimento || "-"}</td>
                <td style={{ padding: "8px 10px" }}>{t.unidade || "-"}</td>
                <td style={{ padding: "8px 10px" }}>{t.corretor || "-"}</td>
                <td style={{ padding: "8px 10px" }}>{t.cliente || "-"}</td>
                <td style={{ padding: "8px 10px" }}>{formatarMoeda(t.valor_bruto)}</td>
                <td style={{ padding: "8px 10px" }}>{formatarMoeda(t.valor_entrada)}</td>
                <td style={{ padding: "8px 10px" }}>{formatarMoeda(t.comissao_corretor)}</td>
                <td style={{ padding: "8px 10px" }}>{t.forma_pagamento || "-"}</td>
              </tr>
            ))}
            {transacoes.length === 0 && (
              <tr>
                <td colSpan={9} style={{ padding: "16px 10px", color: "var(--text-muted)" }}>
                  Nenhum registro ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
