// Normalização de telefones brasileiros — usada por todas as entradas de lead
// (manual, importação, indicação, webhook Meta) e pelos links wa.me.
//
// Por que centralizado: deduplicação só funciona se "061 99999-8888",
// "+5561999998888" e "61999998888" virarem exatamente a mesma chave em todas
// as rotas. Cada rota normalizando do jeito próprio = duplicata garantida.

export function normalizarTelefone(input: string | null | undefined): string | null {
  if (!input) return null;
  const digitos = String(input).replace(/\D/g, "");
  if (!digitos) return null;

  // Local 10-11 dígitos (DDD + número): prefixa o código do Brasil
  if (digitos.length === 10 || digitos.length === 11) {
    return "55" + digitos;
  }

  // Já veio com código do país (55...): mantém como está
  if (digitos.length === 12 || digitos.length === 13) {
    return digitos;
  }

  // Qualquer outra coisa (8-9 dígitos sem DDD, 12+ dígitos estranhos) não é
  // confiável para deduplicação nem para WhatsApp — rejeita.
  return null;
}

export function telefoneValido(input: string | null | undefined): boolean {
  return normalizarTelefone(input) !== null;
}

// Chave canônica para deduplicação: últimos 11 dígitos (DDD + número).
// Igual ao padrão que o webhook do Retell já usava para casar chamadas com leads.
export function chaveTelefone(input: string | null | undefined): string | null {
  const normalizado = normalizarTelefone(input);
  if (!normalizado) return null;
  return normalizado.slice(-11);
}

// Número para links wa.me: dígitos com código do país, sem "+".
export function telefoneWhatsApp(input: string | null | undefined): string | null {
  return normalizarTelefone(input);
}
