// packages/shared/validators/caixa.schema.ts
import { z } from "zod";

export const lancamentoCaixaSchema = z.object({
  cliente_nome: z.string().min(1, "Nome do cliente é obrigatório"),
  servico_id: z.string().optional(),
  profissional_id: z.string().optional(),
  valor: z.number().min(1, "Valor deve ser maior que zero"),
  forma_pagamento: z.enum(["dinheiro", "pix", "debito", "credito", "outro"], {
    required_error: "Selecione a forma de pagamento",
  }),
  tipo: z.enum(["servico", "produto"]).default("servico"),
  data: z.string().min(1, "Data é obrigatória"),
});

export type LancamentoCaixaInput = z.infer<typeof lancamentoCaixaSchema>;
