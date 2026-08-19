export const dynamic = "force-dynamic";

import { query } from "@/lib/db";
import DashboardCharts from "./components/DashboardCharts";
import AutoAtualizar from "./components/AutoAtualizar";

const CORES_FASE: Record<string, { titulo: string; cor: string }> = {
  novo: { titulo: "Novo", cor: "#b4b2a9" },
  atendimento: { titulo: "Em atend.", cor: "#3b82c4" },
  interessado: { titulo: "Interessado", cor: "#0f9d78" },
  hot_lead: { titulo: "Hot lead", cor: "#e8973a" },
  restricao: { titulo: "Restrição", cor: "#c0392b" },
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

  // NOVO: Financeiro por fase (Reservas / Repasses / Distratos)
  let financeiroPorFase: any[] = [];
  try {
    financeiroPorFase = await query(`
      SELECT tipo,
             COUNT(*)::int AS quantidade,
             COALESCE(SUM(valor_bruto), 0)::numeric AS valor_total
      FROM financeiro
      WHERE status != 'cancelada'
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
      <h1 style={{ fontSize: 18, fontWeight: 500, marginBottom: "1.25rem" }}>Visão geral</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
        {cards.map((c) => (
          <div key={c.titulo} style={{ background: c.bg, borderRadius: 12, padding: "1rem" }}>
            <p style={{ fontSize: 12, color: c.cor, fontWeight: 600, marginBottom: 4 }}>{c.titulo}</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: "#222" }}>{c.valor}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        <DashboardCharts dadosFase={dadosFase} />

        <div style={{ background: "#fff", borderRadius: 12, padding: "1.25rem", border: "1px solid #e5e3da" }}>
          <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: "#333" }}>Top indicadores</p>
          {topIndicadores.length === 0 ? (
            <p style={{ fontSize: 13, color: "#999" }}>Nenhuma indicação ainda.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {topIndicadores.map((ind: any, i: number) => (
                <div key={ind.nome} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#333" }}>
                  <span style={{ color: "#333" }}>
                    {["🥇", "🥈", "🥉"][i] ?? "•"} {ind.nome}
                  </span>
                  <strong style={{ color: "#111" }}>{ind.total}</strong>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* NOVO: Financeiro por fase — full width, abaixo do grid acima */}
      <div style={{ background: "#fff", borderRadius: 12, padding: "1.25rem", border: "1px solid #e5e3da", marginTop: 16 }}>
        <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 20, color: "#333" }}>Financeiro por fase</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {dadosFinanceiro.map((d) => (
            <div key={d.tipo}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#333" }}>{d.titulo}</span>
                <span style={{ fontSize: 12, color: "#999" }}>{d.quantidade} registro(s)</span>
              </div>

              {/* barra: quantidade */}
              <div style={{ background: "#f2f0e9", borderRadius: 6, height: 10, marginBottom: 6, overflow: "hidden" }}>
                <div
                  style={{
                    width: `${(d.quantidade / maiorQuantidade) * 100}%`,
                    background: d.cor,
                    height: "100%",
                    borderRadius: 6,
                  }}
                />
              </div>

              {/* barra: valor */}
              <div style={{ background: "#f2f0e9", borderRadius: 6, height: 10, marginBottom: 6, overflow: "hidden" }}>
                <div
                  style={{
                    width: `${(d.valor / maiorValor) * 100}%`,
                    background: d.cor,
                    opacity: 0.55,
                    height: "100%",
                    borderRadius: 6,
                  }}
                />
              </div>

              <p style={{ fontSize: 15, fontWeight: 700, color: "#222" }}>{formatarMoeda(d.valor)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
