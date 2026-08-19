'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const ROTULOS_TIPO: Record<string, string> = {
  reserva: 'Reserva',
  repasse: 'Repasse',
  distrato: 'Distrato',
};

export default function FormularioTransacao({ tipoInicial }: { tipoInicial: string }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [form, setForm] = useState({
    empreendimento: '',
    unidade: '',
    corretor: '',
    cliente: '',
    valorBruto: '',
    valorEntrada: '',
    comissaoCorretor: '',
    formaPagamento: '',
    dataTransacao: '',
  });

  function campo(nome: string, valor: string) {
    setForm((prev) => ({ ...prev, [nome]: valor }));
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setSalvando(true);
    try {
      const resp = await fetch('/api/transacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: tipoInicial, ...form }),
      });
      if (!resp.ok) throw new Error('Falha ao salvar.');
      setForm({
        empreendimento: '',
        unidade: '',
        corretor: '',
        cliente: '',
        valorBruto: '',
        valorEntrada: '',
        comissaoCorretor: '',
        formaPagamento: '',
        dataTransacao: '',
      });
      setAberto(false);
      router.refresh();
    } catch (err) {
      setErro('Não foi possível salvar. Tente de novo.');
    } finally {
      setSalvando(false);
    }
  }

  const estiloInput: React.CSSProperties = {
    padding: '8px 10px',
    fontSize: 13,
    border: '1px solid var(--border)',
    borderRadius: 6,
    background: 'var(--card-bg)',
    color: 'var(--text)',
  };

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        style={{
          fontSize: 13,
          padding: '8px 14px',
          border: 'none',
          borderRadius: 6,
          background: '#1a1a1a',
          color: '#fff',
          cursor: 'pointer',
          marginBottom: 16,
        }}
      >
        + Nova {ROTULOS_TIPO[tipoInicial]}
      </button>
    );
  }

  return (
    <form
      onSubmit={salvar}
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: 16,
        marginBottom: 20,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 10,
      }}
    >
      <input style={estiloInput} placeholder="Empreendimento" value={form.empreendimento} onChange={(e) => campo('empreendimento', e.target.value)} />
      <input style={estiloInput} placeholder="Unidade" value={form.unidade} onChange={(e) => campo('unidade', e.target.value)} />
      <input style={estiloInput} placeholder="Corretor" value={form.corretor} onChange={(e) => campo('corretor', e.target.value)} />
      <input style={estiloInput} placeholder="Cliente" value={form.cliente} onChange={(e) => campo('cliente', e.target.value)} />
      <input style={estiloInput} type="number" step="0.01" placeholder="Valor bruto" value={form.valorBruto} onChange={(e) => campo('valorBruto', e.target.value)} />
      <input style={estiloInput} type="number" step="0.01" placeholder="Valor de entrada" value={form.valorEntrada} onChange={(e) => campo('valorEntrada', e.target.value)} />
      <input style={estiloInput} type="number" step="0.01" placeholder="Comissão do corretor" value={form.comissaoCorretor} onChange={(e) => campo('comissaoCorretor', e.target.value)} />
      <input style={estiloInput} placeholder="Forma de pagamento" value={form.formaPagamento} onChange={(e) => campo('formaPagamento', e.target.value)} />
      <input style={estiloInput} type="date" value={form.dataTransacao} onChange={(e) => campo('dataTransacao', e.target.value)} />

      <div style={{ display: 'flex', gap: 8, gridColumn: '1 / -1' }}>
        <button
          type="submit"
          disabled={salvando}
          style={{ fontSize: 13, padding: '8px 14px', border: 'none', borderRadius: 6, background: '#1a1a1a', color: '#fff', cursor: 'pointer' }}
        >
          {salvando ? 'Salvando...' : 'Salvar'}
        </button>
        <button
          type="button"
          onClick={() => setAberto(false)}
          style={{ fontSize: 13, padding: '8px 14px', border: '1px solid var(--border)', borderRadius: 6, background: 'transparent', color: 'var(--text)', cursor: 'pointer' }}
        >
          Cancelar
        </button>
      </div>

      {erro && <p style={{ fontSize: 12, color: '#c0392b', gridColumn: '1 / -1' }}>{erro}</p>}
    </form>
  );
}
