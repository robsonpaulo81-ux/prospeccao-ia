type DadoFase = {
  fase: string;
  titulo: string;
  cor: string;
  total: number;
};

export default function FunilVendas({ dadosFase, totalLeads }: { dadosFase: DadoFase[]; totalLeads: number }) {
  const maiorTotal = Math.max(1, ...dadosFase.map((d) => d.total));

  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: "1.25rem", border: "1px solid #e5e3da", marginTop: 16 }}>
      <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: "#333" }}>Funil de vendas</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {dadosFase.map((d) => {
          const porcentagemDoTotal = totalLeads > 0 ? (d.total / totalLeads) * 100 : 0;
          const larguraBarra = (d.total / maiorTotal) * 100;

          return (
            <div key={d.fase}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#333" }}>{d.titulo}</span>
                <span style={{ fontSize: 12, color: "#666" }}>
                  {d.total} lead{d.total !== 1 ? "s" : ""} · {porcentagemDoTotal.toFixed(1)}%
                </span>
              </div>
              <div style={{ background: "#f2f0e9", borderRadius: 6, height: 14, overflow: "hidden" }}>
                <div
                  style={{
                    width: `${larguraBarra}%`,
                    background: d.cor,
                    height: "100%",
                    borderRadius: 6,
                    transition: "width 0.3s",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
