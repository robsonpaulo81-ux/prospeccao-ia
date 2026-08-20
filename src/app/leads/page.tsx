'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NovoLeadForm() {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [form, setForm] = useState({
    nome: '',
    telefone: '',
    tipoImovel: '',
    cidadeInteresse: '',
    notas: '',
  });

  function campo(nome: string, valor: string) {
    setForm((prev) => ({ ...prev, [nome]: valor }));
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome.trim()) {
      setErro('Informe o nome do lead.');
      return;
    }
    setErro('');
    setSalvando(true);
    try {
      const resp = await fetch('/api/leads/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!resp.ok) throw new Error('Falha ao salvar.');
      setForm({ nome: '', telefone: '', tipoImovel: '', cidadeInteresse: '', notas: '' });
      setAberto(false);
      router.refresh();
    } catch {
      setErro('Não foi possível salvar. Tente de novo.');
    } finally {
      setSalvando(false);
    }
  }

  const estiloInput: React.CSSProperties = {
    padding: '8px 10px',
    fontSize: 13,
    border: '1px solid #e5e3da',
    borderRadius: 6,
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
        + Novo Lead
      </button>
    );
  }

  return (
    <form
      onSubmit={salvar}
      style={{
        background: '#fff',
        border: '1px solid #e5e3da',
        borderRadius: 10,
        padding: 16,
        marginBottom: 20,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 10,
      }}
    >
      <input style={estiloInput} placeholder="Nome" value={form.nome} onChange={(e) => campo('nome', e.target.value)} />
      <input style={estiloInput} placeholder="Telefone" value={form.telefone} onChange={(e) => campo('telefone', e.target.value)} />
      <select style={estiloInput} value={form.tipoImovel} onChange={(e) => campo('tipoImovel', e.target.value)}>
        <option value="">Tipo de imóvel</option>
        <option value="casa">Casa</option>
        <option value="apartamento">Apê</option>
      </select>
      <select style={estiloInput} value={form.cidadeInteresse} onChange={(e) => campo('cidadeInteresse', e.target.value)}>
        <option value="">Cidade</option>
        <option value="aguas_lindas">Águas Lindas</option>
        <option value="brasilia">Brasília</option>
      </select>
      <input style={estiloInput} placeholder="Observações" value={form.notas} onChange={(e) => campo('notas', e.target.value)} />

      <div style={{ display: 'flex', gap: 8, gridColumn: '1 / -1' }}>
        <button
          type="submit"
          disabled={salvando}
          style={{ fontSize: 13, padding: '8px 14px', border: 'none', borderRadius: 6, background: '#1a1a1a', color: '#fff', cursor: 'pointer' }}
        >
          {salvando ? 'Salvando...' : 'Salvar lead'}
        </button>
        <button
          type="button"
          onClick={() => setAberto(false)}
          style={{ fontSize: 13, padding: '8px 14px', border: '1px solid #e5e3da', borderRadius: 6, background: 'transparent', cursor: 'pointer' }}
        >
          Cancelar
        </button>
      </div>

      {erro && <p style={{ fontSize: 12, color: '#c0392b', gridColumn: '1 / -1' }}>{erro}</p>}
    </form>
  );
}
