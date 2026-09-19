// Autenticação do dashboard via token assinado (HMAC-SHA256), sem dependências.
//
// Por que não guardar a senha no cookie (comportamento antigo): o cookie viajando
// em toda requisição com o valor da senha real significa que um vazamento de
// cookie vaza também a senha. Com o token assinado, o cookie só prova que alguém
// já autenticou — a senha nunca sai do servidor.
//
// O token é `<payload-base64url>.<assinatura-base64url>`, onde payload é
// { exp } (expiry em ms). Usa apenas Web Crypto (disponível no Edge runtime do
// middleware e no Node 18+), então o mesmo código roda nos dois lados.

const TOKEN_DURATION_MS = 1000 * 60 * 60 * 24 * 30; // 30 dias

export const AUTH_COOKIE = "crm_auth";

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(str: string): Uint8Array {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) base64 += "=";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

// Gera o token a partir da senha correta. A senha em si não vai no token —
// só a assinatura HMAC dela serve de segredo.
export async function gerarToken(senha: string): Promise<string> {
  const payload = JSON.stringify({ exp: Date.now() + TOKEN_DURATION_MS });
  const payloadB64 = toBase64Url(new TextEncoder().encode(payload));
  const key = await hmacKey(senha);
  const assinatura = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadB64));
  return `${payloadB64}.${toBase64Url(new Uint8Array(assinatura))}`;
}

// Valida o cookie contra a senha atual. Se a senha do .env mudar, todos os
// tokens antigos param de valer automaticamente (o segredo HMAC muda junto).
export async function tokenValido(token: string | undefined, senha: string): Promise<boolean> {
  if (!token || !senha) return false;
  const [payloadB64, assinaturaB64] = token.split(".");
  if (!payloadB64 || !assinaturaB64) return false;
  try {
    const key = await hmacKey(senha);
    const valida = await crypto.subtle.verify(
      "HMAC",
      key,
      fromBase64Url(assinaturaB64) as BufferSource,
      new TextEncoder().encode(payloadB64)
    );
    if (!valida) return false;
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(payloadB64)));
    return typeof payload.exp === "number" && payload.exp > Date.now();
  } catch {
    return false;
  }
}
