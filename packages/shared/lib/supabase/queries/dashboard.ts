import type { SupabaseInstance } from '../types';
import type { Agendamento } from '../../../types';

export interface DashboardData {
  agendaHoje: number;
  receitaHoje: number;
  clientesNoMes: number;
  ticketMedio: number;
  agendaAmanha: Agendamento[];
}

export async function getDashboardData(
  supabase: SupabaseInstance,
  salaoId: string
): Promise<DashboardData> {
  const hoje = new Date().toISOString().split('T')[0];
  const amanha = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  // Agendamentos de hoje
  const { data: agendamentosHoje } = await supabase
    .from('agendamentos')
    .select(`*, cliente:clientes(*), profissional:profissionais(*), servico:servicos(*)`)
    .eq('salao_id', salaoId)
    .gte('data_hora', `${hoje}T00:00:00`)
    .lte('data_hora', `${hoje}T23:59:59`)
    .order('data_hora');

  const listaHoje = (agendamentosHoje ?? []) as Agendamento[];
  const concluidos = listaHoje.filter(a => a.status === 'realizado');
  const receitaHoje = concluidos.reduce((s, a) => s + a.valor, 0);
  const ticketMedio = concluidos.length > 0
    ? Math.round(receitaHoje / concluidos.length)
    : 0;

  // Agendamentos de amanhã
  const { data: agendamentosAmanha } = await supabase
    .from('agendamentos')
    .select(`*, cliente:clientes(*), profissional:profissionais(*), servico:servicos(*)`)
    .eq('salao_id', salaoId)
    .gte('data_hora', `${amanha}T00:00:00`)
    .lte('data_hora', `${amanha}T23:59:59`)
    .neq('status', 'cancelado')
    .order('data_hora')
    .limit(10);

  // Clientes novos no mês
  const inicioMes = `${hoje.slice(0, 7)}-01`;
  const { count: clientesNoMes } = await supabase
    .from('clientes')
    .select('*', { count: 'exact', head: true })
    .eq('salao_id', salaoId)
    .gte('created_at', inicioMes);

  return {
    agendaHoje: listaHoje.length,
    receitaHoje,
    clientesNoMes: clientesNoMes ?? 0,
    ticketMedio,
    agendaAmanha: (agendamentosAmanha ?? []) as Agendamento[],
  };
}
