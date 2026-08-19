'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Atualiza a página automaticamente a cada alguns segundos,
// buscando dados novos do banco sem precisar apertar F5.
export default function AutoAtualizar({ segundos = 8 }: { segundos?: number }) {
  const router = useRouter();

  useEffect(() => {
    const intervalo = setInterval(() => {
      router.refresh();
    }, segundos * 1000);

    return () => clearInterval(intervalo);
  }, [router, segundos]);

  return null;
}
