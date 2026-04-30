import { createClient } from '../client';
import type { Agendamento } from '../../../types';

export interface DashboardData {
  agendamentosHoje: Agendamento[];
  totalAgendamentosHoje: number;
  receitaHoje: number;
  totalClientesAtivos: number;
  proximosAgendamentos: Agendamento[];
}

export async function getDashboardData(salaoId: string): Promise<DashboardData> {
  const supabase = createClient();
  const hoje = new Date().toISOString().split('T')[0];

  const [{ data: agendamentosHoje }, { count: totalClientes }] =
    await Promise.all([
      supabase
        .from('agendamentos')
        .select(`*, cliente:clientes(*), profissional:profissionais(*), servico:servicos(*)`)
        .eq('salao_id', salaoId)
        .gte('data_hora', `${hoje}T00:00:00`)
        .lte('data_hora', `${hoje}T23:59:59`)
        .order('data_hora'),
      supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true })
        .eq('salao_id', salaoId),
    ]);

  const lista = (agendamentosHoje ?? []) as unknown as Agendamento[];
  const receitaHoje = lista
    .filter((a) => a.status === 'concluido')
    .reduce((sum, a) => sum + a.valor, 0);

  const agora = new Date().toISOString();
  const proximos = lista.filter(
    (a) => a.data_hora > agora && a.status !== 'cancelado'
  );

  return {
    agendamentosHoje: lista,
    totalAgendamentosHoje: lista.length,
    receitaHoje,
    totalClientesAtivos: totalClientes ?? 0,
    proximosAgendamentos: proximos.slice(0, 5),
  };
}
