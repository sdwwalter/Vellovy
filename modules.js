// ═══════════════════════════════════════════════════════
// modules.js — Todas as funcionalidades e páginas
// v3.2: Cache Fase 3, WhatsApp integrado, Sem emojis
// ═══════════════════════════════════════════════════════

import { supabase, renderIcon, toast, navigateTo } from './app.js';

// ═══════════════════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════════════════
export const R$ = (v) => Number(v || 0).toLocaleString('pt-BR', {
    style: 'currency', currency: 'BRL'
});

export const pct = (v) => Number(v || 0).toLocaleString('pt-BR', {
    style: 'percent', minimumFractionDigits: 1
});

export const fmtData = (iso) => {
    if (!iso) return '—';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
};

export const hoje = () => new Date().toISOString().split('T')[0];
export const mesKey = (ano, mes) => `${ano}-${String(mes + 1).padStart(2, '0')}`;

export const limparTelefone = (tel) => (tel || '').replace(/\D/g, '');

export const linkWA = (telefone, msg = '') => {
    let n = limparTelefone(telefone);
    if (n.length > 11 && n.startsWith('55')) n = n.slice(2);
    if (n.length < 10) return null;
    const base = `https://wa.me/55${n}`;
    return msg ? `${base}?text=${encodeURIComponent(msg)}` : base;
};

export const applyMoneyMask = (input) => {
    input.addEventListener('input', (e) => {
        let v = e.target.value.replace(/\D/g, '');
        if (!v) { e.target.value = ''; return; }
        const n = parseInt(v, 10) / 100;
        e.target.value = n.toLocaleString('pt-BR', {
            minimumFractionDigits: 2, maximumFractionDigits: 2
        });
        e.target.dataset.rawValue = n;
    });
};

// ═══════════════════════════════════════════════════════
// STORAGE & SYNC ENGINE
// ═══════════════════════════════════════════════════════
const KEYS = {
    CONFIG: 'salao_config',
    CUSTOS: 'salao_custos',
    RECEITAS: 'salao_receitas',
    SERVICOS: 'salao_servicos',
    DIARIO: 'salao_diario',
    AGENDA: 'salao_agenda',
    PRODUTOS: 'salao_produtos',
    CLIENTES: 'salao_clientes',
};

const LS_TO_TYPE = {
    [KEYS.CONFIG]: 'config',
    [KEYS.CUSTOS]: 'custos',
    [KEYS.RECEITAS]: 'receitas',
    [KEYS.SERVICOS]: 'servicos',
    [KEYS.DIARIO]: 'diario',
    [KEYS.AGENDA]: 'agenda',
    [KEYS.PRODUTOS]: 'produtos',
    [KEYS.CLIENTES]: 'clientes',
};

let _syncTimer = null;
const _dirtyKeys = new Set();
const _statsCache = new Map();
let _syncedThisSession = false;

function _invalidateClienteCache() {
    _statsCache.clear();
    _syncedThisSession = false;
}

async function _scheduleSync(lsKey) {
    _dirtyKeys.add(lsKey);
    clearTimeout(_syncTimer);
    _syncTimer = setTimeout(_flushSync, 1500);
}

async function _flushSync() {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    for (const lsKey of _dirtyKeys) {
        const type = LS_TO_TYPE[lsKey];
        if (!type) continue;
        const raw = localStorage.getItem(lsKey);
        if (raw) {
            await supabase.from('salao_data').upsert({
                user_id: user.id,
                data_type: type,
                data: JSON.parse(raw),
                updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id,data_type' });
        }
    }
    _dirtyKeys.clear();
}

function _load(key, def = null) {
    try {
        const v = localStorage.getItem(key);
        return v ? JSON.parse(v) : def;
    } catch { return def; }
}

function _save(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
    _scheduleSync(key);
}

// ═══════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════
export const Config = {
    get: () => ({
        nomeSalao: 'Meu Salão',
        responsavel: '',
        cidade: '',
        ano: new Date().getFullYear(),
        telefone: '',
        instagram: '',
        valorHora: 40,
        multMin: 2.0,
        multIdeal: 2.5,
        multPrem: 3.0,
        atendMedios: 80,
        mesCustoFixo: -1,
        profissionais: ['Proprietária', 'Cabeleireira 1', 'Manicure 1'],
        categorias: ['Cabelo', 'Coloração', 'Manicure', 'Estética'],
        formasPagamento: ['Dinheiro', 'PIX', 'Cartão Débito', 'Cartão Crédito'],
        ..._load(KEYS.CONFIG, {})
    }),
    save: (cfg) => _save(KEYS.CONFIG, { ...Config.get(), ...cfg }),
};

// ═══════════════════════════════════════════════════════
// ENTITIES
// ═══════════════════════════════════════════════════════
export const Servicos = {
    getAll: () => _load(KEYS.SERVICOS, []),
    save: (arr) => _save(KEYS.SERVICOS, arr),
    add: (s) => {
        const all = Servicos.getAll();
        s.id = Date.now();
        all.push(s);
        Servicos.save(all);
        return s;
    },
    remove: (id) => Servicos.save(Servicos.getAll().filter(s => s.id !== id)),
    byId: (id) => Servicos.getAll().find(s => s.id === id),
};

export const Produtos = {
    getAll: () => _load(KEYS.PRODUTOS, []),
    save: (arr) => _save(KEYS.PRODUTOS, arr),
    add: (p) => {
        const all = Produtos.getAll();
        p.id = Date.now();
        p.sku = `P${String(Math.max(0, ...all.map(x => parseInt((x.sku || 'P0').slice(1)) || 0)) + 1).padStart(3, '0')}`;
        all.push(p);
        Produtos.save(all);
        return p;
    },
    remove: (id) => Produtos.save(Produtos.getAll().filter(p => p.id !== id)),
    baixarEstoque: (id, qtd = 1) => {
        const all = Produtos.getAll();
        const idx = all.findIndex(p => p.id === id);
        if (idx >= 0) {
            all[idx].estoque = Math.max(0, (parseFloat(all[idx].estoque) || 0) - qtd);
            Produtos.save(all);
            return all[idx].estoque;
        }
        return false;
    }
};

export const Diario = {
    getAll: () => _load(KEYS.DIARIO, []),
    add: (e) => {
        const all = Diario.getAll();
        e.id = Date.now();
        e.data = e.data || hoje();
        all.unshift(e);
        _save(KEYS.DIARIO, all);
        _invalidateClienteCache();
        return e;
    },
    remove: (id) => {
        _save(KEYS.DIARIO, Diario.getAll().filter(e => e.id !== id));
        _invalidateClienteCache();
    },
    getByMes: (ano, mesIdx) => {
        const prefix = `${ano}-${String(mesIdx + 1).padStart(2, '0')}`;
        return Diario.getAll().filter(e => e.data?.startsWith(prefix));
    },
    resumoMes: (ano, mesIdx) => {
        const entries = Diario.getByMes(ano, mesIdx);
        const faturamento = entries.reduce((s, e) => s + (parseFloat(e.precoCobrado) || 0) * (parseInt(e.qtd) || 1), 0);
        const custoTotal = entries.reduce((s, e) => s + (parseFloat(e.custoTotal) || 0) * (parseInt(e.qtd) || 1), 0);
        const comissao = entries.reduce((s, e) => s + (parseFloat(e.comissaoValor) || 0) * (parseInt(e.qtd) || 1), 0);
        return {
            entries,
            atendimentos: entries.length,
            faturamento,
            custoTotal,
            lucroReal: faturamento - custoTotal - comissao,
            comissaoTotal: comissao,
            ticket: entries.length ? faturamento / entries.length : 0
        };
    }
};

export const Agenda = {
    getAll: () => _load(KEYS.AGENDA, []),
    add: (e) => {
        const all = Agenda.getAll();
        e.id = Date.now();
        all.push(e);
        all.sort((a, b) => ((a.data || '') + (a.horario || '')).localeCompare((b.data || '') + (b.horario || '')));
        _save(KEYS.AGENDA, all);
        _invalidateClienteCache();
        return e;
    },
    remove: (id) => {
        _save(KEYS.AGENDA, Agenda.getAll().filter(e => e.id !== id));
        _invalidateClienteCache();
    },
    getAmanha: () => {
        const d = new Date(); d.setDate(d.getDate() + 1);
        const str = d.toISOString().slice(0, 10);
        return Agenda.getAll().filter(e => e.data === str && e.status !== 'cancelado')
            .sort((a, b) => (a.horario || '').localeCompare(b.horario || ''));
    },
    getHoje: () => {
        const str = new Date().toISOString().slice(0, 10);
        return Agenda.getAll().filter(e => e.data === str && e.status !== 'cancelado')
            .sort((a, b) => (a.horario || '').localeCompare(b.horario || ''));
    },
    update: (id, changes) => {
        const all = Agenda.getAll();
        const idx = all.findIndex(e => e.id === id);
        if (idx >= 0) {
            all[idx] = { ...all[idx], ...changes };
            _save(KEYS.AGENDA, all);
            _invalidateClienteCache();
        }
    },
    save: (arr) => _save(KEYS.AGENDA, arr),
};

export const Clientes = {
    getAll: () => _load(KEYS.CLIENTES, []),
    upsert: (nome, dados) => {
        const all = Clientes.getAll();
        const k = nome.toLowerCase().trim();
        const idx = all.findIndex(c => c.nome.toLowerCase().trim() === k);
        if (idx >= 0) all[idx] = { ...all[idx], ...dados };
        else all.push({ nome: nome.trim(), obs: '', criadoEm: hoje(), ...dados });
        _save(KEYS.CLIENTES, all);
    },
    getByNome: (nome) => {
        return Clientes.getAll().find(c => c.nome.toLowerCase().trim() === nome.toLowerCase().trim());
    },
    syncFromDiarioAgenda: () => {
        if (_syncedThisSession) return;
        const nomes = [...new Set([
            ...Diario.getAll().map(e => e.cliente),
            ...Agenda.getAll().map(e => e.cliente)
        ].filter(Boolean).map(n => n.trim()))];
        nomes.forEach(n => { if (!Clientes.getByNome(n)) Clientes.upsert(n, {}); });
        _syncedThisSession = true;
    },
    calcStats: (nome) => {
        const k = nome.toLowerCase().trim();
        if (_statsCache.has(k)) return _statsCache.get(k);

        const registros = Diario.getAll().filter(e => e.cliente?.toLowerCase().trim() === k);
        const agendamentos = Agenda.getAll().filter(e => e.cliente?.toLowerCase().trim() === k);
        const qtd = registros.reduce((s, e) => s + (parseInt(e.qtd) || 1), 0);
        const fat = registros.reduce((s, e) => s + (parseFloat(e.precoCobrado) || 0) * (parseInt(e.qtd) || 1), 0);
        const datas = registros.map(e => e.data).filter(Boolean).sort();

        const result = {
            qtdTotal: qtd,
            fat,
            ticket: qtd ? fat / qtd : 0,
            ultimaVisita: datas[datas.length - 1] || null,
            primeiraVisita: datas[0] || null,
            timeline: [
                ...registros.map(e => ({ ...e, _origem: 'diario' })),
                ...agendamentos.map(e => ({ ...e, _origem: 'agenda' }))
            ].sort((a, b) => (b.data || '').localeCompare(a.data || ''))
        };
        _statsCache.set(k, result);
        return result;
    }
};

export const Custos = {
    getAll: () => _load(KEYS.CUSTOS, {}),
    getMes: (key) => Custos.getAll()[key] || {},
    saveMes: (key, data) => {
        const all = Custos.getAll();
        all[key] = data;
        _save(KEYS.CUSTOS, all);
    },
    totalMes: (key) => {
        const d = Custos.getMes(key);
        const fixos = ['aluguel', 'condominio', 'energia', 'agua', 'internet', 'auxiliar', 'contabilidade', 'limpeza', 'software', 'marketing']
            .reduce((s, k) => s + (parseFloat(d[k]) || 0), 0);
        return fixos + (d.outros || []).reduce((s, o) => s + (parseFloat(o.valor) || 0), 0);
    }
};

export const Receitas = {
    getAll: () => _load(KEYS.RECEITAS, {}),
    getMes: (key) => Receitas.getAll()[key] || {},
    saveMes: (key, data) => {
        const all = Receitas.getAll();
        all[key] = data;
        _save(KEYS.RECEITAS, all);
    },
    totalMes: (key) => {
        const d = Receitas.getMes(key);
        return ['cadeira1', 'cadeira2', 'manicure', 'pedicure', 'outros1', 'outros2']
            .reduce((s, k) => s + (parseFloat(d[k]) || 0), 0);
    },
    custoFixoRealMes: (key) => Math.max(0, Custos.totalMes(key) - Receitas.totalMes(key))
};

// ═══════════════════════════════════════════════════════
// PAGE RENDERERS
// ═══════════════════════════════════════════════════════

// Animação de contador para KPIs
function animateCounter(el, from, to, duration = 600, formatter = (v) => v) {
    if (!el) return;
    const startTime = performance.now();
    const easeOut = t => 1 - Math.pow(1 - t, 3);

    const tick = (now) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const value = from + (to - from) * easeOut(progress);
        el.textContent = formatter(value);
        if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
}

const PAGES_RENDER = {
    dashboard: (container) => {
        const cfg = Config.get();
        const now = new Date();
        const hojeStr = hoje();
        const res = Diario.resumoMes(now.getFullYear(), now.getMonth());
        const retencao = (() => {
            Clientes.syncFromDiarioAgenda();
            const todos = Clientes.getAll();
            const ativos = todos.filter(c => {
                const s = Clientes.calcStats(c.nome);
                if (!s.ultimaVisita) return false;
                const dias = (Date.now() - new Date(s.ultimaVisita + 'T12:00:00').getTime()) / 86400000;
                return dias <= 30;
            });
            return { taxa: todos.length ? Math.round((ativos.length / todos.length) * 100) : 0, qtd: ativos.length };
        })();

        // Verificar progresso do onboarding
        const dismissed = localStorage.getItem('salao_onboarding_dismissed');
        const onboardingSteps = [
            { id: 'config', label: 'Configure o nome do seu salão', done: cfg.nomeSalao && cfg.nomeSalao !== 'Meu Salão', action: () => navigateTo('configuracoes') },
            { id: 'servico', label: 'Cadastre pelo menos um serviço', done: Servicos.getAll().length > 0, action: () => navigateTo('servicos') },
            { id: 'agenda', label: 'Crie o primeiro agendamento', done: Agenda.getAll().length > 0, action: () => navigateTo('agenda') },
            { id: 'diario', label: 'Registre o primeiro atendimento', done: Diario.getAll().length > 0, action: () => navigateTo('diario') },
        ];
        const stepsFeitos = onboardingSteps.filter(s => s.done).length;
        const showOnboarding = !dismissed && stepsFeitos < 4;

        const onboardingHTML = showOnboarding ? `
            <div class="onboarding-banner">
                <button class="onboarding-dismiss" onclick="localStorage.setItem('salao_onboarding_dismissed','1');this.parentElement.remove();" title="Fechar">✕</button>
                <h3>Configure seu salão em 4 passos</h3>
                <p>${stepsFeitos} de 4 passos concluídos</p>
                <div class="onboarding-progress">
                    ${onboardingSteps.map((_, i) => `<div class="onboarding-progress-bar ${i < stepsFeitos ? 'done' : ''}"></div>`).join('')}
                </div>
                <div class="onboarding-steps" id="onboarding-steps-list">
                    ${onboardingSteps.map((s, i) => `
                        <div class="onboarding-step ${s.done ? 'done' : ''}" onclick="window.__onboardingAction(${i})" data-step="${i}">
                            <div class="onboarding-step-icon">${s.done ? '✓' : (i + 1)}</div>
                            <span>${s.label}</span>
                            ${!s.done ? (renderIcon('ChevronRight', { width: 16, height: 16 }) || '') : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : '';

        // Calcular dados dos últimos 7 dias
        const ultimos7 = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            const str = d.toISOString().slice(0, 10);
            const dayEntries = Diario.getAll().filter(e => e.data === str);
            const fat = dayEntries.reduce((s, e) => s + (parseFloat(e.precoCobrado) || 0) * (parseInt(e.qtd) || 1), 0);
            return { data: str, fat, label: d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''), isHoje: str === hojeStr };
        });
        const maxFat = Math.max(...ultimos7.map(d => d.fat), 1);
        const media = ultimos7.reduce((s, d) => s + d.fat, 0) / 7;

        container.innerHTML = `
            ${onboardingHTML}

            <div class="grid">
                <div class="kpi-card">
                    <div class="kpi-label">Faturamento Mês</div>
                    <div class="kpi-value" data-kpi="faturamento">${R$(res.faturamento)}</div>
                </div>
                <div class="kpi-card" style="border-left-color: var(--success)">
                    <div class="kpi-label">Lucro Real</div>
                    <div class="kpi-value" style="color: var(--success)" data-kpi="lucro">${R$(res.lucroReal)}</div>
                </div>
                <div class="kpi-card" style="border-left-color: var(--rose)">
                    <div class="kpi-label">Atendimentos</div>
                    <div class="kpi-value" data-kpi="atendimentos">${res.atendimentos}</div>
                </div>
                <div class="kpi-card" style="border-left-color: var(--info)">
                    <div class="kpi-label">Ticket Médio</div>
                    <div class="kpi-value" data-kpi="ticket">${R$(res.ticket)}</div>
                </div>
            </div>

            <div class="card" style="margin-bottom: 24px;">
                <h3 style="color: var(--plum); margin-bottom: 16px; font-size: 0.95rem; font-weight: 600;">Últimos 7 dias</h3>
                <svg width="100%" viewBox="0 0 400 120" style="overflow:visible;">
                    <line x1="0" y1="${100 - (media / maxFat) * 80}" x2="400" y2="${100 - (media / maxFat) * 80}" stroke="var(--mauve)" stroke-width="1" stroke-dasharray="4 4"/>
                    ${ultimos7.map((d, i) => {
            const barH = Math.max(4, (d.fat / maxFat) * 80);
            const x = 10 + i * 55;
            const y = 100 - barH;
            const isAbove = d.fat >= media;
            return `<g>
                            <rect x="${x}" y="${y}" width="40" height="${barH}" rx="4"
                                  fill="${d.isHoje ? 'var(--plum)' : isAbove ? 'var(--success)' : 'var(--mauve)'}"
                                  opacity="${d.isHoje ? 1 : 0.7}"/>
                            <text x="${x + 20}" y="115" text-anchor="middle" style="font-size:10px;fill:var(--txt-muted);">${d.label}</text>
                            ${d.fat > 0 ? `<title>${d.data}: ${R$(d.fat)}</title>` : ''}
                        </g>`;
        }).join('')}
                </svg>
                <div style="display:flex;gap:16px;margin-top:8px;font-size:0.78rem;color:var(--txt-muted);">
                    <span>— média: ${R$(media)}</span>
                    <span style="color:var(--plum)">■ hoje</span>
                    <span style="color:var(--success)">■ acima da média</span>
                </div>
            </div>

            <div class="card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 class="card-title" style="font-size: 1.2rem; color: var(--plum);">Retenção de Clientes (30 dias)</h3>
                    <span class="badge" style="background: var(--success); color: white;">${retencao.taxa}% ativa</span>
                </div>
                <div style="display: flex; align-items: center; gap: 30px;">
                    <div style="width: 120px; height: 120px; border-radius: 50%; background: conic-gradient(
                        var(--success) 0% ${retencao.taxa}%, 
                        var(--plum) ${retencao.taxa}% 100%
                    ); display: flex; align-items: center; justify-content: center;">
                        <div style="width: 90px; height: 90px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; color: var(--txt-dark);">
                            ${retencao.qtd}
                        </div>
                    </div>
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                            <div style="width: 12px; height: 12px; background: var(--success); border-radius: 50%;"></div>
                            <span>Clientes ativos: ${retencao.qtd}</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div style="width: 12px; height: 12px; background: var(--plum); border-radius: 50%;"></div>
                            <span>Base total: ${Clientes.getAll().length}</span>
                        </div>
                    </div>
                </div>
            </div>

            ${Agenda.getAmanha().length ? `
            <div class="card" style="border-left: 4px solid var(--rose); background: var(--rose-light)">
                <h3 style="color: var(--plum); margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
                    ${renderIcon('Calendar', { width: 20, height: 20 })} 
                    Amanhã - ${Agenda.getAmanha().length} agendamentos
                </h3>
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    ${Agenda.getAmanha().map(a => `
                        <div style="display: flex; align-items: center; gap: 12px; padding: 8px; background: white; border-radius: 8px;">
                            <span style="font-weight: 600; color: var(--plum); min-width: 60px;">${a.horario}</span>
                            <span style="flex: 1;">${a.cliente}</span>
                            ${a.telefone ? `
                                <a href="${linkWA(a.telefone, `Olá ${a.cliente}, tudo bem? Passando para confirmar seu horário amanhã às ${a.horario}.`)}" 
                                   target="_blank" class="wa-link" title="Confirmar">
                                    ${renderIcon('MessageCircle', { width: 16, height: 16 })}
                                </a>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
                ${Agenda.getAmanha().filter(a => a.telefone).length > 0 ? `
                    <button class="btn btn-primary" style="width:100%;margin-top:16px;" onclick="confirmarLoteWA()">
                        ${renderIcon('MessageCircle', { width: 16, height: 16 })}
                        Confirmar todos pelo WhatsApp (${Agenda.getAmanha().filter(a => a.telefone).length})
                    </button>
                ` : ''}
            </div>
            ` : ''}
        `;

        // Ações do onboarding
        window.__onboardingAction = (idx) => { onboardingSteps[idx]?.action(); };

        // Confirmar lote WA
        window.confirmarLoteWA = () => {
            const comTelefone = Agenda.getAmanha().filter(a => a.telefone);
            if (!comTelefone.length) { toast('Nenhum agendamento com telefone cadastrado.', 'warning'); return; }
            let idx = 0;
            const abrir = () => {
                if (idx >= comTelefone.length) { toast(`${comTelefone.length} mensagens abertas!`, 'success'); return; }
                const a = comTelefone[idx];
                const msg = `Olá ${a.cliente}! Passando para confirmar seu horário amanhã às ${a.horario}. Pode confirmar?`;
                const url = linkWA(a.telefone, msg);
                if (url) window.open(url, '_blank');
                idx++;
                setTimeout(abrir, 800);
            };
            toast(`Abrindo ${comTelefone.length} conversas...`, 'default', 5000);
            abrir();
        };

        // Animar KPIs
        setTimeout(() => {
            const kpiFat = container.querySelector('[data-kpi="faturamento"]');
            const kpiLucro = container.querySelector('[data-kpi="lucro"]');
            const kpiAtend = container.querySelector('[data-kpi="atendimentos"]');
            const kpiTicket = container.querySelector('[data-kpi="ticket"]');
            if (kpiFat) animateCounter(kpiFat, 0, res.faturamento, 700, v => R$(v));
            if (kpiLucro) animateCounter(kpiLucro, 0, res.lucroReal, 700, v => R$(v));
            if (kpiAtend) animateCounter(kpiAtend, 0, res.atendimentos, 500, v => Math.round(v));
            if (kpiTicket) animateCounter(kpiTicket, 0, res.ticket, 600, v => R$(v));
        }, 50);
    },

    agenda: (container) => {
        const cfg = Config.get();
        const svcs = Servicos.getAll();

        const renderTable = () => {
            const entries = Agenda.getAll().sort((a, b) => (b.data + b.horario).localeCompare(a.data + a.horario));

            if (!entries.length) {
                return `<div class="card" style="text-align: center; padding: 40px; color: var(--txt-muted);">
                    ${renderIcon('Calendar', { width: 48, height: 48, strokeWidth: 1 })}
                    <p style="margin-top: 16px;">Nenhum agendamento encontrado.</p>
                </div>`;
            }

            return `
                <div class="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Horário</th>
                                <th>Cliente</th>
                                <th>Serviço</th>
                                <th>Status</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${entries.map(e => `
                                <tr>
                                    <td>${fmtData(e.data)}</td>
                                    <td><span class="badge">${e.horario}</span></td>
                                    <td style="font-weight: 600;">${e.cliente}</td>
                                    <td>${e.servicoNome || '-'}</td>
                                    <td>
                                        <select onchange="Agenda.update(${e.id}, { status: this.value }); renderPage('agenda', document.getElementById('page-agenda'));"  
                                                class="badge" style="border: none; cursor: pointer;">
                                            <option value="agendado" ${e.status === 'agendado' ? 'selected' : ''}>Agendado</option>
                                            <option value="confirmado" ${e.status === 'confirmado' ? 'selected' : ''}>Confirmado</option>
                                            <option value="realizado" ${e.status === 'realizado' ? 'selected' : ''}>Realizado</option>
                                            <option value="cancelado" ${e.status === 'cancelado' ? 'selected' : ''}>Cancelado</option>
                                        </select>
                                    </td>
                                    <td>
                                        <div style="display: flex; gap: 8px;">
                                            ${e.telefone ? `
                                                <a href="${linkWA(e.telefone, `Olá ${e.cliente}! Confirmo seu agendamento para ${fmtData(e.data)} às ${e.horario}.`)}" 
                                                   target="_blank" class="wa-link" style="width: 28px; height: 28px;">
                                                    ${renderIcon('MessageCircle', { width: 14, height: 14 })}
                                                </a>
                                            ` : ''}
                                            <button onclick="Agenda.remove(${e.id}); renderPage('agenda', document.getElementById('page-agenda'));" 
                                                    class="btn btn-sm btn-danger">
                                                ${renderIcon('Trash2', { width: 14, height: 14 })}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        };

        container.innerHTML = `
            <div class="header" style="margin-bottom: 24px;">
                <h2>Agenda de Horários</h2>
                <button class="btn btn-primary" onclick="window.__openForm('Novo Agendamento', document.getElementById('tpl-agenda-form').innerHTML)">
                    ${renderIcon('Plus', { width: 16, height: 16 })} Novo
                </button>
            </div>
            ${renderTable()}
            
            <template id="tpl-agenda-form">
                <div class="form-group">
                    <label>Data</label>
                    <input type="date" id="ag-data" value="${hoje()}">
                </div>
                <div class="form-group">
                    <label>Horário</label>
                    <input type="time" id="ag-hora" value="09:00">
                </div>
                <div class="form-group">
                    <label>Cliente</label>
                    <input type="text" id="ag-cliente" placeholder="Nome da cliente">
                </div>
                <div class="form-group">
                    <label>Telefone</label>
                    <input type="tel" id="ag-tel" placeholder="(00) 00000-0000">
                </div>
                <div class="form-group">
                    <label>Serviço</label>
                    <select id="ag-servico">
                        <option value="">Selecione...</option>
                        ${svcs.map(s => `<option value="${s.id}" data-nome="${s.nome}">${s.nome}</option>`).join('')}
                    </select>
                </div>
                <div class="modal-footer" style="padding: 0; margin-top: 20px;">
                    <button class="btn btn-secondary" onclick="window.__closeForm()">Cancelar</button>
                    <button class="btn btn-primary" onclick="
                        const s = document.getElementById('ag-servico');
                        Agenda.add({
                            data: document.getElementById('ag-data').value,
                            horario: document.getElementById('ag-hora').value,
                            cliente: document.getElementById('ag-cliente').value,
                            telefone: document.getElementById('ag-tel').value,
                            servicoId: s.value,
                            servicoNome: s.options[s.selectedIndex].dataset.nome,
                            status: 'agendado'
                        });
                        window.__closeForm();
                        renderPage('agenda', document.getElementById('page-agenda'));
                        toast('Agendamento criado!');
                    ">Salvar</button>
                </div>
            </template>
        `;

        // Expose Agenda to window for inline handlers
        window.Agenda = Agenda;
    },

    diario: (container) => {
        const cfg = Config.get();
        const svcs = Servicos.getAll();
        const prods = Produtos.getAll();
        const profs = cfg.profissionais;

        const hojeStr = hoje();
        const entries = Diario.getAll().filter(e => e.data === hojeStr);
        const total = entries.reduce((s, e) => s + (parseFloat(e.precoCobrado) || 0), 0);

        container.innerHTML = `
            <div class="header" style="margin-bottom: 24px;">
                <div>
                    <h2>Diário / Caixa</h2>
                    <div style="color: var(--txt-muted); font-size: 0.9rem;">${fmtData(hojeStr)}</div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 0.85rem; color: var(--txt-muted);">Total do Dia</div>
                    <div style="font-size: 1.8rem; font-weight: 700; color: var(--success);">${R$(total)}</div>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 24px;">
                <div>
                    ${entries.length ? `
                        <div class="table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Horário</th>
                                        <th>Cliente</th>
                                        <th>Item</th>
                                        <th>Valor</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${entries.map(e => `
                                        <tr>
                                            <td>${e.horario || '-'}</td>
                                            <td style="font-weight: 600;">${e.cliente}</td>
                                            <td><span class="badge">${e.servicoNome || e.produtoNome || '-'}</span></td>
                                            <td style="font-weight: 600;">${R$(e.precoCobrado)}</td>
                                            <td>
                                                <button onclick="Diario.remove(${e.id}); renderPage('diario', document.getElementById('page-diario'));" 
                                                        class="btn btn-sm btn-danger">
                                                    ${renderIcon('Trash2', { width: 14, height: 14 })}
                                                </button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    ` : `
                        <div class="card" style="text-align: center; padding: 60px 40px; color: var(--txt-muted);">
                            ${renderIcon('DollarSign', { width: 48, height: 48, strokeWidth: 1 })}
                            <p style="margin-top: 16px;">Nenhum lançamento hoje.</p>
                            <p style="font-size: 0.85rem; margin-top: 8px;">Clique em "Novo Lançamento" para começar.</p>
                        </div>
                    `}
                </div>
                
                <div>
                    <button class="btn btn-primary" style="width: 100%; margin-bottom: 16px;" 
                            onclick="window.__openForm('Novo Lançamento', document.getElementById('tpl-diario-form').innerHTML);
                                     setTimeout(() => applyMoneyMask(document.getElementById('dv-valor')), 100);">
                        ${renderIcon('Plus', { width: 16, height: 16 })} Novo Lançamento
                    </button>
                    
                    <div class="card">
                        <h4 style="color: var(--plum); margin-bottom: 16px; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px;">Resumo</h4>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                            <span style="color: var(--txt-muted);">Itens:</span>
                            <span style="font-weight: 600;">${entries.length}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                            <span style="color: var(--txt-muted);">Média:</span>
                            <span style="font-weight: 600;">${R$(entries.length ? total / entries.length : 0)}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <template id="tpl-diario-form">
                <div class="form-group">
                    <label>Cliente</label>
                    <input type="text" id="dv-cliente" placeholder="Nome">
                </div>
                <div class="form-group">
                    <label>Tipo</label>
                    <select id="dv-tipo" onchange="
                        const t = this.value;
                        document.getElementById('sel-servico').style.display = t === 'servico' ? 'block' : 'none';
                        document.getElementById('sel-produto').style.display = t === 'produto' ? 'block' : 'none';
                    ">
                        <option value="servico">Serviço</option>
                        <option value="produto">Produto</option>
                    </select>
                </div>
                <div class="form-group" id="sel-servico">
                    <label>Serviço</label>
                    <select id="dv-servico" onchange="
                        const s = Servicos.byId(this.value);
                        if(s) { document.getElementById('dv-valor').value = s.precoIdeal || s.preco; document.getElementById('dv-valor').dataset.rawValue = s.precoIdeal || s.preco; }
                    ">
                        <option value="">Selecione...</option>
                        ${svcs.map(s => `<option value="${s.id}">${s.nome} - ${R$(s.precoIdeal || s.preco)}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group" id="sel-produto" style="display: none;">
                    <label>Produto</label>
                    <select id="dv-produto" onchange="
                        const p = Produtos.getAll().find(x => x.id == this.value);
                        if(p) { document.getElementById('dv-valor').value = p.precoVenda; document.getElementById('dv-valor').dataset.rawValue = p.precoVenda; }
                    ">
                        <option value="">Selecione...</option>
                        ${prods.map(p => `<option value="${p.id}">${p.nome} - ${R$(p.precoVenda)}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Valor</label>
                    <input type="text" id="dv-valor" data-money placeholder="0,00">
                </div>
                <div class="form-group">
                    <label>Profissional</label>
                    <select id="dv-prof">
                        ${profs.map(p => `<option value="${p}">${p}</option>`).join('')}
                    </select>
                </div>
                <div class="modal-footer" style="padding: 0; margin-top: 20px;">
                    <button class="btn btn-secondary" onclick="window.__closeForm()">Cancelar</button>
                    <button class="btn btn-primary" onclick="
                        const tipo = document.getElementById('dv-tipo').value;
                        const isServ = tipo === 'servico';
                        const selId = isServ ? 'dv-servico' : 'dv-produto';
                        const sel = document.getElementById(selId);
                        const item = isServ ? Servicos.byId(sel.value) : prods.find(p => p.id == sel.value);
                        
                        Diario.add({
                            data: '${hojeStr}',
                            horario: new Date().toTimeString().slice(0,5),
                            cliente: document.getElementById('dv-cliente').value,
                            tipo: tipo,
                            servicoId: isServ ? item?.id : null,
                            servicoNome: isServ ? item?.nome : null,
                            produtoId: !isServ ? item?.id : null,
                            produtoNome: !isServ ? item?.nome : null,
                            precoCobrado: parseFloat(document.getElementById('dv-valor').dataset.rawValue) || 0,
                            profissional: document.getElementById('dv-prof').value,
                            custoTotal: isServ ? (parseFloat(item?.custoTotal) || 0) : (parseFloat(item?.custoProd) || 0)
                        });
                        
                        if (!isServ && item) Produtos.baixarEstoque(item.id, 1);
                        
                        window.__closeForm();
                        renderPage('diario', document.getElementById('page-diario'));
                        toast('Lançamento salvo!');
                    ">Salvar</button>
                </div>
            </template>
        `;

        window.Diario = Diario;
        window.Servicos = Servicos;
        window.Produtos = Produtos;
    },

    servicos: (container) => {
        const svcs = Servicos.getAll();
        const prods = Produtos.getAll();

        container.innerHTML = `
            <div class="header" style="margin-bottom: 24px;">
                <h2>Catálogo</h2>
                <div style="display: flex; gap: 12px;">
                    <button class="btn btn-primary" onclick="window.__openForm('Novo Serviço', document.getElementById('tpl-svc-form').innerHTML)">
                        ${renderIcon('Plus', { width: 16, height: 16 })} Serviço
                    </button>
                    <button class="btn btn-secondary" onclick="window.__openForm('Novo Produto', document.getElementById('tpl-prod-form').innerHTML)">
                        ${renderIcon('Package', { width: 16, height: 16 })} Produto
                    </button>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
                <div>
                    <h3 style="color: var(--plum); margin-bottom: 16px; font-size: 1rem;">Serviços</h3>
                    <div class="grid" style="grid-template-columns: 1fr;">
                        ${svcs.length ? svcs.map(s => `
                            <div class="card" style="display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <div style="font-weight: 600;">${s.nome}</div>
                                    <div style="font-size: 0.85rem; color: var(--txt-muted);">${s.categoria || 'Serviço'}</div>
                                </div>
                                <div style="text-align: right;">
                                    <div style="font-weight: 700; color: var(--success);">${R$(s.precoIdeal || s.preco)}</div>
                                    <button onclick="Servicos.remove(${s.id}); renderPage('servicos', document.getElementById('page-servicos'));" 
                                            class="btn btn-sm btn-danger" style="margin-top: 8px;">
                                        ${renderIcon('Trash2', { width: 14, height: 14 })}
                                    </button>
                                </div>
                            </div>
                        `).join('') : '<p style="color: var(--txt-muted);">Nenhum serviço cadastrado.</p>'}
                    </div>
                </div>
                
                <div>
                    <h3 style="color: var(--plum); margin-bottom: 16px; font-size: 1rem;">Produtos / Estoque</h3>
                    <div class="grid" style="grid-template-columns: 1fr;">
                        ${prods.length ? prods.map(p => `
                            <div class="card" style="display: flex; justify-content: space-between; align-items: center; ${(p.estoque || 0) <= (p.estoqueMin || 2) ? 'border: 2px solid var(--danger);' : ''}">
                                <div>
                                    <div style="font-weight: 600;">${p.nome}</div>
                                    <div style="font-size: 0.85rem; color: var(--txt-muted);">
                                        Estoque: <span style="color: ${(p.estoque || 0) <= (p.estoqueMin || 2) ? 'var(--danger)' : 'inherit'}; font-weight: 600;">
                                            ${p.estoque || 0} un
                                        </span>
                                    </div>
                                </div>
                                <div style="text-align: right;">
                                    <div style="font-weight: 700;">${R$(p.precoVenda)}</div>
                                    <button onclick="Produtos.remove(${p.id}); renderPage('servicos', document.getElementById('page-servicos'));" 
                                            class="btn btn-sm btn-danger" style="margin-top: 8px;">
                                        ${renderIcon('Trash2', { width: 14, height: 14 })}
                                    </button>
                                </div>
                            </div>
                        `).join('') : '<p style="color: var(--txt-muted);">Nenhum produto cadastrado.</p>'}
                    </div>
                </div>
            </div>
            
            <template id="tpl-svc-form">
                <div class="form-group"><label>Nome</label><input type="text" id="s-nome"></div>
                <div class="form-group"><label>Categoria</label><input type="text" id="s-cat"></div>
                <div class="form-group"><label>Preço Ideal</label><input type="number" id="s-preco" step="0.01"></div>
                <div class="form-group"><label>Custo Estimado</label><input type="number" id="s-custo" step="0.01"></div>
                <div class="modal-footer" style="padding: 0; margin-top: 20px;">
                    <button class="btn btn-secondary" onclick="window.__closeForm()">Cancelar</button>
                    <button class="btn btn-primary" onclick="
                        Servicos.add({
                            nome: document.getElementById('s-nome').value,
                            categoria: document.getElementById('s-cat').value,
                            precoIdeal: parseFloat(document.getElementById('s-preco').value) || 0,
                            custoTotal: parseFloat(document.getElementById('s-custo').value) || 0
                        });
                        window.__closeForm();
                        renderPage('servicos', document.getElementById('page-servicos'));
                        toast('Serviço cadastrado!');
                    ">Salvar</button>
                </div>
            </template>
            
            <template id="tpl-prod-form">
                <div class="form-group"><label>Nome</label><input type="text" id="p-nome"></div>
                <div class="form-group"><label>Custo</label><input type="number" id="p-custo" step="0.01"></div>
                <div class="form-group"><label>Preço Venda</label><input type="number" id="p-preco" step="0.01"></div>
                <div class="form-group"><label>Estoque</label><input type="number" id="p-estoque" value="0"></div>
                <div class="form-group"><label>Estoque Mínimo</label><input type="number" id="p-min" value="2"></div>
                <div class="modal-footer" style="padding: 0; margin-top: 20px;">
                    <button class="btn btn-secondary" onclick="window.__closeForm()">Cancelar</button>
                    <button class="btn btn-primary" onclick="
                        Produtos.add({
                            nome: document.getElementById('p-nome').value,
                            custoProd: parseFloat(document.getElementById('p-custo').value) || 0,
                            precoVenda: parseFloat(document.getElementById('p-preco').value) || 0,
                            estoque: parseInt(document.getElementById('p-estoque').value) || 0,
                            estoqueMin: parseInt(document.getElementById('p-min').value) || 2
                        });
                        window.__closeForm();
                        renderPage('servicos', document.getElementById('page-servicos'));
                        toast('Produto cadastrado!');
                    ">Salvar</button>
                </div>
            </template>
        `;

        window.Servicos = Servicos;
        window.Produtos = Produtos;
    },

    clientes: (container) => {
        Clientes.syncFromDiarioAgenda();
        const clientes = Clientes.getAll();

        const calcSeg = (stats) => {
            if (!stats.ultimaVisita) return { label: 'Nova', color: 'var(--info)' };
            const dias = Math.floor((Date.now() - new Date(stats.ultimaVisita + 'T12:00:00').getTime()) / 86400000);
            if (dias > 90) return { label: 'Inativa', color: 'var(--danger)' };
            if (dias >= 31) return { label: 'Ausente', color: 'var(--warning)' };
            if (stats.qtdTotal >= 5) return { label: 'Fiel', color: 'var(--success)' };
            return { label: 'Regular', color: 'var(--plum)' };
        };

        container.innerHTML = `
            <div class="header" style="margin-bottom: 24px;">
                <h2>CRM de Clientes</h2>
                <span style="color: var(--txt-muted);">${clientes.length} cadastros</span>
            </div>
            
            <div class="grid" style="grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));">
                ${clientes.map(c => {
            const stats = Clientes.calcStats(c.nome);
            const seg = calcSeg(stats);
            return `
                        <div class="card" style="position: relative;">
                            <div style="position: absolute; top: 16px; right: 16px;">
                                <span style="background: ${seg.color}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 600;">
                                    ${seg.label}
                                </span>
                            </div>
                            <h3 style="margin-bottom: 8px;">${c.nome}</h3>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 16px 0; font-size: 0.9rem;">
                                <div>
                                    <div style="color: var(--txt-muted); font-size: 0.8rem;">Visitas</div>
                                    <div style="font-weight: 600;">${stats.qtdTotal}</div>
                                </div>
                                <div>
                                    <div style="color: var(--txt-muted); font-size: 0.8rem;">Ticket Médio</div>
                                    <div style="font-weight: 600;">${R$(stats.ticket)}</div>
                                </div>
                                <div>
                                    <div style="color: var(--txt-muted); font-size: 0.8rem;">Última Visita</div>
                                    <div style="font-weight: 600;">${fmtData(stats.ultimaVisita)}</div>
                                </div>
                                <div>
                                    <div style="color: var(--txt-muted); font-size: 0.8rem;">Total Gasto</div>
                                    <div style="font-weight: 600; color: var(--success);">${R$(stats.fat)}</div>
                                </div>
                            </div>
                            ${c.telefone ? `
                                <a href="${linkWA(c.telefone, `Olá ${c.nome}!`)}" target="_blank" class="wa-link" style="width: 100%; border-radius: 8px; margin-top: 8px;">
                                    ${renderIcon('MessageCircle', { width: 16, height: 16 })} Enviar mensagem
                                </a>
                            ` : ''}
                        </div>
                    `;
        }).join('')}
            </div>
        `;

        window.Clientes = Clientes;
    },

    custos: (container) => {
        const cfg = Config.get();
        const mesAtual = new Date().getMonth();
        const key = mesKey(cfg.ano, mesAtual);
        const data = Custos.getMes(key);
        const total = Custos.totalMes(key);

        container.innerHTML = `
            <div class="header" style="margin-bottom: 24px;">
                <h2>Custos Fixos</h2>
                <div class="badge" style="font-size: 1rem; padding: 8px 16px;">${R$(total)}</div>
            </div>
            
            <div class="card">
                <div class="grid" style="grid-template-columns: repeat(3, 1fr);">
                    ${['aluguel', 'condominio', 'energia', 'agua', 'internet', 'auxiliar', 'limpeza', 'contabilidade', 'software', 'marketing'].map(k => `
                        <div class="form-group">
                            <label style="text-transform: capitalize;">${k}</label>
                            <input type="number" id="cf-${k}" value="${data[k] || ''}" step="0.01" 
                                   onchange="Custos.saveMes('${key}', { ...Custos.getMes('${key}'), ${k}: parseFloat(this.value) || 0 });"
                                   style="font-family: monospace;">
                        </div>
                    `).join('')}
                </div>
                <div style="margin-top: 24px; padding-top: 24px; border-top: 2px solid var(--mauve); display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: var(--txt-muted);">Total mensal calculado automaticamente</span>
                    <span style="font-size: 1.5rem; font-weight: 700; color: var(--danger);">${R$(total)}</span>
                </div>
            </div>
        `;

        window.Custos = Custos;
    },

    receitas: (container) => {
        const cfg = Config.get();
        const mesAtual = new Date().getMonth();
        const key = mesKey(cfg.ano, mesAtual);
        const data = Receitas.getMes(key);
        const total = Receitas.totalMes(key);
        const cfReal = Receitas.custoFixoRealMes(key);

        container.innerHTML = `
            <div class="header" style="margin-bottom: 24px;">
                <h2>Receitas do Espaço</h2>
                <div style="text-align: right;">
                    <div style="font-size: 0.85rem; color: var(--txt-muted);">Custo Fixo Real</div>
                    <div style="font-size: 1.5rem; font-weight: 700; color: ${cfReal > 0 ? 'var(--danger)' : 'var(--success)'};">${R$(cfReal)}</div>
                </div>
            </div>
            
            <div class="card">
                <div class="grid" style="grid-template-columns: repeat(3, 1fr);">
                    ${['cadeira1', 'cadeira2', 'manicure', 'pedicure', 'outros1', 'outros2'].map(k => `
                        <div class="form-group">
                            <label style="text-transform: capitalize;">${k.replace(/[0-9]/, ' $&')}</label>
                            <input type="number" id="rc-${k}" value="${data[k] || ''}" step="0.01" 
                                   onchange="Receitas.saveMes('${key}', { ...Receitas.getMes('${key}'), ${k}: parseFloat(this.value) || 0 });"
                                   style="font-family: monospace;">
                        </div>
                    `).join('')}
                </div>
                <div style="margin-top: 24px; padding-top: 24px; border-top: 2px solid var(--mauve);">
                    <div style="background: var(--success); color: white; padding: 16px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 0.9rem; opacity: 0.9;">Total em Repasses</div>
                        <div style="font-size: 2rem; font-weight: 700;">${R$(total)}</div>
                    </div>
                </div>
            </div>
        `;

        window.Receitas = Receitas;
    },

    controle: (container) => {
        const cfg = Config.get();
        const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const dados = meses.map((m, i) => {
            const r = Diario.resumoMes(cfg.ano, i);
            return { mes: m, ...r };
        });

        container.innerHTML = `
            <div class="header" style="margin-bottom: 24px;">
                <h2>Controle Anual ${cfg.ano}</h2>
            </div>
            
            <div class="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Mês</th>
                            <th class="td-center">Atend.</th>
                            <th class="td-right">Faturamento</th>
                            <th class="td-right">Custo</th>
                            <th class="td-right">Lucro</th>
                            <th class="td-right">Ticket Médio</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${dados.map(d => `
                            <tr>
                                <td style="font-weight: 600;">${d.mes}</td>
                                <td class="td-center">${d.atendimentos || '-'}</td>
                                <td class="td-right" style="color: var(--success); font-weight: 600;">${d.faturamento ? R$(d.faturamento) : '-'}</td>
                                <td class="td-right">${d.custoTotal ? R$(d.custoTotal) : '-'}</td>
                                <td class="td-right" style="color: ${(d.lucroReal || 0) >= 0 ? 'var(--success)' : 'var(--danger)'}; font-weight: 600;">
                                    ${d.lucroReal ? R$(d.lucroReal) : '-'}
                                </td>
                                <td class="td-right">${d.ticket ? R$(d.ticket) : '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            
            <div class="card" style="margin-top: 24px;">
                <h3 style="color: var(--plum); margin-bottom: 16px;">Gráfico de Faturamento</h3>
                <div style="display: flex; align-items: flex-end; justify-content: space-between; height: 200px; padding: 20px 0; gap: 8px;">
                    ${dados.map(d => {
            const max = Math.max(...dados.map(x => x.faturamento || 0)) || 1;
            const h = (d.faturamento || 0) / max * 100;
            return `
                            <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px;">
                                <div style="width: 100%; height: ${Math.max(h, 5)}px; background: linear-gradient(180deg, var(--plum), var(--rose)); border-radius: 4px 4px 0 0; min-height: 4px;"></div>
                                <span style="font-size: 0.75rem; color: var(--txt-muted);">${d.mes}</span>
                            </div>
                        `;
        }).join('')}
                </div>
            </div>
        `;
    },

    configuracoes: (container) => {
        const cfg = Config.get();

        container.innerHTML = `
            <div class="header" style="margin-bottom: 24px;">
                <h2>Configurações</h2>
            </div>
            
            <div class="grid" style="grid-template-columns: 1fr 1fr;">
                <div class="card">
                    <h3 style="color: var(--plum); margin-bottom: 20px;">Dados do Salão</h3>
                    <div class="form-group">
                        <label>Nome do Salão</label>
                        <input type="text" id="cfg-nome" value="${cfg.nomeSalao}" onchange="Config.save({ ...Config.get(), nomeSalao: this.value });">
                    </div>
                    <div class="form-group">
                        <label>Responsável</label>
                        <input type="text" id="cfg-resp" value="${cfg.responsavel}" onchange="Config.save({ ...Config.get(), responsavel: this.value });">
                    </div>
                    <div class="form-group">
                        <label>Telefone</label>
                        <input type="text" id="cfg-tel" value="${cfg.telefone}" onchange="Config.save({ ...Config.get(), telefone: this.value });">
                    </div>
                </div>
                
                <div class="card">
                    <h3 style="color: var(--plum); margin-bottom: 20px;">Profissionais</h3>
                    <div id="cfg-profs">
                        ${cfg.profissionais.map((p, i) => `
                            <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                                <input type="text" value="${p}" onchange="
                                    const ps = Config.get().profissionais;
                                    ps[${i}] = this.value;
                                    Config.save({ ...Config.get(), profissionais: ps });
                                " style="flex: 1;">
                                <button onclick="
                                    const ps = Config.get().profissionais.filter((_, idx) => idx !== ${i});
                                    Config.save({ ...Config.get(), profissionais: ps });
                                    renderPage('configuracoes', document.getElementById('page-configuracoes'));
                                " class="btn btn-danger">${renderIcon('Trash2', { width: 14, height: 14 })}</button>
                            </div>
                        `).join('')}
                    </div>
                    <button class="btn btn-secondary" style="width: 100%; margin-top: 8px;" onclick="
                        Config.save({ ...Config.get(), profissionais: [...Config.get().profissionais, 'Novo Profissional'] });
                        renderPage('configuracoes', document.getElementById('page-configuracoes'));
                    ">
                        ${renderIcon('Plus', { width: 14, height: 14 })} Adicionar
                    </button>
                </div>
            </div>
            
            <div class="card" style="margin-top: 24px; border: 2px solid var(--danger);">
                <h3 style="color: var(--danger); margin-bottom: 16px;">Zona de Perigo</h3>
                <p style="color: var(--txt-muted); margin-bottom: 16px;">Atenção: estas ações não podem ser desfeitas.</p>
                <button class="btn btn-danger" onclick="window.__confirmDelete('Limpar TODOS os dados? Esta ação é irreversível.', () => { localStorage.clear(); location.reload(); }, 'Limpar Tudo')">
                    ${renderIcon('Trash2', { width: 16, height: 16 })} Limpar Todos os Dados
                </button>
            </div>
        `;

        window.Config = Config;
    }
};

// ═══════════════════════════════════════════════════════
// EXPORT RENDER FUNCTION
// ═══════════════════════════════════════════════════════
export function renderPage(page, container) {
    if (PAGES_RENDER[page]) {
        PAGES_RENDER[page](container);
    }
}

// Expose para handlers inline
window.renderPage = renderPage;
window.Agenda = Agenda;
window.Diario = Diario;
window.Servicos = Servicos;
window.Produtos = Produtos;
window.Clientes = Clientes;
window.Custos = Custos;
window.Receitas = Receitas;
window.Config = Config;
window.applyMoneyMask = applyMoneyMask;