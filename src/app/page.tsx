// app/page.tsx (ou onde monta a Visão geral)
const financeiroPorFase = await sql`
  SELECT
    tipo AS fase,                -- 'reserva' | 'repasse' | 'distrato'
    COUNT(*)::int AS quantidade,
    COALESCE(SUM(valor_bruto), 0)::numeric AS valor_total
  FROM financeiro
  WHERE status != 'cancelada'    -- ignora canceladas, como no resto do módulo
  GROUP BY tipo
`;

// normaliza pra sempre ter as 3 fases, mesmo com 0
const fases = ['reserva', 'repasse', 'distrato'];
const dadosGrafico = fases.map((fase) => {
  const row = financeiroPorFase.find((r) => r.fase === fase);
  return {
    fase: fase === 'reserva' ? 'Reservas' : fase === 'repasse' ? 'Repasses' : 'Distratos',
    quantidade: row?.quantidade ?? 0,
    valor: Number(row?.valor_total ?? 0),
  };
});
