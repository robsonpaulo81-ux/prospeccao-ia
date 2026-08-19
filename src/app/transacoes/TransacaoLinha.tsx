'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Transacao = {
  id: number;
  empreendimento: string | null;
  unidade: string | null;
  corretor: string | null;
  cliente: string | null;
  valor_bruto: string | null;
  valor_entrada: string | null;
  comissao_corretor: string | null;
  forma_pagamento: string | null;
  data_transacao: string | null;
};

function formatarMoeda(valor: string | null) {
  if (!valor) return '-';
  const numero = Number(valor);
  return numero.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarData(data: string | null) {
  if (!data) return '-';
  return new Date(data).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

function paraInputDate(data: string | null) {
  if (!data) return '';
  return new Date(data).toISOString().slice(0, 10);
}

export default function TransacaoLinha({ transacao }: { transacao: Transacao }) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({
    empreendimento: transacao.empreendimento || '',
    unidade: transacao.unidade || '',
    corretor: transacao.corretor || '',
    cliente: transacao.cliente || '',
    valorBruto: transacao.valor_bruto || '',
    valorEntrada: transacao.valor_entrada || '',
    comissaoCorretor: transacao.comissao_corretor || '',
    formaPagamento: transacao.forma_pagamento || '',
    dataTransacao: paraInputDate(transacao.data_transacao),
  });

  function campo(nome: string, valor: string) {
    setForm((prev) => ({ ...prev, [nome]: valor }));
  }

  async function salvar() {
    setSalvando(true);
    try {
      const resp = await fetch(`/api/transacoes/${transacao.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!resp.ok) throw new Error('Falha ao salvar.');
      setEditando(false);
      router.refresh();
    } catch {
      alert('Não foi possível salvar as alterações.');
    } finally {
      setSalvando(false);
    }
  }

  async function cancelarRegistro() {
    if (!confirm('Tem certeza que deseja cancelar (excluir) este registro?')) return;
    try {
      const resp = await fetch(`/api/transacoes/${transacao.id}`, { method: 'DELETE' });
      if (!resp.ok) throw new Error('Falha ao cancelar.');
      router.refresh();
    } catch {
      alert('Não foi possível cancelar o registro.');
    }
  }

  const estiloInput: React.CSSProperties = {
    width: '100%',
    padding: '4px 6px',
    fontSize: 12,
    border: '1px solid var(--border)',
    borderRadius: 4,
    background: 'var(--card-bg)',
    color: 'var(--text)',
  };

  if (editando) {
    return (
      <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(128,128,128,0.05)' }}>
        <td style={{ padding: 6 }}><input style={estiloInput} type="date" value={form.dataTransacao} onChange={(e) => campo('dataTransacao', e.target.value)} /></td>
        <td style={{ padding: 6 }}><input style={estiloInput} value={form.empreendimento} onChange={(e) => campo('empreendimento', e.target.value)} /></td>
        <td style={{ padding: 6 }}><input style={estiloInput} value={form.unidade} onChange={(e) => campo('unidade', e.target.value)} /></td>
        <td style={{ padding: 6 }}><input style={estiloInput} value={form.corretor} onChange={(e) => campo('corretor', e.target.value)} /></td>
        <td style={{ padding: 6 }}><input style={estiloInput} value={form.cliente} onChange={(e) => campo('cliente', e.target.value)} /></td>
        <td style={{ padding: 6 }}><input style={estiloInput} type="number" step="0.01" value={form.valorBruto} onChange={(e) => campo('valorBruto', e.target.value)} /></td>
        <td style={{ padding: 6 }}><input style={estiloInput} type="number" step="0.01" value={form.valorEntrada} onChange={(e) => campo('valorEntrada', e.target.value)} /></td>
        <td style={{ padding: 6 }}><input style={estiloInput} type="number" step="0.01" value={form.comissaoCorretor} onChange={(e) => campo('comissaoCorretor', e.target.value)} /></td>
        <td style={{ padding: 6 }}><input style={estiloInput} value={form.formaPagamento} onChange={(e) => campo('formaPagamento', e.target.value)} /></td>
        <td style={{ padding: 6, whiteSpace: 'nowrap' }}>
          <button onClick={salvar} disabled={salvando} style={{ fontSize: 11, padding: '4px 8px', marginRight: 4, border: 'none', borderRadius: 4, background: '#1a1a1a', color: '#fff', cursor: 'pointer' }}>
            {salvando ? '...' : 'Salvar'}
          </button>
          <button onClick={() => setEditando(false)} style={{ fontSize: 11, padding: '4px 8px', border: '1px solid var(--border)', borderRadius: 4, background: 'transparent', color: 'var(--text)', cursor: 'pointer' }}>
            Cancelar
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr style={{ borderBottom: '1px solid var(--border)' }}>
      <td style={{ padding: '8px 10px' }}>{formatarData(transacao.data_transacao)}</td>
      <td style={{ padding: '8px 10px' }}>{transacao.empreendimento || '-'}</td>
      <td style={{ padding: '8px 10px' }}>{transacao.unidade || '-'}</td>
      <td style={{ padding: '8px 10px' }}>{transacao.corretor || '-'}</td>
      <td style={{ padding: '8px 10px' }}>{transacao.cliente || '-'}</td>
      <td style={{ padding: '8px 10px' }}>{formatarMoeda(transacao.valor_bruto)}</td>
      <td style={{ padding: '8px 10px' }}>{formatarMoeda(transacao.valor_entrada)}</td>
      <td style={{ padding: '8px 10px' }}>{formatarMoeda(transacao.comissao_corretor)}</td>
      <td style={{ padding: '8px 10px' }}>{transacao.forma_pagamento || '-'}</td>
      <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
        <button onClick={() => setEditando(true)} style={{ fontSize: 11, padding: '4px 8px', marginRight: 4, border: '1px solid var(--border)', borderRadius: 4, background: 'transparent', color: 'var(--text)', cursor: 'pointer' }}>
          Editar
        </button>
        <button onClick={cancelarRegistro} style={{ fontSize: 11, padding: '4px 8px', border: '1px solid #c0392b', borderRadius: 4, background: 'transparent', color: '#c0392b', cursor: 'pointer' }}>
          Cancelar
        </button>
      </td>
    </tr>
  );
}
