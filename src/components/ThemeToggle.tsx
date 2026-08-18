'use client';

import { useEffect, useState } from 'react';

type Tema = 'claro' | 'escuro' | 'automatico';

function calcularTemaAplicado(tema: Tema): 'light' | 'dark' {
  if (tema === 'claro') return 'light';
  if (tema === 'escuro') return 'dark';
  const prefereEscuro = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefereEscuro ? 'dark' : 'light';
}

export default function ThemeToggle() {
  const [tema, setTema] = useState<Tema>('automatico');

  useEffect(() => {
    const salvo = (localStorage.getItem('tema') as Tema) || 'automatico';
    setTema(salvo);
    document.documentElement.setAttribute('data-theme', calcularTemaAplicado(salvo));

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => {
      const atual = (localStorage.getItem('tema') as Tema) || 'automatico';
      if (atual === 'automatico') {
        document.documentElement.setAttribute('data-theme', calcularTemaAplicado('automatico'));
      }
    };
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  function mudarTema(novoTema: Tema) {
    setTema(novoTema);
    localStorage.setItem('tema', novoTema);
    document.documentElement.setAttribute('data-theme', calcularTemaAplicado(novoTema));
  }

  return (
    <select
      value={tema}
      onChange={(e) => mudarTema(e.target.value as Tema)}
      style={{
        fontSize: 12,
        padding: '4px 6px',
        borderRadius: 6,
        border: '1px solid var(--border)',
        background: 'var(--card-bg)',
        color: 'var(--text)',
        marginTop: 12,
        width: '100%',
      }}
    >
      <option value="claro">☀️ Claro</option>
      <option value="escuro">🌙 Escuro</option>
      <option value="automatico">🖥️ Automático</option>
    </select>
  );
}
