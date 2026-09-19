// Rate limit simples em memória para o login — sem dependências.
//
// Por que memória: numa serverless (Vercel), cada instância tem seu contador,
// então NÃO é um rate limit distribuído à prova de atacante distribuído. Mas
// resolve o caso real: mata o brute-force de uma origem só (o caso comum) e
// encarece muito qualquer ataque maior. Se um dia precisar do limite real
// compartilhado, dá pra trocar por Upstash Redis sem mudar a interface.
//
// Janela fixa: N tentativas por IP a cada WINDOW_MS; expira sozinho (sem
// timer — a checagem é preguiçosa, na próxima tentativa).

const WINDOW_MS = 15 * 60 * 1000; // 15 minutos
const MAX_TENTATIVAS = 5;

type Registro = { contador: number; expiraEm: number };

// No global para sobreviver ao hot-reload em dev e reusar a instância quente
const globalForRate = global as unknown as { loginRateMap?: Map<string, Registro> };
const tentativas = globalForRate.loginRateMap ?? new Map<string, Registro>();
globalForRate.loginRateMap = tentativas;

export function ipDaRequisicao(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  // x-forwarded-for pode vir como lista "cliente, proxy1, proxy2" — o primeiro é o cliente
  return fwd?.split(",")[0].trim() || "desconhecido";
}

export function loginPermitido(ip: string): { permitido: boolean; restamSegundos: number } {
  agora_limpa();
  const reg = tentativas.get(ip);
  if (!reg || reg.expiraEm <= Date.now()) return { permitido: true, restamSegundos: 0 };
  const restamSegundos = Math.ceil((reg.expiraEm - Date.now()) / 1000);
  return { permitido: reg.contador < MAX_TENTATIVAS, restamSegundos };
}

// Chamar a cada tentativa de login FALHA.
export function registrarFalha(ip: string): void {
  agora_limpa();
  const reg = tentativas.get(ip);
  if (!reg || reg.expiraEm <= Date.now()) {
    tentativas.set(ip, { contador: 1, expiraEm: Date.now() + WINDOW_MS });
  } else {
    reg.contador += 1;
  }
}

// Chamar quando o login dá certo — não faz sentido punir quem acertou a senha.
export function limparFalhas(ip: string): void {
  tentativas.delete(ip);
}

function agora_limpa(): void {
  const agora = Date.now();
  if (tentativas.size > 1000) {
    // Proteção contra crescimento descontrolado (muitos IPs distintos):
    // derruba tudo — o custo é só os contadores de 15min recomeçarem.
    tentativas.clear();
    return;
  }
  for (const [ip, reg] of tentativas) {
    if (reg.expiraEm <= agora) tentativas.delete(ip);
  }
}
