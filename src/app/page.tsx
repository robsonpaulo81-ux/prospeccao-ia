export const dynamic = "force-dynamic";

import { query } from "@/lib/db";
import DashboardCharts from "./components/DashboardCharts";
import AutoAtualizar from "./components/AutoAtualizar";
import FunilVendas from "./components/FunilVendas";

const CORES_FASE: Record<string, { titulo: string; cor: string }> = {
  novo: { titulo: "Novo", cor: "#b4b2a9" },
  atendimento: { titulo: "Em atend.", cor: "#3b82c4" },
  interessado: { titulo: "Interessado", cor: "#0f9d78" },
  hot_lead: { titulo: "Hot lead", cor: "#e8973a" },
  analise_cca: { titulo: "Análise CCA", cor: "#4527a0" },
  pend_documentacao: { titulo: "Pend. Documentação", cor: "#303f9f" },
  aprovado: { titulo: "Aprovado", cor: "#1b5e20" },
  condicionado: { titulo: "Condicionado", cor: "#7a4a00" },
  reprovado: { titulo: "Reprovado", cor: "#212121" },
  restricao: { titulo: "Tem restrição", cor: "#c0392b" },
  interesse_futuro: { titulo: "Interesse Futuro", cor: "#8a5a00" },
  sem_interesse: { titulo: "Sem interesse", cor: "#999" },
};

const CORES_FASE_FINANCEIRO: Record<string, { titulo: string; cor: string }> = {
  reserva: { titulo: "Reservas", cor: "#3b82c4" },
  repasse: { titulo: "Repasses", cor: "#0f9d78" },
  distrato: { titulo: "Distratos", cor: "#c0392b" },
};

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

export default async function VisaoGeralPage() {
  const [totalLeads] = await query(`SELECT COUNT(*)::int AS total FROM leads`);
  const [totalIndicadores] = await query(
    `SELECT COUNT(DISTINCT indicado_por)::int AS total FROM leads WHERE indicado_por IS NOT NULL`
  );
  const [hotLeads] = await query(`SELECT COUNT(*)::int AS total FROM leads WHERE fase = 'hot_lead'`);
  const [indicacoesLeads] = await query(`SELECT COUNT(*)::int AS total FROM leads WHERE origem = 'indicacao'`);

  const porFase = await query(`
    SELECT fase, COUNT(*)::int AS total FROM leads GROUP BY fase
  `);

  const dadosFase = Object.entries(CORES_FASE).map(([fase, info]) => {
    const encontrado = porFase.find((f: any) => f.fase === fase);
    return { fase, titulo: info.titulo, cor: info.cor, total: encontrado ? encontrado.total : 0 };
  });

  const topIndicadores = await query(`
    SELECT i.nome, COUNT(l.id)::int AS total
    FROM indicadores i
    JOIN leads l ON l.indicado_por = i.id
    GROUP BY i.id
    ORDER BY total DESC
    LIMIT 5
  `);

  let financeiroPorFase: any[] = [];
  try {
    financeiroPorFase = await query(`
      SELECT tipo,
             COUNT(*)::int AS quantidade,
             COALESCE(SUM(valor_bruto), 0)::numeric AS valor_total
      FROM transacoes
      GROUP BY tipo
    `);
  } catch (erro) {
    console.error("Erro ao buscar financeiro por fase:", erro);
    financeiroPorFase = [];
  }

  const dadosFinanceiro = Object.entries(CORES_FASE_FINANCEIRO).map(([tipo, info]) => {
    const encontrado = financeiroPorFase.find((f: any) => f.tipo === tipo);
    return {
      tipo,
      titulo: info.titulo,
      cor: info.cor,
      quantidade: encontrado ? Number(encontrado.quantidade) : 0,
      valor: encontrado ? Number(encontrado.valor_total) : 0,
    };
  });

  const maiorQuantidade = Math.max(1, ...dadosFinanceiro.map((d) => d.quantidade));
  const maiorValor = Math.max(1, ...dadosFinanceiro.map((d) => d.valor));

  const cards = [
    { titulo: "Total de leads", valor: totalLeads.total, cor: "#3b82c4", bg: "#e6f1fb" },
    { titulo: "Hot leads 🔥", valor: hotLeads.total, cor: "#e8973a", bg: "#faeeda" },
    { titulo: "Indicadores ativos", valor: totalIndicadores.total, cor: "#0f9d78", bg: "#e1f5ee" },
    { titulo: "Leads por indicação", valor: indicacoesLeads.total, cor: "#8b5cf6", bg: "#f0ebfd" },
  ];

  return (
    <div>
      <AutoAtualizar />
      <h1 style={{ fontSize: 18, fontWeight: 500, marginBottom: "1.25rem", color: "var(--accent-2)" }}>Visão geral</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
        {cards.map((c) => (
          <div key={c.titulo} style={{ background: "var(--card-bg)", border: `1px solid ${c.cor}`, borderRadius: 12, padding: "1rem" }}>
            <p style={{ fontSize: 12, color: c.cor, fontWeight: 600, marginBottom: 4 }}>{c.titulo}</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: "var(--text)" }}>{c.valor}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        <DashboardCharts dadosFase={dadosFase} />

        <div style={{ background: "var(--card-bg)", borderRadius: 12, padding: "1.25rem", border: "1px solid var(--border)" }}>
          <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: "var(--accent-2)" }}>Top indicadores</p>
          {topIndicadores.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Nenhuma indicação ainda.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {topIndicadores.map((ind: any, i: number) => (
                <div key={ind.nome} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--text)" }}>
                  <span style={{ color: "var(--text)" }}>
                    {["🥇", "🥈", "🥉"][i] ?? "•"} {ind.nome}
                  </span>
                  <strong style={{ color: "var(--text)" }}>{ind.total}</strong>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ background: "var(--card-bg)", borderRadius: 12, padding: "1.25rem", border: "1px solid var(--border)", marginTop: 16 }}>
        <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 20, color: "var(--accent-2)" }}>Financeiro por fase</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
