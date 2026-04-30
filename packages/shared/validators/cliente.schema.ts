// packages/shared/validators/cliente.schema.ts
import { z } from "zod";

export const clienteSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  telefone: z
    .string()
    .min(10, "Telefone deve ter pelo menos 10 dígitos")
    .regex(/^[\d\s\-()]+$/, "Telefone contém caracteres inválidos"),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  data_nascimento: z.string().optional().or(z.literal("")),
  observacoes: z.string().optional().or(z.literal("")),
  salao_id: z.string().min(1),
});

export type ClienteInput = z.infer<typeof clienteSchema>;
