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

const FASE_COR_PONTO: Record<string, string> = {
  novo: "#b4b2a9",
  atendimento: "#3b82c4",
  interessado: "#0f9d78",
  hot_lead: "#e8973a",
  analise_cca: "#4527a0",
  pend_documentacao: "#303f9f",
  aprovado: "#1b5e20",
  condicionado: "#7a4a00",
  reprovado: "#212121",
  restricao: "#c0392b",
  interesse_futuro: "#8a5a00",
  sem_interesse: "#999",
};

export default async function VisaoGeralPage() {
  const [totalLeads] = await query(`SELECT COUNT(*)::int AS total FROM leads`);
  const [totalIndicadores] = await query(
    `SELECT COUNT(DISTINCT indicado_por)::int AS total FROM leads WHERE indicado_por IS NOT NULL`
  );
  const [hotLeads] = await query(`SELECT COUNT(*)::int AS total FROM leads WHERE fase = 'hot_lead'`);
  const [indicacoesLeads] = await query(`SELECT COUNT(*)::int AS total FROM leads WHERE origem = 'indicacao'`);
  const [novosSeteDias] = await query(`
    SELECT COUNT(*)::int AS total
    FROM leads
    WHERE criado_em >= now() - interval '7 days'
  `);
  const [aprovados] = await query(`SELECT COUNT(*)::int AS total FROM leads WHERE fase = 'aprovado'`);

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

  const ultimosLeads = await query(`
    SELECT id, nome, telefone, fase, origem, criado_em
    FROM leads
    ORDER BY criado_em DESC
    LIMIT 8
  `);

  const [chamadasResumo] = await query(`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE resultado_atendimento = 'atendida')::int AS atendidas,
      COUNT(*) FILTER (WHERE resultado_atendimento = 'nao_atendida')::int AS nao_atendidas,
      COUNT(*) FILTER (WHERE resultado_atendimento = 'recusada')::int AS recusadas
    FROM chamadas
    WHERE iniciado_em >= now() - interval '30 days'
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
    { titulo: "Novos (7 dias)", valor: novosSeteDias.total, cor: "#0f9d78", bg: "#e1f5ee" },
    { titulo: "Hot leads 🔥", valor: hotLeads.total, cor: "#e8973a", bg: "#faeeda" },
    { titulo: "Aprovados ✅", valor: aprovados.total, cor: "#1b5e20", bg: "#dff5e1" },
    { titulo: "Indicadores ativos", valor: totalIndicadores.total, cor: "#8b5cf6", bg: "#f0ebfd" },
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

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 16, marginTop: 16 }}>
        <div style={{ background: "var(--card-bg)", borderRadius: 12, padding: "1.25rem", border: "1px solid var(--border)" }}>
          <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: "var(--accent-2)" }}>Chamadas · últimos 30 dias</p>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>Desempenho do discador e da IA de voz</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
            <div style={{ background: "var(--bg)", borderRadius: 8, padding: "10px 12px" }}>
              <p style={{ fontSize: 11, color: "var(--text-muted)" }}>Total</p>
              <strong style={{ fontSize: 22, color: "var(--text)" }}>{chamadasResumo?.total ?? 0}</strong>
            </div>
            <div style={{ background: "#e1f5ee", borderRadius: 8, padding: "10px 12px" }}>
              <p style={{ fontSize: 11, color: "#085041" }}>Atendidas</p>
              <strong style={{ fontSize: 22, color: "#085041" }}>{chamadasResumo?.atendidas ?? 0}</strong>
            </div>
            <div style={{ background: "#faeeda", borderRadius: 8, padding: "10px 12px" }}>
              <p style={{ fontSize: 11, color: "#633806" }}>Não atendidas</p>
              <strong style={{ fontSize: 22, color: "#633806" }}>{chamadasResumo?.nao_atendidas ?? 0}</strong>
            </div>
            <div style={{ background: "#fcebeb", borderRadius: 8, padding: "10px 12px" }}>
              <p style={{ fontSize: 11, color: "#791f1f" }}>Recusadas</p>
              <strong style={{ fontSize: 22, color: "#791f1f" }}>{chamadasResumo?.recusadas ?? 0}</strong>
            </div>
          </div>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 14 }}>
            Taxa de atendimento: <strong style={{ color: "var(--text)" }}>
              {Number(chamadasResumo?.total) > 0 ? `${Math.round((Number(chamadasResumo.atendidas) / Number(chamadasResumo.total)) * 100)}%` : "—"}
            </strong>
          </p>
        </div>

        <div style={{ background: "var(--card-bg)", borderRadius: 12, padding: "1.25rem", border: "1px solid var(--border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--accent-2)" }}>Leads recentes</p>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>Últimos contatos que entraram no CRM</p>
            </div>
            <a href="/leads" style={{ fontSize: 12, color: "var(--accent-2)" }}>Ver todos →</a>
          </div>
          {ultimosLeads.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Nenhum lead cadastrado ainda.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {ultimosLeads.map((lead: any) => (
                <div key={lead.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "9px 0", borderTop: "1px solid var(--border)" }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lead.nome || "Lead sem nome"}</p>
                    <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{lead.telefone || "Sem telefone"} · {lead.origem || "sem origem"}</p>
                  </div>
                  <span style={{ fontSize: 10, color: FASE_COR_PONTO[lead.fase] || "var(--text-muted)", background: `${FASE_COR_PONTO[lead.fase] || "#999"}22`, padding: "3px 7px", borderRadius: 8, whiteSpace: "nowrap" }}>
                    {CORES_FASE[lead.fase]?.titulo || lead.fase || "—"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ background: "var(--card-bg)", borderRadius: 12, padding: "1.25rem", border: "1px solid var(--border)", marginTop: 16 }}>
        <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 20, color: "var(--accent-2)" }}>Financeiro por fase</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {dadosFinanceiro.map((d) => (
            <div key={d.tipo}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{d.titulo}</span>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{d.quantidade} registro(s)</span>
              </div>

              <div style={{ background: "var(--bg)", borderRadius: 6, height: 10, marginBottom: 6, overflow: "hidden" }}>
                <div
                  style={{
                    width: `${(d.quantidade / maiorQuantidade) * 100}%`,
                    background: d.cor,
                    height: "100%",
                    borderRadius: 6,
                  }}
                />
              </div>

              <div style={{ background: "var(--bg)", borderRadius: 6, height: 10, marginBottom: 6, overflow: "hidden" }}>
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

              <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>{formatarMoeda(d.valor)}</p>
            </div>
          ))}
        </div>
      </div>

      <FunilVendas dadosFase={dadosFase} totalLeads={totalLeads.total} />
    </div>
  );
}
