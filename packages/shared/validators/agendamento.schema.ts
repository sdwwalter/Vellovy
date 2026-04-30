// packages/shared/validators/agendamento.schema.ts
import { z } from "zod";

export const agendamentoSchema = z.object({
  cliente_id: z.string().min(1, "Selecione um cliente"),
  profissional_id: z.string().min(1, "Selecione um profissional"),
  servico_id: z.string().min(1, "Selecione um serviço"),
  data_hora: z.string().min(1, "Selecione data e hora"),
  duracao_minutos: z.number().min(15, "Mínimo 15 minutos").max(480, "Máximo 8 horas"),
  valor: z.number().min(0, "Valor não pode ser negativo"),
  observacoes: z.string().optional(),
});

export type AgendamentoInput = z.infer<typeof agendamentoSchema>;
