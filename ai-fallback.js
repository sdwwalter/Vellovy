// ═══════════════════════════════════════════════════════
// ai-fallback.js — Respostas Hardcoded (Fase 1, sem IA)
// Zero alucinação. Dados 100% reais do localStorage.
// Importar em modules.js conforme necessário.
// ═══════════════════════════════════════════════════════

import { Agenda, Diario, Clientes, Config } from './modules.js';

// ─────────────────────────────────────────────────────
// FORMATADORES
// ─────────────────────────────────────────────────────
const fmt$ = (v) =>
    Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const fmtData = (iso) => {
    if (!iso) return '?';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
};

const diasDesde = (iso) => {
    if (!iso) return Infinity;
    return Math.floor((Date.now() - new Date(iso + 'T12:00:00').getTime()) / 86400000);
};

// ─────────────────────────────────────────────────────
// HANDLERS (uma função pura por comando)
// Cada função retorna string pronta para enviar no Telegram.
// ─────────────────────────────────────────────────────

function agendaHoje() {
    const cfg = Config.get();
    const lista = Agenda.getHoje();
    const dataStr = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' });

    if (!lista.length) {
        return `📅 *${cfg.nomeSalao}*\n_${dataStr}_\n\nNenhum agendamento para hoje.`;
    }

    const linhas = lista.map(a => {
        const status = a.status === 'confirmado' ? '✅' : a.status === 'pendente' ? '⏳' : '🔵';
        const servico = a.servico ? ` — ${a.servico}` : '';
        const prof = a.profissional ? ` (${a.profissional})` : '';
        return `${status} *${a.horario || '?'}* ${a.cliente}${servico}${prof}`;
    }).join('\n');

    return `📅 *Agenda de Hoje — ${dataStr}*\n_${cfg.nomeSalao}_\n\n${linhas}\n\n_${lista.length} agendamento(s)_`;
}

function agendaAmanha() {
    const cfg = Config.get();
    const lista = Agenda.getAmanha();
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    const dataStr = amanha.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' });

    if (!lista.length) {
        return `📅 *${cfg.nomeSalao}*\n_Amanhã, ${dataStr}_\n\nNenhum agendamento para amanhã.`;
    }

    const linhas = lista.map(a => {
        const servico = a.servico ? ` — ${a.servico}` : '';
        const prof = a.profissional ? ` (${a.profissional})` : '';
        return `🔵 *${a.horario || '?'}* ${a.cliente}${servico}${prof}`;
    }).join('\n');

    return `📅 *Agenda de Amanhã — ${dataStr}*\n_${cfg.nomeSalao}_\n\n${linhas}\n\n_${lista.length} agendamento(s)_`;
}

function agendaProximos() {
    const all = Agenda.getAll().filter(a => a.status !== 'cancelado');
    const hoje = new Date().toISOString().slice(0, 10);
    const proximos = all
        .filter(a => a.data >= hoje)
        .sort((a, b) => ((a.data || '') + (a.horario || '')).localeCompare((b.data || '') + (b.horario || '')))
        .slice(0, 10);

    if (!proximos.length) return '📅 Nenhum agendamento futuro cadastrado.';

    // Agrupa por data
    const porDia = {};
    proximos.forEach(a => {
        const chave = a.data || 'Sem data';
        if (!porDia[chave]) porDia[chave] = [];
        porDia[chave].push(a);
    });

    const linhas = Object.entries(porDia).map(([data, ags]) => {
        const dataFmt = fmtData(data);
        const itens = ags.map(a => `  • ${a.horario || '?'} ${a.cliente}`).join('\n');
        return `*${dataFmt}*\n${itens}`;
    }).join('\n\n');

    return `📅 *Próximos Agendamentos*\n\n${linhas}`;
}

function faturamentoHoje() {
    const hoje = new Date().toISOString().slice(0, 10);
    const entries = Diario.getAll().filter(e => e.data === hoje);
    const fat = entries.reduce((s, e) => s + (parseFloat(e.precoCobrado) || 0) * (parseInt(e.qtd) || 1), 0);
    const lucro = entries.reduce((s, e) => {
        const f = (parseFloat(e.precoCobrado) || 0) * (parseInt(e.qtd) || 1);
        const c = (parseFloat(e.custoTotal) || 0) * (parseInt(e.qtd) || 1);
        const k = (parseFloat(e.comissaoValor) || 0) * (parseInt(e.qtd) || 1);
        return s + f - c - k;
    }, 0);

    const dataFmt = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' });

    if (!entries.length) return `💰 *Hoje (${dataFmt})*\n\nNenhum atendimento registrado ainda.`;

    return `💰 *Caixa de Hoje — ${dataFmt}*\n\n` +
        `Faturamento: *${fmt$(fat)}*\n` +
        `Lucro estimado: *${fmt$(lucro)}*\n` +
        `Atendimentos: *${entries.length}*\n` +
        `Ticket médio: *${fmt$(entries.length ? fat / entries.length : 0)}*`;
}

function faturamentoOntem() {
    const ontem = new Date();
    ontem.setDate(ontem.getDate() - 1);
    const ontemStr = ontem.toISOString().slice(0, 10);
    const entries = Diario.getAll().filter(e => e.data === ontemStr);
    const fat = entries.reduce((s, e) => s + (parseFloat(e.precoCobrado) || 0) * (parseInt(e.qtd) || 1), 0);
    const lucro = entries.reduce((s, e) => {
        const f = (parseFloat(e.precoCobrado) || 0) * (parseInt(e.qtd) || 1);
        const c = (parseFloat(e.custoTotal) || 0) * (parseInt(e.qtd) || 1);
        const k = (parseFloat(e.comissaoValor) || 0) * (parseInt(e.qtd) || 1);
        return s + f - c - k;
    }, 0);

    const dataFmt = ontem.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' });

    if (!entries.length) return `💰 *Ontem (${dataFmt})*\n\nNenhum atendimento registrado.`;

    return `💰 *Caixa de Ontem — ${dataFmt}*\n\n` +
        `Faturamento: *${fmt$(fat)}*\n` +
        `Lucro estimado: *${fmt$(lucro)}*\n` +
        `Atendimentos: *${entries.length}*`;
}

function faturamentoSemana() {
    const hoje = new Date();
    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() - hoje.getDay()); // Domingo
    const inicioStr = inicioSemana.toISOString().slice(0, 10);
    const hojeStr = hoje.toISOString().slice(0, 10);

    const entries = Diario.getAll().filter(e => e.data >= inicioStr && e.data <= hojeStr);
    const fat = entries.reduce((s, e) => s + (parseFloat(e.precoCobrado) || 0) * (parseInt(e.qtd) || 1), 0);

    return `📊 *Faturamento da Semana*\n\n` +
        `Total: *${fmt$(fat)}*\n` +
        `Atendimentos: *${entries.length}*\n` +
        `Ticket médio: *${fmt$(entries.length ? fat / entries.length : 0)}*`;
}

function faturamentoMes() {
    const now = new Date();
    const res = Diario.resumoMes(now.getFullYear(), now.getMonth());
    const nomeMes = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    return `📊 *Resumo do Mês — ${nomeMes}*\n\n` +
        `Faturamento: *${fmt$(res.faturamento)}*\n` +
        `Lucro real: *${fmt$(res.lucroReal)}*\n` +
        `Atendimentos: *${res.atendimentos}*\n` +
        `Ticket médio: *${fmt$(res.ticket)}*`;
}

function clientesInativos() {
    Clientes.syncFromDiarioAgenda();
    const todos = Clientes.getAll();

    const inativos = todos
        .map(c => ({ ...c, dias: diasDesde(Clientes.calcStats(c.nome).ultimaVisita) }))
        .filter(c => c.dias >= 45 && c.dias < Infinity)
        .sort((a, b) => b.dias - a.dias)
        .slice(0, 8);

    if (!inativos.length) {
        return `✅ *Retenção OK!*\n\nNenhum cliente ausente há mais de 45 dias.`;
    }

    const linhas = inativos.map(c =>
        `• ${c.nome} — _${c.dias} dias sem visita_`
    ).join('\n');

    return `⚠️ *Clientes em Risco de Churn*\n_Ausentes há mais de 45 dias_\n\n${linhas}\n\n_Dica: manda uma mensagem no WhatsApp para reativar._`;
}

function resumoDia() {
    const cfg = Config.get();
    const hoje = new Date().toISOString().slice(0, 10);
    const dataFmt = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' });

    const agendaHojeList = Agenda.getHoje();
    const entries = Diario.getAll().filter(e => e.data === hoje);
    const fat = entries.reduce((s, e) => s + (parseFloat(e.precoCobrado) || 0) * (parseInt(e.qtd) || 1), 0);

    const partes = [
        `🌅 *Resumo do Dia — ${dataFmt}*\n_${cfg.nomeSalao}_`,
        `\n📅 *Agenda:* ${agendaHojeList.length} agendamento(s)`,
        `💰 *Caixa:* ${fmt$(fat)} (${entries.length} atendimento(s) registrado(s))`
    ];

    if (agendaHojeList.length > 0) {
        const proximos = agendaHojeList.slice(0, 3).map(a => `  • ${a.horario} ${a.cliente}`).join('\n');
        partes.push(`\nPróximos:\n${proximos}`);
    }

    return partes.join('\n');
}

function ajuda() {
    return `🤖 *Comandos disponíveis:*\n\n` +
        `*Agenda*\n` +
        `• \`agenda hoje\` — agendamentos de hoje\n` +
        `• \`agenda amanhã\` — agendamentos de amanhã\n` +
        `• \`próximos\` — próximos 10 agendamentos\n\n` +
        `*Financeiro*\n` +
        `• \`caixa hoje\` — faturamento do dia\n` +
        `• \`caixa ontem\` — faturamento de ontem\n` +
        `• \`semana\` — faturamento da semana\n` +
        `• \`mês\` — resumo do mês atual\n\n` +
        `*Clientes*\n` +
        `• \`clientes inativos\` — em risco de churn\n\n` +
        `*Outros*\n` +
        `• \`resumo\` — briefing completo do dia\n` +
        `• \`ajuda\` — esta mensagem`;
}

// ─────────────────────────────────────────────────────
// DISPATCHER PRINCIPAL
// Recebe texto livre do usuário e retorna a resposta.
// Retorna null se nenhum comando for reconhecido.
// ─────────────────────────────────────────────────────
export function getFallbackResponse(texto) {
    const t = (texto || '').toLowerCase().trim()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // remove acentos para match

    // /start ou vínculo inicial
    if (t === '/start' || t === 'start') return ajuda();

    // Agenda
    if (match(t, ['agenda hoje', 'hoje agenda', 'agendamentos hoje'])) return agendaHoje();
    if (match(t, ['agenda amanha', 'agenda de amanha', 'amanha agenda'])) return agendaAmanha();
    if (match(t, ['proximos', 'proximos agendamentos', 'agenda proximos', 'futuro'])) return agendaProximos();

    // Caixa / Faturamento
    if (match(t, ['caixa hoje', 'faturamento hoje', 'quanto fiz hoje', 'quanto ganhei hoje'])) return faturamentoHoje();
    if (match(t, ['caixa ontem', 'faturamento ontem', 'quanto fiz ontem', 'quanto ganhei ontem'])) return faturamentoOntem();
    if (match(t, ['semana', 'essa semana', 'faturamento semana', 'quanto fiz essa semana'])) return faturamentoSemana();
    if (match(t, ['mes', 'esse mes', 'faturamento mes', 'quanto fiz esse mes', 'resumo mes'])) return faturamentoMes();

    // Clientes
    if (match(t, ['clientes inativos', 'clientes risco', 'churn', 'ausentes', 'sem visitar'])) return clientesInativos();

    // Resumo
    if (match(t, ['resumo', 'resumo dia', 'resumo do dia', 'briefing'])) return resumoDia();

    // Ajuda
    if (match(t, ['ajuda', 'help', 'comandos', 'o que voce faz', 'o que vc faz'])) return ajuda();

    return null; // Sem match → futuro: encaminhar para IA
}

// Helper: verifica se o texto contém algum dos termos
function match(texto, termos) {
    return termos.some(t => texto.includes(t));
}
