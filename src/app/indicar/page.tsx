'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function PaginaIndicacao() {
  const searchParams = useSearchParams();
  const indicadorDaUrl = searchParams.get('indicador') || '';

  const [form, setForm] = useState({
    indicadorNome: indicadorDaUrl,
    indicadorTelefone: '',
    leadNome: '',
    leadTelefone: '',
    interesse: 'casa',
  });
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState('');

  function atualizarCampo(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');

    if (!form.indicadorNome || !form.leadNome || !form.leadTelefone) {
      setErro('Preencha nome de quem indica, nome e telefone do indicado.');
      return;
    }

    setEnviando(true);
    try {
      const resp = await fetch('/api/indicacao', {
        method: 'POST',
        headers: {
