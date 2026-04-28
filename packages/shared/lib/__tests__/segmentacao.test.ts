// packages/shared/lib/__tests__/segmentacao.test.ts
import { describe, it, expect } from "vitest";
import { calcularSegmento } from "../segmentacao";

describe("calcularSegmento", () => {
  it("retorna 'nova' para 0 visitas", () => {
    expect(calcularSegmento(0, null)).toBe("nova");
  });

  it("retorna 'regular' para 1-2 visitas recentes", () => {
    const ontem = new Date(Date.now() - 86400000).toISOString();
    expect(calcularSegmento(1, ontem)).toBe("regular");
    expect(calcularSegmento(2, ontem)).toBe("regular");
  });

  it("retorna 'fiel' para 3+ visitas recentes", () => {
    const ontem = new Date(Date.now() - 86400000).toISOString();
    expect(calcularSegmento(3, ontem)).toBe("fiel");
    expect(calcularSegmento(10, ontem)).toBe("fiel");
  });

  it("retorna 'ausente' para 31-90 dias sem visita", () => {
    const quarentaDiasAtras = new Date(Date.now() - 40 * 86400000).toISOString();
    expect(calcularSegmento(5, quarentaDiasAtras)).toBe("ausente");
  });

  it("retorna 'inativa' para 91+ dias sem visita", () => {
    const cemDiasAtras = new Date(Date.now() - 100 * 86400000).toISOString();
    expect(calcularSegmento(5, cemDiasAtras)).toBe("inativa");
  });
});
