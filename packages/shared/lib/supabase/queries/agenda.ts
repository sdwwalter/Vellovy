// packages/shared/lib/supabase/queries/agenda.ts
import type { SupabaseInstance } from '../types';
import type { Agendamento, StatusAgendamento } from '../../../types';

/** Buscar agendamentos do dia com joins de cliente, profissional e serviço */
export async function getAgendamentosDoDia(
  supabase: SupabaseInstance,
  salaoId: string,
  data: string // 'YYYY-MM-DD'
): Promise<Agendamento[]> {
  const { data: rows, error } = await supabase
    .from('agendamentos')
    .select(`
      *,
      cliente:clientes(id, nome, telefone, segmento),
      profissional:profissionais(id, nome, funcao),
      servico:servicos(id, nome, duracao_minutos, preco_ideal)
    `)
    .eq('salao_id', salaoId)
    .gte('data_hora', `${data}T00:00:00`)
    .lte('data_hora', `${data}T23:59:59`)
    .order('data_hora', { ascending: true });

  if (error) throw new Error(error.message);
  return (rows ?? []) as Agendamento[];
}

/** Criar novo agendamento */
export async function criarAgendamento(
  supabase: SupabaseInstance,
  dados: Omit<Agendamento, 'id' | 'created_at' | 'cliente' | 'profissional' | 'servico'>
): Promise<Agendamento> {
  const { data, error } = await supabase
    .from('agendamentos')
    .insert(dados)
    .select(`
      *,
      cliente:clientes(id, nome, telefone, segmento),
      profissional:profissionais(id, nome, funcao),
      servico:servicos(id, nome, duracao_minutos, preco_ideal)
    `)
    .single();

  if (error) throw new Error(error.message);
  return data as Agendamento;
}

/** Atualizar status de um agendamento */
export async function atualizarStatusAgendamento(
  supabase: SupabaseInstance,
  id: string,
  status: StatusAgendamento
): Promise<void> {
  const { error } = await supabase
    .from('agendamentos')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw new Error(error.message);
}

/** Excluir agendamento */
export async function excluirAgendamento(
  supabase: SupabaseInstance,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from('agendamentos')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

/** Verificar conflito de horário */
export async function verificarConflito(
  supabase: SupabaseInstance,
  salaoId: string,
  profissionalId: string,
  dataHora: string,
  duracaoMinutos: number,
  excludeId?: string
): Promise<boolean> {
  const fim = new Date(new Date(dataHora).getTime() + duracaoMinutos * 60000).toISOString();

  let query = supabase
    .from('agendamentos')
    .select('id')
    .eq('salao_id', salaoId)
    .eq('profissional_id', profissionalId)
    .in('status', ['agendado', 'confirmado'])
    .lt('data_hora', fim)
    .gt('data_hora', dataHora);

  if (excludeId) query = query.neq('id', excludeId);

  const { data } = await query;
  return (data?.length ?? 0) > 0;
}
