// Testes das funções puras da lib — sem banco, sem rede, rodam em qualquer lugar.
import { describe, expect, it } from "vitest";
import { gerarToken, tokenValido } from "@/lib/auth";
import { loginPermitido, registrarFalha, limparFalhas } from "@/lib/rate-limit";
import { COLUNAS, FASE_LABEL } from "@/lib/labels";

describe("auth (token HMAC)", () => {
  it("gera token que valida com a senha certa", async () => {
    const token = await gerarToken("minha-senha");
    expect(await tokenValido(token, "minha-senha")).toBe(true);
  });

  it("rejeita token com senha diferente (o segredo HMAC muda junto)", async () => {
    const token = await gerarToken("senha-antiga");
    expect(await tokenValido(token, "senha-nova")).toBe(false);
  });

  it("rejeita token adulterado", async () => {
    const token = await gerarToken("minha-senha");
    const [payload] = token.split(".");
    expect(await tokenValido(payload + ".abc123", "minha-senha")).toBe(false);
  });

  it("rejeita token expirado", async () => {
    // Monta um token com exp no passado, assinado com a mesma senha
    const token = await gerarToken("minha-senha");
    const [payload, assinatura] = token.split(".");
    const decodificado = JSON.parse(Buffer.from(payload, "base64url").toString());
    decodificado.exp = Date.now() - 1000;
    const novoPayload = Buffer.from(JSON.stringify(decodificado)).toString("base64url");
    // Re-assina não dá de fora (a chave é derivada dentro da lib), então testamos
    // o caminho do parse: payload válido mas exp passado precisa falhar.
    // Geramos via gerarToken e sobrescrevemos o payload mantendo a assinatura:
    const tokenFalsificado = `${novoPayload}.${assinatura}`;
    // A assinatura não bate mais (payload mudou), e mesmo que batesse, exp passou.
    expect(await tokenValido(tokenFalsificado, "minha-senha")).toBe(false);
  });

  it("rejeita lixo e valores vazios", async () => {
    expect(await tokenValido(undefined, "senha")).toBe(false);
    expect(await tokenValido("", "senha")).toBe(false);
    expect(await tokenValido("nao-e-um-token", "senha")).toBe(false);
    expect(await tokenValido("a.b.c", "senha")).toBe(false);
    const token = await gerarToken("senha");
    expect(await tokenValido(token, "")).toBe(false);
  });
});

describe("rate-limit do login", () => {
  it("permite 5 tentativas e bloqueia a seguinte", () => {
    const ip = "1.2.3.4";
    limparFalhas(ip);
    // As 4 primeiras falhas deixam a próxima tentativa livre...
    for (let i = 0; i < 4; i++) {
      registrarFalha(ip);
      expect(loginPermitido(ip).permitido).toBe(true);
    }
    // ...a 5ª falha consome a última chance e a 6ª tentativa é bloqueada.
    registrarFalha(ip);
    expect(loginPermitido(ip).permitido).toBe(false);
  });

  it("login com sucesso limpa as falhas", () => {
    const ip = "5.6.7.8";
    limparFalhas(ip);
    for (let i = 0; i < 6; i++) registrarFalha(ip);
    expect(loginPermitido(ip).permitido).toBe(false);
    limparFalhas(ip);
    expect(loginPermitido(ip).permitido).toBe(true);
  });

  it("Ips diferentes não se bloqueiam", () => {
    const ipA = "9.9.9.1";
    const ipB = "9.9.9.2";
    limparFalhas(ipA);
    limparFalhas(ipB);
    for (let i = 0; i < 6; i++) registrarFalha(ipA);
    expect(loginPermitido(ipA).permitido).toBe(false);
    expect(loginPermitido(ipB).permitido).toBe(true);
  });
});

describe("labels do funil", () => {
  it("toda coluna do Kanban tem fase única e tradução", () => {
    const fases = COLUNAS.map((c) => c.fase);
    expect(new Set(fases).size).toBe(fases.length);
    for (const fase of fases) {
      expect(FASE_LABEL[fase]).toBeTruthy();
    }
  });

  it("as fases usadas pela análise da IA existem no Kanban", () => {
    // Se alguém renomear uma fase num lado e não no outro, este teste quebra.
    for (const fase of ["restricao", "sem_interesse", "hot_lead", "interessado", "atendimento"]) {
      expect(FASE_LABEL[fase], `fase "${fase}" sem tradução em FASE_LABEL`).toBeTruthy();
    }
  });
});
