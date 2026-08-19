export const dynamic = "force-dynamic";

import { query } from "@/lib/db";
import ExportButtons from "../components/ExportButtons";
import AutoAtualizar from "../components/AutoAtualizar";

type LinhaIndicador = {
  id: number;
  nome: string;
  telefone: string | null;
  codigo_indicacao: string;
  total_leads: string;
  novo: string;
  atendimento: string;
  interessado: string;
  hot_lead: string;
  restricao: string;
  sem_interesse: string;
};

const COLUNAS_FASE: { chave: keyof LinhaIndicador; titulo: string }[] = [
  { chave: "novo", titulo: "Novo" },
  { chave: "atendimento", titulo: "Em atend." },
  { chave: "interessado", titulo: "Interessado" },
  { chave: "hot_lead", titulo: "Hot lead" },
  { chave: "restricao", titulo: "Restrição" },
  { chave: "sem_interesse", titulo: "Sem interesse" },
];

export default async function IndicadoresPage() {
  const indicadores: LinhaIndicador[] = await query(`
    SELECT
      i.id,
      i.nome,
      i.telefone,
      i.codigo_indicacao,
      COUNT(l.id) AS total_leads,
      COUNT(l.id) FILTER (WHERE l.fase = 'novo') AS novo,
      COUNT(l.id) FILTER (WHERE l.fase = 'atendimento') AS atendimento,
      COUNT(l.id) FILTER (WHERE l.fase = 'interessado') AS interessado,
      COUNT(l.id) FILTER (WHERE l.fase = 'hot_lead') AS hot_lead,
      COUNT(l.id) FILTER (WHERE l.fase = 'restricao') AS restricao,
      COUNT(l.id) FILTER (WHERE l.fase = 'sem_interesse') AS sem_interesse
    FROM indicadores i
    LEFT JOIN leads l ON l.indicado_por = i.id
    GROUP BY i.id
    ORDER BY total_leads DESC
  `);

  return (
    <div>
      <AutoAtualizar />
      <h1 style={{ fontSize: 18, fontWeight: 500, marginBottom: "0.25rem" }}>Indicadores</h1>
      <p style={{ fontSize: 13, color: "#777", marginBottom: "1rem" }}>
        Quem mais indica clientes e em que fase estão as indicações
      </p>

      <ExportButtons csvUrl="/api/export/indicadores" />

      {indicadores.length === 0 ? (
        <p style={{ fontSize: 13, color: "#999" }}>Nenhuma indicação recebida ainda.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #e5e3da", textAlign: "left" }}>
                <th style={{ padding: "8px 12px" }}>Indicador</th>
                <th style={{ padding: "8px 12px" }}>Telefone</th>
                <th style={{ padding: "8px 12px", textAlign: "center" }}>Total</th>
                {COLUNAS_FASE.map((c) => (
                  <th key={c.chave} style={{ padding: "8px 12px", textAlign: "center" }}>
                    {c.titulo}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {indicadores.map((ind, i) => (
                <tr key={ind.id} style={{ borderBottom: "1px solid #f1efe8" }}>
                  <td style={{ padding: "8px 12px", fontWeight: 500 }}>
                    {i === 0 && ind.total_leads !== "0" ? "🏆 " : ""}
                    {ind.nome}
                  </td>
                  <td style={{ padding: "8px 12px", color: "#777" }}>{ind.telefone ?? "-"}</td>
                  <td style={{ padding: "8px 12px", textAlign: "center", fontWeight: 600 }}>
                    {ind.total_leads}
                  </td>
                  {COLUNAS_FASE.map((c) => (
                    <td key={c.chave} style={{ padding: "8px 12px", textAlign: "center", color: "#555" }}>
                      {ind[c.chave] === "0" ? "-" : ind[c.chave]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
