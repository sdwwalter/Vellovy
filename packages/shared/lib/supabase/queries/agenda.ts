import { createClient } from '../client';

export async function getAgendamentosDoDia(salaoId, data) {
  const supabase = createClient();
  const { data: rows, error } = await supabase
    .from('agendamentos')
    .select(`*, cliente:clientes(*), profissional:profissionais(*), servico:servicos(*)`)
    .eq('salao_id', salaoId)
    .gte('data_hora', `${data}T00:00:00`)
    .lte('data_hora', `${data}T23:59:59`)
    .order('data_hora', { ascending: true });
  if (error) throw new Error(error.message);
  return rows ?? [];
}

export async function criarAgendamento(payload) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('agendamentos').insert(payload)
    .select(`*, cliente:clientes(*), profissional:profissionais(*), servico:servicos(*)`).single();
  if (error) throw new Error(error.message);
  return data;
}

export async function atualizarStatusAgendamento(id, status, observacoes) {
  const supabase = createClient();
  const { error } = await supabase.from('agendamentos')
    .update({ status, ...(observacoes ? { observacoes } : {}) }).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function excluirAgendamento(id) {
  const supabase = createClient();
  const { error } = await supabase.from('agendamentos').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
