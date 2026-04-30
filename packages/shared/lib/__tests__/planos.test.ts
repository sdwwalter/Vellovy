// packages/shared/lib/__tests__/planos.test.ts
import { describe, it, expect } from "vitest";
import { PLANOS, podeCriarProfissional, temRecurso } from "../constants/planos";

describe("PLANOS", () => {
  it("define 5 tiers de plano", () => {
    expect(Object.keys(PLANOS)).toEqual(["free", "essencial", "profissional", "premium", "ilimitado"]);
  });

  it("free tem limite de 1 profissional", () => {
    expect(PLANOS.free.profissionais_max).toBe(1);
  });

  it("preços em centavos são coerentes", () => {
    expect(PLANOS.free.preco_mensal).toBe(0);
    expect(PLANOS.essencial.preco_mensal).toBeGreaterThan(0);
    expect(PLANOS.premium.preco_mensal).toBeGreaterThan(PLANOS.profissional.preco_mensal);
  });
});

describe("podeCriarProfissional", () => {
  it("permite no free se 0 profissionais", () => {
    expect(podeCriarProfissional("free", 0)).toBe(true);
  });

  it("bloqueia no free se 1 profissional", () => {
    expect(podeCriarProfissional("free", 1)).toBe(false);
  });

  it("permite no premium se 14 profissionais", () => {
    expect(podeCriarProfissional("premium", 14)).toBe(true);
  });

  it("bloqueia no premium se 15 profissionais", () => {
    expect(podeCriarProfissional("premium", 15)).toBe(false);
  });
});

describe("temRecurso", () => {
  it("free não tem telegram", () => {
    expect(temRecurso("free", "tem_bot_telegram")).toBe(false);
  });

  it("profissional tem telegram", () => {
    expect(temRecurso("profissional", "tem_bot_telegram")).toBe(true);
  });

  it("premium tem whatsapp", () => {
    expect(temRecurso("premium", "tem_whatsapp_api")).toBe(true);
  });
});
