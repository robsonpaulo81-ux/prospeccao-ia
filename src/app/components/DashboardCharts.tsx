'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

type DadosFase = { fase: string; titulo: string; total: number; cor: string };

export default function DashboardCharts({ dadosFase }: { dadosFase: DadosFase[] }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '1.25rem', border: '1px solid #e5e3da' }}>
      <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#333' }}>Leads por fase</p>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={dadosFase} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <XAxis dataKey="titulo" tick={{ fontSize: 11, fill: '#777' }} axisLine={{ stroke: '#eee' }} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#777' }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #eee' }}
            cursor={{ fill: '#f7f6f2' }}
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
