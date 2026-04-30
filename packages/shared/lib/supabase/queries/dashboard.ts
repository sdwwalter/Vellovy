import { createClient } from '../client';

export async function getDashboardData(salaoId) {
  const supabase = createClient();
  const hoje = new Date().toISOString().split('T')[0];
  const { data: agendamentosHoje } = await supabase
    .from('agendamentos')
    .select(`*, cliente:clientes(*), profissional:profissionais(*), servico:servicos(*)`)
    .eq('salao_id', salaoId)
    .gte('data_hora', `${hoje}T00:00:00`)
    .lte('data_hora', `${hoje}T23:59:59`)
    .order('data_hora');
  const lista = agendamentosHoje ?? [];
  const receitaHoje = lista.filter(a => a.status === 'concluido').reduce((s, a) => s + a.valor, 0);
  const agora = new Date().toISOString();
  return {
    agendamentosHoje: lista,
    totalAgendamentosHoje: lista.length,
    receitaHoje,
    proximosAgendamentos: lista.filter(a => a.data_hora > agora && a.status !== 'cancelado').slice(0, 5),
  };
}
