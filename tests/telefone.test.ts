import { describe, expect, it } from "vitest";
import { normalizarTelefone, telefoneValido, chaveTelefone, telefoneWhatsApp } from "@/lib/telefone";

describe("normalizarTelefone", () => {
  it("aceita formatos locais com pontuação e produz a mesma chave", () => {
    expect(normalizarTelefone("(61) 99999-8888")).toBe("5561999998888");
    expect(normalizarTelefone("61 99999 8888")).toBe("5561999998888");
    expect(normalizarTelefone("61999998888")).toBe("5561999998888");
    expect(normalizarTelefone("061 9999-98888".replace(/^0/, ""))).toBe("5561999998888");
  });

  it("aceita números de 10 dígitos (fixo)", () => {
    expect(normalizarTelefone("(61) 3333-4444")).toBe("556133334444");
  });

  it("mantém números que já têm código do país", () => {
    expect(normalizarTelefone("+5561999998888")).toBe("5561999998888");
    expect(normalizarTelefone("5561999998888")).toBe("5561999998888");
    expect(normalizarTelefone("+55 61 3333-4444")).toBe("556133334444");
  });

  it("rejeita entradas inutilizáveis", () => {
    expect(normalizarTelefone("")).toBeNull();
    expect(normalizarTelefone(null)).toBeNull();
    expect(normalizarTelefone(undefined)).toBeNull();
    expect(normalizarTelefone("abc")).toBeNull();
    expect(normalizarTelefone("9999-8888")).toBeNull(); // sem DDD
    expect(normalizarTelefone("123")).toBeNull();
  });

  it("formatos diferentes do mesmo número geram o mesmo resultado", () => {
    const resultados = new Set(
      ["+5561999998888", "(61) 99999-8888", "61999998888", "55 61 99999-8888"].map(normalizarTelefone)
    );
    expect(resultados.size).toBe(1);
  });
});

describe("chaveTelefone", () => {
  it("usa os últimos 11 dígitos (compatível com o matching do webhook Retell)", () => {
    expect(chaveTelefone("+5561999998888")).toBe("61999998888");
    expect(chaveTelefone("(61) 99999-8888")).toBe("61999998888");
  });

  it("retorna null para entrada inválida", () => {
    expect(chaveTelefone(null)).toBeNull();
    expect(chaveTelefone("")).toBeNull();
  });
});

describe("telefoneValido / telefoneWhatsApp", () => {
  it("telefoneValido espelha normalizarTelefone", () => {
    expect(telefoneValido("(61) 99999-8888")).toBe(true);
    expect(telefoneValido("999")).toBe(false);
  });

  it("telefoneWhatsApp devolve dígitos com código do país", () => {
    expect(telefoneWhatsApp("(61) 99999-8888")).toBe("5561999998888");
  });
});
