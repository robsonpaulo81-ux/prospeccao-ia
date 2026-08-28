type DadoFase = {
  fase: string;
  titulo: string;
  cor: string;
  total: number;
};

const ICONE_FASE: Record<string, string> = {
  novo: "🆕",
  atendimento: "💬",
  interessado: "👍",
  hot_lead: "🔥",
  analise_cca: "📋",
  pend_documentacao: "📁",
  aprovado: "✅",
  condicionado: "⏳",
  reprovado: "⛔",
  restricao: "⚠️",
  interesse_futuro: "📅",
  sem_interesse: "🗑️",
};

export default function FunilVendas({ dadosFase, totalLeads }: { dadosFase: DadoFase[]; totalLeads: number }) {
  const dadosOrdenados = [...dadosFase].sort((a, b) => b.total - a.total);
  const aprovados = dadosFase.find((d) => d.fase === "aprovado")?.total ?? 0;
  const conversaoGeral = totalLeads > 0 ? (aprovados / totalLeads) * 100 : 0;

  return (
    <div style={{ background: "var(--card-bg)", borderRadius: 12, padding: "1.25rem", border: "1px solid var(--border)", marginTop: 16 }}>
      <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: "var(--accent-2)" }}>Funil de vendas</p>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", fontSize: 11, color: "var(--text-muted)", fontWeight: 600, padding: "0 4px", marginBottom: 8 }}>
        <span>ETAPA</span>
        <span style={{ textAlign: "center" }}>QTD.</span>
        <span style={{ textAlign: "right" }}>% DO TOTAL</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {dadosOrdenados.map((d) => {
          const porcentagemDoTotal = totalLeads > 0 ? (d.total / totalLeads) * 100 : 0;
          return (
            <div
              key={d.fase}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr",
                alignItems: "center",
                background: d.cor,
                borderRadius: 8,
                padding: "10px 12px",
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", display: "flex", alignItems: "center", gap: 8 }}>
                <span>{ICONE_FASE[d.fase] ?? "•"}</span> {d.titulo}
              </span>
              <span style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a", textAlign: "center" }}>{d.total}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", textAlign: "right" }}>{porcentagemDoTotal.toFixed(2)}%</span>
            </div>
          );
        })}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 16,
          padding: "10px 12px",
          background: "var(--accent-2)",
          borderRadius: 8,
          color: "#1a1a1a",
        }}
      >
        <span style={{ fontSize: 12 }}>
          TOTAL DE LEADS: <strong style={{ fontSize: 15 }}>{totalLeads}</strong>
        </span>
        <span style={{ fontSize: 12 }}>
          CONVERSÃO (Aprovado): <strong style={{ fontSize: 15 }}>{conversaoGeral.toFixed(2)}%</strong>
        </span>
      </div>
    </div>
  );
}
