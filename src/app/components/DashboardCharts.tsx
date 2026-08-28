'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

type DadosFase = { fase: string; titulo: string; total: number; cor: string };

export default function DashboardCharts({ dadosFase }: { dadosFase: DadosFase[] }) {
  return (
    <div style={{ background: 'var(--card-bg)', borderRadius: 12, padding: '1.25rem', border: '1px solid var(--border)' }}>
      <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: 'var(--accent-2)' }}>Leads por fase</p>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={dadosFase} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <XAxis dataKey="titulo" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }}
            cursor={{ fill: 'var(--bg)' }}
          />
          <Bar dataKey="total" radius={[6, 6, 0, 0]}>
            {dadosFase.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.cor} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
