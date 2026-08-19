// Faça isso:
export default async function Page() {  // ✅ função async
  const financeiroPorFase = await sql`
    SELECT
      tipo AS fase,
      COUNT(*)::int AS quantidade,
      COALESCE(SUM(valor_bruto), 0)::numeric AS valor_total
    FROM financeiro
    WHERE status != 'cancelada'
    GROUP BY tipo
  `;

  const fases = ['reserva', 'repasse', 'distrato'];
  const dadosGrafico = fases.map((fase) => {
    const row = financeiroPorFase.find((r) => r.fase === fase);
    return {
      fase: fase === 'reserva' ? 'Reservas' : fase === 'repasse' ? 'Repasses' : 'Distratos',
      quantidade: row?.quantidade ?? 0,
      valor: Number(row?.valor_total ?? 0),
    };
  });

  return (
    <div>
      {/* resto do JSX da Visão geral */}
      <div className="mt-6">
        <FinanceiroPorFaseChart dados={dadosGrafico} />
      </div>
    </div>
  );
}
