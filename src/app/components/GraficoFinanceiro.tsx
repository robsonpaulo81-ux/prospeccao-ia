'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

type DadosTipo = { tipo: string; titulo: string; total: number; cor: string };

export default function GraficoFinanceiro({ dados }: { dados: DadosTipo[] }) {
  return (
    <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, padding: '1.25rem' }}>
      <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: 'var(--text)' }}>Valor bruto por tipo</p>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={dados} margin={{ top: 8, right: 8, left: 10, bottom: 0 }}>
          <XAxis dataKey="titulo" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
          <YAxis
            tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`}
            tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--border)' }}
          />
          <Bar dataKey="total" radius={[6, 6, 0, 0]}>
            {dados.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.cor} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
