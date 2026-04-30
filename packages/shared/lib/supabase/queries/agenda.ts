import { createClient } from '../client';
import type { Agendamento, StatusAgendamento } from '../../../types';

export async function getAgendamentosDoDia(
  salaoId: string,
  data: string
): Promise<Agendamento[]> {
  const supabase = createClient();
  const { data: rows, error } = await supabase
    .from('agendamentos')
    .select(`*, cliente:clientes(*), profissional:profissionais(*), servico:servicos(*)`)
    .eq('salao_id', salaoId)
    .gte('data_hora', `${data}T00:00:00`)
    .lte('data_hora', `${data}T23:59:59`)
    .order('data_hora', { ascending: true });

  if (error) throw new Error(error.message);
  return (rows ?? []) as unknown as Agendamento[];
}

export async function criarAgendamento(
  payload: Omit<Agendamento, 'id' | 'created_at' | 'cliente' | 'profissional' | 'servico'>
): Promise<Agendamento> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('agendamentos')
    .insert(payload)
    .select(`*, cliente:clientes(*), profissional:profissionais(*), servico:servicos(*)`)
    .single();

  if (error) throw new Error(error.message);
  return data as unknown as Agendamento;
}

export async function atualizarStatusAgendamento(
  id: string,
  status: StatusAgendamento,
  observacoes?: string
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('agendamentos')
    .update({ status, ...(observacoes ? { observacoes } : {}) })
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function excluirAgendamento(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('agendamentos')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}
