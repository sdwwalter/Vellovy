// ═══════════════════════════════════════════════════════
// modules.js — Páginas, Storage, Sync
// v4.0: Cálculos corrigidos, Relatório completo, Validação
// ═══════════════════════════════════════════════════════

import { supabase, renderIcon, toast, navigateTo } from './app.js';

// ═══════════════════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════════════════
export const R$ = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export const pct = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'percent', minimumFractionDigits: 1 });
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

// Máscara monetária — retorna o valor numérico em data-raw-value
export const applyMoneyMask = (input) => {
    if (!input) return;
    input.addEventListener('input', (e) => {
        let v = e.target.value.replace(/\D/g, '');
        if (!v) { e.target.value = ''; e.target.dataset.rawValue = '0'; return; }
        const n = parseInt(v, 10) / 100;
        e.target.value = n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        e.target.dataset.rawValue = String(n);
    });
    // Inicializa rawValue se já houver valor
    if (input.value) {
        const parsed = parseFloat(input.value.replace(/\./g, '').replace(',', '.')) || 0;
        input.dataset.rawValue = String(parsed);
    }
};

export const getRaw = (id) => parseFloat(document.getElementById(id)?.dataset?.rawValue || document.getElementById(id)?.value || 0) || 0;

// Validação simples
export function validate(rules) {
    let ok = true;
    rules.forEach(({ id, label, required, min }) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.classList.remove('error');
        const next = el.nextElementSibling;
        if (next?.classList.contains('field-error')) next.remove();

        const val = el.value.trim();
        let msg = '';
        if (required && !val) msg = `${label} é obrigatório.`;
        else if (min !== undefined && parseFloat(val) < min) msg = `${label} deve ser maior que 0.`;

        if (msg) {
            ok = false;
            el.classList.add('error');
            const span = document.createElement('span');
            span.className = 'field-error';
            span.textContent = msg;
            el.insertAdjacentElement('afterend', span);
        }
    });
    return ok;
}

// ═══════════════════════════════════════════════════════
// STORAGE & SYNC ENGINE
// ═══════════════════════════════════════════════════════
const KEYS = {
    CONFIG:   'salao_config',
    CUSTOS:   'salao_custos',
    RECEITAS: 'salao_receitas',
    SERVICOS: 'salao_servicos',
    DIARIO:   'salao_diario',
    AGENDA:   'salao_agenda',
    PRODUTOS: 'salao_produtos',
    CLIENTES: 'salao_clientes',
};

const LS_TO_TYPE = {
    [KEYS.CONFIG]:   'config',
    [KEYS.CUSTOS]:   'custos',
    [KEYS.RECEITAS]: 'receitas',
    [KEYS.SERVICOS]: 'servicos',
    [KEYS.DIARIO]:   'diario',
    [KEYS.AGENDA]:   'agenda',
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
// ENTITIES
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
        multMin: 2.0, multIdeal: 2.5, multPrem: 3.0,
        atendMedios: 80,
        profissionais: ['Proprietária', 'Cabeleireira 1', 'Manicure 1'],
        categorias: ['Cabelo', 'Coloração', 'Manicure', 'Estética'],
        formasPagamento: ['Dinheiro', 'PIX', 'Cartão Débito', 'Cartão Crédito'],
        ..._load(KEYS.CONFIG, {})
    }),
    save: (cfg) => _save(KEYS.CONFIG, { ...Config.get(), ...cfg }),
};

export const Servicos = {
    getAll: () => _load(KEYS.SERVICOS, []),
    save:   (arr) => _save(KEYS.SERVICOS, arr),
    add:    (s) => { const all = Servicos.getAll(); s.id = Date.now(); all.push(s); Servicos.save(all); return s; },
    remove: (id) => Servicos.save(Servicos.getAll().filter(s => s.id !== id)),
    byId:   (id) => Servicos.getAll().find(s => s.id == id),
    update: (id, changes) => {
        const all = Servicos.getAll();
        const idx = all.findIndex(s => s.id == id);
        if (idx >= 0) { all[idx] = { ...all[idx], ...changes }; Servicos.save(all); }
    },
};

export const Produtos = {
    getAll: () => _load(KEYS.PRODUTOS, []),
    save:   (arr) => _save(KEYS.PRODUTOS, arr),
    add:    (p) => {
        const all = Produtos.getAll();
        p.id  = Date.now();
        p.sku = `P${String(Math.max(0, ...all.map(x => parseInt((x.sku || 'P0').slice(1)) || 0)) + 1).padStart(3, '0')}`;
        all.push(p);
        Produtos.save(all);
        return p;
    },
    remove: (id) => Produtos.save(Produtos.getAll().filter(p => p.id !== id)),
    byId:   (id) => Produtos.getAll().find(p => p.id == id),
    baixarEstoque: (id, qtd = 1) => {
        const all = Produtos.getAll();
        const idx = all.findIndex(p => p.id == id);
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
        e.id   = Date.now();
        e.data = e.data || hoje();
        e.qtd  = parseInt(e.qtd) || 1;
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
    // ── CÁLCULO CENTRALIZADO — única fonte de verdade ──
    resumoMes: (ano, mesIdx) => {
        const entries = Diario.getByMes(ano, mesIdx);
        let faturamento = 0, custoTotal = 0, comissao = 0, atendimentos = 0;
        entries.forEach(e => {
            const qtd = parseInt(e.qtd) || 1;
            faturamento  += (parseFloat(e.precoCobrado)  || 0) * qtd;
            custoTotal   += (parseFloat(e.custoTotal)    || 0) * qtd;
            comissao     += (parseFloat(e.comissaoValor) || 0) * qtd;
            atendimentos += qtd;
        });
        return {
            entries, atendimentos, faturamento, custoTotal,
            comissaoTotal: comissao,
            lucroReal: faturamento - custoTotal - comissao,
            ticket: atendimentos ? faturamento / atendimentos : 0,
            margem: faturamento ? ((faturamento - custoTotal - comissao) / faturamento) : 0,
        };
    },
    // Total de um dia específico — usa mesma lógica
    resumoDia: (dataStr) => {
        const entries = Diario.getAll().filter(e => e.data === dataStr);
        let faturamento = 0, custoTotal = 0, comissao = 0, atendimentos = 0;
        entries.forEach(e => {
            const qtd = parseInt(e.qtd) || 1;
            faturamento  += (parseFloat(e.precoCobrado)  || 0) * qtd;
            custoTotal   += (parseFloat(e.custoTotal)    || 0) * qtd;
            comissao     += (parseFloat(e.comissaoValor) || 0) * qtd;
            atendimentos += qtd;
        });
        return { entries, atendimentos, faturamento, custoTotal, comissaoTotal: comissao,
                 lucroReal: faturamento - custoTotal - comissao };
    },
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
    remove: (id) => { _save(KEYS.AGENDA, Agenda.getAll().filter(e => e.id !== id)); _invalidateClienteCache(); },
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
        const idx = all.findIndex(e => e.id == id);
        if (idx >= 0) { all[idx] = { ...all[idx], ...changes }; _save(KEYS.AGENDA, all); _invalidateClienteCache(); }
    },
    save: (arr) => _save(KEYS.AGENDA, arr),
};

export const Clientes = {
    getAll: () => _load(KEYS.CLIENTES, []),
    upsert: (nome, dados) => {
        const all = Clientes.getAll();
        const k   = nome.toLowerCase().trim();
        const idx = all.findIndex(c => c.nome.toLowerCase().trim() === k);
        if (idx >= 0) all[idx] = { ...all[idx], ...dados };
        else all.push({ nome: nome.trim(), obs: '', criadoEm: hoje(), ...dados });
        _save(KEYS.CLIENTES, all);
    },
    getByNome: (nome) =>
        Clientes.getAll().find(c => c.nome.toLowerCase().trim() === nome.toLowerCase().trim()),
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
        const registros    = Diario.getAll().filter(e => e.cliente?.toLowerCase().trim() === k);
        const agendamentos = Agenda.getAll().filter(e => e.cliente?.toLowerCase().trim() === k);
        const atend = registros.reduce((s, e) => s + (parseInt(e.qtd) || 1), 0);
        const fat   = registros.reduce((s, e) => s + (parseFloat(e.precoCobrado) || 0) * (parseInt(e.qtd) || 1), 0);
        const datas = registros.map(e => e.data).filter(Boolean).sort();
        const result = {
            qtdTotal: atend, fat,
            ticket: atend ? fat / atend : 0,
            ultimaVisita:   datas[datas.length - 1] || null,
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
    getAll:   () => _load(KEYS.CUSTOS, {}),
    getMes:   (key) => Custos.getAll()[key] || {},
    saveMes:  (key, data) => {
        // lê, escreve atomicamente — evita race condition
        const all = Custos.getAll();
        all[key] = { ...(all[key] || {}), ...data };
        _save(KEYS.CUSTOS, all);
    },
    setField: (key, field, valor) => {
        const all = Custos.getAll();
        all[key] = { ...(all[key] || {}), [field]: parseFloat(valor) || 0 };
        _save(KEYS.CUSTOS, all);
    },
    totalMes: (key) => {
        const d = Custos.getMes(key);
        const fixos = ['aluguel','condominio','energia','agua','internet',
                       'auxiliar','contabilidade','limpeza','software','marketing']
            .reduce((s, k) => s + (parseFloat(d[k]) || 0), 0);
        return fixos + (d.outros || []).reduce((s, o) => s + (parseFloat(o.valor) || 0), 0);
    }
};

export const Receitas = {
    getAll:   () => _load(KEYS.RECEITAS, {}),
    getMes:   (key) => Receitas.getAll()[key] || {},
    saveMes:  (key, data) => {
        const all = Receitas.getAll();
        all[key] = { ...(all[key] || {}), ...data };
        _save(KEYS.RECEITAS, all);
    },
    setField: (key, field, valor) => {
        const all = Receitas.getAll();
        all[key] = { ...(all[key] || {}), [field]: parseFloat(valor) || 0 };
        _save(KEYS.RECEITAS, all);
    },
    totalMes: (key) =>
        ['cadeira1','cadeira2','manicure','pedicure','outros1','outros2']
            .reduce((s, k) => s + (parseFloat(Receitas.getMes(key)[k]) || 0), 0),
    custoFixoRealMes: (key) => Math.max(0, Custos.totalMes(key) - Receitas.totalMes(key))
};

// ═══════════════════════════════════════════════════════
// SHARED RENDERERS
// ═══════════════════════════════════════════════════════
function animateCounter(el, from, to, duration = 600, formatter = v => v) {
    if (!el) return;
    const startTime = performance.now();
    const easeOut = t => 1 - Math.pow(1 - t, 3);
    const tick = (now) => {
        const progress = Math.min((now - startTime) / duration, 1);
        el.textContent = formatter(from + (to - from) * easeOut(progress));
        if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
}

function emptyState(icon, title, desc, action = '') {
    return `
        <div class="empty-state card">
            ${renderIcon(icon, { width: 48, height: 48 })}
            <h3>${title}</h3>
            <p>${desc}</p>
            ${action}
        </div>`;
}

// ═══════════════════════════════════════════════════════
// PAGE RENDERERS
// ═══════════════════════════════════════════════════════
const PAGES_RENDER = {

    // ─────────────────────────────────────────────
    // DASHBOARD
    // ─────────────────────────────────────────────
    dashboard: (container) => {
        const cfg     = Config.get();
        const now     = new Date();
        const hojeStr = hoje();
        const res     = Diario.resumoMes(now.getFullYear(), now.getMonth());

        const retencao = (() => {
            Clientes.syncFromDiarioAgenda();
            const todos  = Clientes.getAll();
            const ativos = todos.filter(c => {
                const s = Clientes.calcStats(c.nome);
                if (!s.ultimaVisita) return false;
                return (Date.now() - new Date(s.ultimaVisita + 'T12:00:00').getTime()) / 86400000 <= 30;
            });
            return { taxa: todos.length ? Math.round((ativos.length / todos.length) * 100) : 0, qtd: ativos.length, total: todos.length };
        })();

        const dismissed = localStorage.getItem('salao_onboarding_dismissed');
        const onboardingSteps = [
            { id: 'config',  label: 'Configure o nome do seu salão',  done: cfg.nomeSalao && cfg.nomeSalao !== 'Meu Salão', action: () => navigateTo('configuracoes') },
            { id: 'servico', label: 'Cadastre pelo menos um serviço',  done: Servicos.getAll().length > 0,                  action: () => navigateTo('servicos') },
            { id: 'agenda',  label: 'Crie o primeiro agendamento',      done: Agenda.getAll().length > 0,                   action: () => navigateTo('agenda') },
            { id: 'diario',  label: 'Registre o primeiro atendimento',  done: Diario.getAll().length > 0,                   action: () => navigateTo('diario') },
        ];
        const stepsFeitos  = onboardingSteps.filter(s => s.done).length;
        const showOnboard  = !dismissed && stepsFeitos < 4;

        const ultimos7 = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(); d.setDate(d.getDate() - (6 - i));
            const str = d.toISOString().slice(0, 10);
            const fat = Diario.resumoDia(str).faturamento;
            return { data: str, fat, label: d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.',''), isHoje: str === hojeStr };
        });
        const maxFat = Math.max(...ultimos7.map(d => d.fat), 1);
        const media  = ultimos7.reduce((s, d) => s + d.fat, 0) / 7;

        const amanhaList = Agenda.getAmanha();

        container.innerHTML = `
            ${showOnboard ? `
            <div class="onboarding-banner">
                <button class="onboarding-dismiss"
                        onclick="localStorage.setItem('salao_onboarding_dismissed','1');this.parentElement.remove();">✕</button>
                <h3>Configure seu salão em 4 passos</h3>
                <p>${stepsFeitos} de 4 concluídos</p>
                <div class="onboarding-progress">
                    ${onboardingSteps.map((_, i) => `<div class="onboarding-progress-bar ${i < stepsFeitos ? 'done' : ''}"></div>`).join('')}
                </div>
                <div class="onboarding-steps">
                    ${onboardingSteps.map((s, i) => `
                        <div class="onboarding-step ${s.done ? 'done' : ''}" onclick="window.__onboardingAction(${i})">
                            <div class="onboarding-step-icon">${s.done ? '✓' : (i + 1)}</div>
                            <span>${s.label}</span>
                            ${!s.done ? renderIcon('ChevronRight', { width: 16, height: 16 }) : ''}
                        </div>`).join('')}
                </div>
            </div>` : ''}

            <div class="grid">
                <div class="kpi-card">
                    <div class="kpi-label">Faturamento Mês</div>
                    <div class="kpi-value" data-kpi="faturamento">${R$(res.faturamento)}</div>
                    <div class="kpi-sub">${res.atendimentos} atendimento${res.atendimentos !== 1 ? 's' : ''}</div>
                </div>
                <div class="kpi-card" style="border-left-color:var(--success)">
                    <div class="kpi-label">Lucro Real</div>
                    <div class="kpi-value profit-${res.lucroReal >= 0 ? 'positive' : 'negative'}" data-kpi="lucro">${R$(res.lucroReal)}</div>
                    <div class="kpi-sub">Margem: ${pct(res.margem)}</div>
                </div>
                <div class="kpi-card" style="border-left-color:var(--rose)">
                    <div class="kpi-label">Ticket Médio</div>
                    <div class="kpi-value" data-kpi="ticket">${R$(res.ticket)}</div>
                    <div class="kpi-sub">Por atendimento</div>
                </div>
                <div class="kpi-card" style="border-left-color:var(--info)">
                    <div class="kpi-label">Retenção 30 dias</div>
                    <div class="kpi-value" data-kpi="retencao">${retencao.taxa}%</div>
                    <div class="kpi-sub">${retencao.qtd} de ${retencao.total} clientes</div>
                </div>
            </div>

            <div class="card">
                <h3 style="color:var(--plum);margin-bottom:16px;font-size:0.88rem;text-transform:uppercase;letter-spacing:1px;">Últimos 7 dias</h3>
                <svg width="100%" viewBox="0 0 420 120" style="overflow:visible;">
                    <line x1="0" y1="${100 - (media / maxFat) * 80}" x2="420" y2="${100 - (media / maxFat) * 80}"
                          stroke="var(--mauve)" stroke-width="1" stroke-dasharray="4 4"/>
                    ${ultimos7.map((d, i) => {
                        const barH = Math.max(4, (d.fat / maxFat) * 80);
                        const x    = 10 + i * 58;
                        const y    = 100 - barH;
                        const col  = d.isHoje ? 'var(--plum)' : d.fat >= media ? 'var(--success)' : 'var(--mauve)';
                        return `<g>
                            <rect x="${x}" y="${y}" width="44" height="${barH}" rx="5"
                                  fill="${col}" opacity="${d.isHoje ? 1 : 0.75}"/>
                            <text x="${x + 22}" y="116" text-anchor="middle"
                                  style="font-size:10px;fill:var(--txt-muted);">${d.label}</text>
                            ${d.fat > 0 ? `<title>${d.data}: ${R$(d.fat)}</title>` : ''}
                        </g>`;
                    }).join('')}
                </svg>
                <div style="display:flex;gap:16px;margin-top:10px;font-size:0.75rem;color:var(--txt-muted);">
                    <span>— média ${R$(media)}</span>
                    <span style="color:var(--plum)">■ hoje</span>
                    <span style="color:var(--success)">■ acima da média</span>
                </div>
            </div>

            ${amanhaList.length ? `
            <div class="card" style="border-left:4px solid var(--rose);">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                    <h3 style="color:var(--plum);font-size:0.95rem;display:flex;align-items:center;gap:8px;">
                        ${renderIcon('Calendar', { width: 18, height: 18 })}
                        Amanhã — ${amanhaList.length} agendamento${amanhaList.length !== 1 ? 's' : ''}
                    </h3>
                    ${amanhaList.filter(a => a.telefone).length > 0 ? `
                    <button class="btn btn-sm btn-primary" onclick="window.confirmarLoteWA()">
                        ${renderIcon('MessageCircle', { width: 14, height: 14 })} Confirmar todos
                    </button>` : ''}
                </div>
                <div style="display:flex;flex-direction:column;gap:8px;">
                    ${amanhaList.map(a => `
                    <div style="display:flex;align-items:center;gap:12px;padding:10px 12px;
                                background:var(--bg-soft);border-radius:8px;">
                        <span style="font-weight:700;color:var(--plum);min-width:56px;">${a.horario}</span>
                        <span style="flex:1;font-weight:600;">${a.cliente}</span>
                        <span style="font-size:0.8rem;color:var(--txt-muted);">${a.servicoNome || ''}</span>
                        ${a.telefone ? `
                        <a href="${linkWA(a.telefone, `Olá ${a.cliente}, tudo bem? Confirmando seu horário amanhã às ${a.horario}.`)}"
                           target="_blank" class="wa-link" title="Confirmar">
                            ${renderIcon('MessageCircle', { width: 14, height: 14 })}
                        </a>` : ''}
                    </div>`).join('')}
                </div>
            </div>` : ''}
        `;

        window.__onboardingAction = (idx) => onboardingSteps[idx]?.action();

        window.confirmarLoteWA = () => {
            const com = Agenda.getAmanha().filter(a => a.telefone);
            if (!com.length) { toast('Nenhum agendamento com telefone.', 'warning'); return; }
            let idx = 0;
            const abrir = () => {
                if (idx >= com.length) { toast(`${com.length} mensagens abertas!`, 'success'); return; }
                const a = com[idx];
                const url = linkWA(a.telefone, `Olá ${a.cliente}! Confirmando seu horário amanhã às ${a.horario}. Pode confirmar?`);
                if (url) window.open(url, '_blank');
                idx++; setTimeout(abrir, 800);
            };
            toast(`Abrindo ${com.length} conversas…`, 'default', 5000);
            abrir();
        };

        // Animar KPIs
        setTimeout(() => {
            const kpis = [
                ['faturamento', res.faturamento, R$],
                ['lucro',       res.lucroReal,   R$],
                ['ticket',      res.ticket,      R$],
                ['retencao',    retencao.taxa,   v => `${Math.round(v)}%`],
            ];
            kpis.forEach(([key, val, fmt]) => {
                const el = container.querySelector(`[data-kpi="${key}"]`);
                if (el) animateCounter(el, 0, val, 700, fmt);
            });
        }, 50);
    },

    // ─────────────────────────────────────────────
    // AGENDA
    // ─────────────────────────────────────────────
    agenda: (container) => {
        const cfg  = Config.get();
        const svcs = Servicos.getAll();

        const renderList = () => {
            const entries = Agenda.getAll().sort((a, b) =>
                (b.data + (b.horario || '')).localeCompare(a.data + (a.horario || '')));

            if (!entries.length) return emptyState('Calendar', 'Nenhum agendamento',
                'Clique em "Novo" para criar o primeiro agendamento.',
                `<button class="btn btn-primary" onclick="window.__openForm('Novo Agendamento',document.getElementById('tpl-agenda-form').innerHTML)">
                    ${renderIcon('Plus', { width: 14, height: 14 })} Novo agendamento</button>`);

            return entries.map(e => `
                <div class="agenda-card status-${e.status || 'agendado'}">
                    <div class="agenda-card-time">${e.horario || '--:--'}</div>
                    <div class="agenda-card-info">
                        <div class="agenda-card-cliente">${e.cliente}</div>
                        <div class="agenda-card-servico">${fmtData(e.data)} · ${e.servicoNome || 'Sem serviço'}</div>
                    </div>
                    <div class="agenda-card-actions">
                        <select onchange="Agenda.update(${e.id},{status:this.value});renderPage('agenda',document.getElementById('page-agenda'));"
                                class="status-badge status-${e.status || 'agendado'}"
                                style="border:none;cursor:pointer;background:transparent;padding:3px 8px;font-size:0.72rem;font-weight:600;">
                            <option value="agendado"   ${e.status==='agendado'  ?'selected':''}>Agendado</option>
                            <option value="confirmado" ${e.status==='confirmado'?'selected':''}>Confirmado</option>
                            <option value="realizado"  ${e.status==='realizado' ?'selected':''}>Realizado</option>
                            <option value="cancelado"  ${e.status==='cancelado' ?'selected':''}>Cancelado</option>
                        </select>
                        ${e.telefone ? `
                        <a href="${linkWA(e.telefone, `Olá ${e.cliente}! Confirmando seu horário em ${fmtData(e.data)} às ${e.horario}.`)}"
                           target="_blank" class="wa-link" style="width:28px;height:28px;">
                            ${renderIcon('MessageCircle', { width: 13, height: 13 })}
                        </a>` : ''}
                        <button onclick="window.__confirmDelete('Remover agendamento de ${e.cliente}?',()=>{Agenda.remove(${e.id});renderPage('agenda',document.getElementById('page-agenda'));})"
                                class="btn btn-sm btn-danger">
                            ${renderIcon('Trash2', { width: 13, height: 13 })}
                        </button>
                    </div>
                </div>`).join('');
        };

        container.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
                <div>
                    <h2>Agenda</h2>
                    <div style="font-size:0.83rem;color:var(--txt-muted);">${Agenda.getAll().length} agendamentos</div>
                </div>
                <button class="btn btn-primary"
                        onclick="window.__openForm('Novo Agendamento',document.getElementById('tpl-agenda-form').innerHTML)">
                    ${renderIcon('Plus', { width: 16, height: 16 })} Novo
                </button>
            </div>
            <div id="agenda-list">${renderList()}</div>

            <template id="tpl-agenda-form">
                <div class="form-row">
                    <div class="form-group">
                        <label>Data <span style="color:var(--danger)">*</span></label>
                        <input type="date" id="ag-data" value="${hoje()}">
                    </div>
                    <div class="form-group">
                        <label>Horário <span style="color:var(--danger)">*</span></label>
                        <input type="time" id="ag-hora" value="09:00">
                    </div>
                </div>
                <div class="form-group">
                    <label>Cliente <span style="color:var(--danger)">*</span></label>
                    <input type="text" id="ag-cliente" placeholder="Nome da cliente">
                </div>
                <div class="form-group">
                    <label>Telefone / WhatsApp</label>
                    <input type="tel" id="ag-tel" placeholder="(00) 00000-0000">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Serviço</label>
                        <select id="ag-servico">
                            <option value="">Selecione…</option>
                            ${svcs.map(s => `<option value="${s.id}" data-nome="${s.nome}">${s.nome}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Profissional</label>
                        <select id="ag-prof">
                            ${cfg.profissionais.map(p => `<option value="${p}">${p}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="modal-footer" style="padding:0;margin-top:12px;">
                    <button class="btn btn-secondary" onclick="window.__closeForm()">Cancelar</button>
                    <button class="btn btn-primary" onclick="window.__saveAgenda()">Salvar</button>
                </div>
            </template>
        `;

        window.__saveAgenda = () => {
            if (!validate([
                { id: 'ag-cliente', label: 'Cliente', required: true },
                { id: 'ag-data',    label: 'Data',    required: true },
                { id: 'ag-hora',    label: 'Horário', required: true },
            ])) return;
            const s = document.getElementById('ag-servico');
            Agenda.add({
                data:       document.getElementById('ag-data').value,
                horario:    document.getElementById('ag-hora').value,
                cliente:    document.getElementById('ag-cliente').value.trim(),
                telefone:   document.getElementById('ag-tel').value,
                servicoId:  s.value,
                servicoNome: s.options[s.selectedIndex]?.dataset.nome || '',
                profissional: document.getElementById('ag-prof')?.value || '',
                status: 'agendado',
            });
            window.__closeForm();
            renderPage('agenda', document.getElementById('page-agenda'));
            toast('Agendamento criado!', 'success');
        };

        window.Agenda = Agenda;
    },

    // ─────────────────────────────────────────────
    // DIÁRIO / CAIXA
    // ─────────────────────────────────────────────
    diario: (container) => {
        const cfg     = Config.get();
        const svcs    = Servicos.getAll();
        const prods   = Produtos.getAll();
        const hojeStr = hoje();
        const res     = Diario.resumoDia(hojeStr); // usa a função centralizada

        const renderTabela = () => {
            if (!res.entries.length) return `
                <div class="empty-state" style="padding:40px 24px;">
                    ${renderIcon('DollarSign', { width: 40, height: 40 })}
                    <p>Nenhum lançamento hoje</p>
                </div>`;

            return `<div class="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Hr</th><th>Cliente</th><th>Item</th>
                            <th class="td-center">Qtd</th>
                            <th class="td-right">Valor</th>
                            <th class="td-right">Custo</th>
                            <th class="td-right">Comissão</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        ${res.entries.map(e => {
                            const qtd  = parseInt(e.qtd) || 1;
                            const fat  = (parseFloat(e.precoCobrado) || 0) * qtd;
                            const custo = (parseFloat(e.custoTotal) || 0) * qtd;
                            const com  = (parseFloat(e.comissaoValor) || 0) * qtd;
                            return `<tr>
                                <td>${e.horario || '-'}</td>
                                <td class="fw-600">${e.cliente}</td>
                                <td><span class="badge">${e.servicoNome || e.produtoNome || '-'}</span></td>
                                <td class="td-center">${qtd}</td>
                                <td class="td-right fw-600">${R$(fat)}</td>
                                <td class="td-right text-muted">${custo > 0 ? R$(custo) : '-'}</td>
                                <td class="td-right text-muted">${com > 0 ? R$(com) : '-'}</td>
                                <td>
                                    <button onclick="window.__confirmDelete('Remover lançamento de ${e.cliente}?',()=>{Diario.remove(${e.id});renderPage('diario',document.getElementById('page-diario'));})"
                                            class="btn btn-xs btn-danger">
                                        ${renderIcon('Trash2', { width: 12, height: 12 })}
                                    </button>
                                </td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>`;
        };

        container.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
                <div>
                    <h2>Diário / Caixa</h2>
                    <div style="font-size:0.83rem;color:var(--txt-muted);">${fmtData(hojeStr)}</div>
                </div>
                <button class="btn btn-primary"
                        onclick="window.__openForm('Novo Lançamento',document.getElementById('tpl-diario-form').innerHTML);
                                 setTimeout(()=>{ applyMoneyMask(document.getElementById('dv-valor'));
                                                  applyMoneyMask(document.getElementById('dv-comissao')); },100)">
                    ${renderIcon('Plus', { width: 16, height: 16 })} Novo Lançamento
                </button>
            </div>

            <div style="display:grid;grid-template-columns:2fr 1fr;gap:20px;">
                <div>${renderTabela()}</div>
                <div>
                    <div class="card">
                        <div class="card-title">Resumo do Dia</div>
                        <div class="summary-row">
                            <span class="label">Faturamento</span>
                            <span class="value profit-positive">${R$(res.faturamento)}</span>
                        </div>
                        <div class="summary-row">
                            <span class="label">Custo produtos/serv.</span>
                            <span class="value">${R$(res.custoTotal)}</span>
                        </div>
                        <div class="summary-row">
                            <span class="label">Comissões</span>
                            <span class="value">${R$(res.comissaoTotal)}</span>
                        </div>
                        <div class="summary-row" style="border-top:2px solid var(--mauve);padding-top:12px;margin-top:4px;">
                            <span class="label fw-600">Lucro Real</span>
                            <span class="value fw-700 profit-${res.lucroReal >= 0 ? 'positive' : 'negative'}">${R$(res.lucroReal)}</span>
                        </div>
                        <div class="summary-row">
                            <span class="label">Atendimentos</span>
                            <span class="value">${res.atendimentos}</span>
                        </div>
                    </div>
                </div>
            </div>

            <template id="tpl-diario-form">
                <div class="form-group">
                    <label>Cliente <span style="color:var(--danger)">*</span></label>
                    <input type="text" id="dv-cliente" placeholder="Nome da cliente">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Tipo</label>
                        <select id="dv-tipo" onchange="
                            const t=this.value;
                            document.getElementById('sel-servico').style.display=t==='servico'?'block':'none';
                            document.getElementById('sel-produto').style.display=t==='produto'?'block':'none';
                        ">
                            <option value="servico">Serviço</option>
                            <option value="produto">Produto</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Quantidade</label>
                        <input type="number" id="dv-qtd" value="1" min="1">
                    </div>
                </div>
                <div class="form-group" id="sel-servico">
                    <label>Serviço</label>
                    <select id="dv-servico" onchange="
                        const s=Servicos.byId(this.value);
                        if(s){
                            const v=s.precoIdeal||s.preco||0;
                            document.getElementById('dv-valor').value=Number(v).toLocaleString('pt-BR',{minimumFractionDigits:2});
                            document.getElementById('dv-valor').dataset.rawValue=v;
                        }">
                        <option value="">Selecione…</option>
                        ${svcs.map(s => `<option value="${s.id}">${s.nome} — ${R$(s.precoIdeal || s.preco)}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group" id="sel-produto" style="display:none;">
                    <label>Produto</label>
                    <select id="dv-produto" onchange="
                        const p=Produtos.byId(this.value);
                        if(p){
                            const v=p.precoVenda||0;
                            document.getElementById('dv-valor').value=Number(v).toLocaleString('pt-BR',{minimumFractionDigits:2});
                            document.getElementById('dv-valor').dataset.rawValue=v;
                        }">
                        <option value="">Selecione…</option>
                        ${prods.map(p => `<option value="${p.id}">${p.nome} — ${R$(p.precoVenda)} (estoque: ${p.estoque})</option>`).join('')}
                    </select>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Valor cobrado <span style="color:var(--danger)">*</span></label>
                        <div class="input-prefix"><span>R$</span><input type="text" id="dv-valor" data-money placeholder="0,00"></div>
                    </div>
                    <div class="form-group">
                        <label>Comissão (R$)</label>
                        <div class="input-prefix"><span>R$</span><input type="text" id="dv-comissao" data-money placeholder="0,00"></div>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Profissional</label>
                        <select id="dv-prof">
                            ${cfg.profissionais.map(p => `<option value="${p}">${p}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Forma de Pagamento</label>
                        <select id="dv-pgto">
                            ${cfg.formasPagamento.map(f => `<option value="${f}">${f}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="modal-footer" style="padding:0;margin-top:12px;">
                    <button class="btn btn-secondary" onclick="window.__closeForm()">Cancelar</button>
                    <button class="btn btn-primary" onclick="window.__saveDiario()">Salvar</button>
                </div>
            </template>
        `;

        window.__saveDiario = () => {
            if (!validate([
                { id: 'dv-cliente', label: 'Cliente', required: true },
                { id: 'dv-valor',   label: 'Valor',   required: true },
            ])) return;

            const tipo  = document.getElementById('dv-tipo').value;
            const isServ = tipo === 'servico';
            const itemId = isServ ? document.getElementById('dv-servico').value
                                  : document.getElementById('dv-produto').value;
            const item   = isServ ? Servicos.byId(itemId) : Produtos.byId(itemId);
            const qtd    = parseInt(document.getElementById('dv-qtd').value) || 1;
            const preco  = getRaw('dv-valor');
            const comissao = getRaw('dv-comissao');

            if (preco <= 0) { toast('Informe um valor maior que zero.', 'warning'); return; }

            Diario.add({
                data:          hojeStr,
                horario:       new Date().toTimeString().slice(0, 5),
                cliente:       document.getElementById('dv-cliente').value.trim(),
                tipo,
                qtd,
                servicoId:    isServ ? item?.id : null,
                servicoNome:  isServ ? item?.nome : null,
                produtoId:    !isServ ? item?.id : null,
                produtoNome:  !isServ ? item?.nome : null,
                precoCobrado: preco,
                comissaoValor: comissao,
                profissional:  document.getElementById('dv-prof').value,
                formaPagamento: document.getElementById('dv-pgto').value,
                custoTotal:    isServ
                    ? (parseFloat(item?.custoTotal) || 0)
                    : (parseFloat(item?.custoProd)  || 0),
            });

            if (!isServ && item) Produtos.baixarEstoque(item.id, qtd);

            window.__closeForm();
            renderPage('diario', document.getElementById('page-diario'));
            toast('Lançamento salvo!', 'success');
        };

        window.Diario   = Diario;
        window.Servicos = Servicos;
        window.Produtos = Produtos;
    },

    // ─────────────────────────────────────────────
    // SERVIÇOS & PRODUTOS
    // ─────────────────────────────────────────────
    servicos: (container) => {
        const svcs  = Servicos.getAll();
        const prods = Produtos.getAll();

        container.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
                <h2>Catálogo</h2>
                <div style="display:flex;gap:10px;">
                    <button class="btn btn-primary"
                            onclick="window.__openForm('Novo Serviço',document.getElementById('tpl-svc-form').innerHTML)">
                        ${renderIcon('Plus', { width: 14, height: 14 })} Serviço
                    </button>
                    <button class="btn btn-secondary"
                            onclick="window.__openForm('Novo Produto',document.getElementById('tpl-prod-form').innerHTML)">
                        ${renderIcon('Package', { width: 14, height: 14 })} Produto
                    </button>
                </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">
                <div>
                    <div style="font-size:0.83rem;text-transform:uppercase;letter-spacing:1px;
                                color:var(--txt-muted);margin-bottom:12px;">
                        Serviços (${svcs.length})
                    </div>
                    ${svcs.length ? svcs.map(s => `
                        <div class="card" style="display:flex;justify-content:space-between;
                                                 align-items:center;padding:1rem 1.25rem;margin-bottom:10px;">
                            <div>
                                <div class="fw-600">${s.nome}</div>
                                <div style="font-size:0.8rem;color:var(--txt-muted);">${s.categoria || 'Serviço'}</div>
                            </div>
                            <div style="text-align:right;">
                                <div class="fw-700 profit-positive">${R$(s.precoIdeal || s.preco)}</div>
                                ${s.custoTotal > 0 ? `<div style="font-size:0.75rem;color:var(--txt-muted);">Custo: ${R$(s.custoTotal)}</div>` : ''}
                                <button onclick="window.__confirmDelete('Remover ${s.nome}?',()=>{Servicos.remove(${s.id});renderPage('servicos',document.getElementById('page-servicos'));})"
                                        class="btn btn-xs btn-danger" style="margin-top:6px;">
                                    ${renderIcon('Trash2', { width: 12, height: 12 })}
                                </button>
                            </div>
                        </div>`).join('')
                    : emptyState('Scissors', 'Nenhum serviço', 'Adicione serviços para usar no caixa.')}
                </div>
                <div>
                    <div style="font-size:0.83rem;text-transform:uppercase;letter-spacing:1px;
                                color:var(--txt-muted);margin-bottom:12px;">
                        Produtos / Estoque (${prods.length})
                    </div>
                    ${prods.length ? prods.map(p => {
                        const baixo = (p.estoque || 0) <= (p.estoqueMin || 2);
                        return `<div class="card" style="display:flex;justify-content:space-between;
                                            align-items:center;padding:1rem 1.25rem;margin-bottom:10px;
                                            ${baixo ? 'border:2px solid var(--danger);' : ''}">
                            <div>
                                <div class="fw-600">${p.nome}</div>
                                <div style="font-size:0.8rem;color:${baixo ? 'var(--danger)' : 'var(--txt-muted)'};">
                                    ${baixo ? '⚠ ' : ''}Estoque: <b>${p.estoque || 0}</b> un
                                </div>
                            </div>
                            <div style="text-align:right;">
                                <div class="fw-700">${R$(p.precoVenda)}</div>
                                <button onclick="window.__confirmDelete('Remover ${p.nome}?',()=>{Produtos.remove(${p.id});renderPage('servicos',document.getElementById('page-servicos'));})"
                                        class="btn btn-xs btn-danger" style="margin-top:6px;">
                                    ${renderIcon('Trash2', { width: 12, height: 12 })}
                                </button>
                            </div>
                        </div>`;
                    }).join('') : emptyState('Package', 'Nenhum produto', 'Cadastre produtos para controlar estoque.')}
                </div>
            </div>

            <template id="tpl-svc-form">
                <div class="form-row">
                    <div class="form-group">
                        <label>Nome <span style="color:var(--danger)">*</span></label>
                        <input type="text" id="s-nome" placeholder="Ex: Corte feminino">
                    </div>
                    <div class="form-group">
                        <label>Categoria</label>
                        <input type="text" id="s-cat" placeholder="Ex: Cabelo">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Preço Ideal (R$)</label>
                        <input type="number" id="s-preco" step="0.01" placeholder="0,00">
                    </div>
                    <div class="form-group">
                        <label>Custo Estimado (R$)</label>
                        <input type="number" id="s-custo" step="0.01" placeholder="0,00">
                    </div>
                </div>
                <div class="modal-footer" style="padding:0;margin-top:12px;">
                    <button class="btn btn-secondary" onclick="window.__closeForm()">Cancelar</button>
                    <button class="btn btn-primary" onclick="
                        if(!validate([{id:'s-nome',label:'Nome',required:true}])) return;
                        Servicos.add({ nome:document.getElementById('s-nome').value.trim(),
                                       categoria:document.getElementById('s-cat').value,
                                       precoIdeal:parseFloat(document.getElementById('s-preco').value)||0,
                                       custoTotal:parseFloat(document.getElementById('s-custo').value)||0 });
                        window.__closeForm();
                        renderPage('servicos',document.getElementById('page-servicos'));
                        toast('Serviço cadastrado!','success');
                    ">Salvar</button>
                </div>
            </template>

            <template id="tpl-prod-form">
                <div class="form-group">
                    <label>Nome <span style="color:var(--danger)">*</span></label>
                    <input type="text" id="p-nome" placeholder="Ex: Shampoo profissional">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Custo (R$)</label>
                        <input type="number" id="p-custo" step="0.01">
                    </div>
                    <div class="form-group">
                        <label>Preço Venda (R$)</label>
                        <input type="number" id="p-preco" step="0.01">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Estoque inicial</label>
                        <input type="number" id="p-estoque" value="0">
                    </div>
                    <div class="form-group">
                        <label>Estoque mínimo</label>
                        <input type="number" id="p-min" value="2">
                    </div>
                </div>
                <div class="modal-footer" style="padding:0;margin-top:12px;">
                    <button class="btn btn-secondary" onclick="window.__closeForm()">Cancelar</button>
                    <button class="btn btn-primary" onclick="
                        if(!validate([{id:'p-nome',label:'Nome',required:true}])) return;
                        Produtos.add({ nome:document.getElementById('p-nome').value.trim(),
                                       custoProd:parseFloat(document.getElementById('p-custo').value)||0,
                                       precoVenda:parseFloat(document.getElementById('p-preco').value)||0,
                                       estoque:parseInt(document.getElementById('p-estoque').value)||0,
                                       estoqueMin:parseInt(document.getElementById('p-min').value)||2 });
                        window.__closeForm();
                        renderPage('servicos',document.getElementById('page-servicos'));
                        toast('Produto cadastrado!','success');
                    ">Salvar</button>
                </div>
            </template>
        `;

        window.Servicos = Servicos;
        window.Produtos = Produtos;
    },

    // ─────────────────────────────────────────────
    // CLIENTES
    // ─────────────────────────────────────────────
    clientes: (container) => {
        Clientes.syncFromDiarioAgenda();
        const clientes = Clientes.getAll();

        const calcSeg = (stats) => {
            if (!stats.ultimaVisita) return { label: 'Nova', cls: 'badge-info' };
            const dias = Math.floor((Date.now() - new Date(stats.ultimaVisita + 'T12:00:00').getTime()) / 86400000);
            if (dias > 90) return { label: 'Inativa', cls: 'badge-danger' };
            if (dias >= 31) return { label: 'Ausente', cls: 'badge-warning' };
            if (stats.qtdTotal >= 5) return { label: 'Fiel', cls: 'badge-success' };
            return { label: 'Regular', cls: '' };
        };

        container.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
                <div>
                    <h2>CRM de Clientes</h2>
                    <div style="font-size:0.83rem;color:var(--txt-muted);">${clientes.length} cadastros</div>
                </div>
            </div>

            ${!clientes.length ? emptyState('Users', 'Nenhum cliente', 'Clientes são criados automaticamente ao lançar no diário ou agendar.') : `
            <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(280px,1fr));">
                ${clientes.map(c => {
                    const stats = Clientes.calcStats(c.nome);
                    const seg   = calcSeg(stats);
                    return `
                    <div class="card" style="position:relative;margin-bottom:0;">
                        <span class="badge ${seg.cls}" style="position:absolute;top:12px;right:12px;">
                            ${seg.label}
                        </span>
                        <h3 style="margin-bottom:12px;padding-right:70px;">${c.nome}</h3>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:0.85rem;margin-bottom:12px;">
                            <div>
                                <div style="font-size:0.72rem;color:var(--txt-muted);">Visitas</div>
                                <div class="fw-600">${stats.qtdTotal}</div>
                            </div>
                            <div>
                                <div style="font-size:0.72rem;color:var(--txt-muted);">Ticket Médio</div>
                                <div class="fw-600">${R$(stats.ticket)}</div>
                            </div>
                            <div>
                                <div style="font-size:0.72rem;color:var(--txt-muted);">Última Visita</div>
                                <div class="fw-600">${fmtData(stats.ultimaVisita)}</div>
                            </div>
                            <div>
                                <div style="font-size:0.72rem;color:var(--txt-muted);">Total Gasto</div>
                                <div class="fw-600 profit-positive">${R$(stats.fat)}</div>
                            </div>
                        </div>
                        ${c.telefone ? `
                        <a href="${linkWA(c.telefone, `Olá ${c.nome}!`)}" target="_blank"
                           class="wa-link" style="width:100%;border-radius:8px;">
                            ${renderIcon('MessageCircle', { width: 14, height: 14 })} Enviar mensagem
                        </a>` : ''}
                    </div>`;
                }).join('')}
            </div>`}
        `;

        window.Clientes = Clientes;
    },

    // ─────────────────────────────────────────────
    // CUSTOS FIXOS
    // ─────────────────────────────────────────────
    custos: (container) => {
        const cfg  = Config.get();
        const now  = new Date();
        const key  = mesKey(cfg.ano, now.getMonth());
        const data = Custos.getMes(key);
        const total = Custos.totalMes(key);

        const campos = [
            { k: 'aluguel',       label: 'Aluguel' },
            { k: 'condominio',    label: 'Condomínio' },
            { k: 'energia',       label: 'Energia Elétrica' },
            { k: 'agua',          label: 'Água' },
            { k: 'internet',      label: 'Internet' },
            { k: 'auxiliar',      label: 'Auxiliar / Funcionário' },
            { k: 'limpeza',       label: 'Limpeza' },
            { k: 'contabilidade', label: 'Contabilidade' },
            { k: 'software',      label: 'Software / Assinaturas' },
            { k: 'marketing',     label: 'Marketing' },
        ];

        container.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
                <div>
                    <h2>Custos Fixos</h2>
                    <div style="font-size:0.83rem;color:var(--txt-muted);">Mês atual</div>
                </div>
                <div class="badge badge-danger" style="font-size:1rem;padding:8px 18px;">${R$(total)}</div>
            </div>

            <div class="card">
                <div class="form-row-3">
                    ${campos.map(({ k, label }) => `
                    <div class="form-group">
                        <label>${label}</label>
                        <div class="input-prefix">
                            <span>R$</span>
                            <input type="number" id="cf-${k}" value="${data[k] || ''}" step="0.01"
                                   placeholder="0,00"
                                   onchange="Custos.setField('${key}','${k}',this.value);
                                             document.getElementById('cf-total').textContent=
                                             Number(Custos.totalMes('${key}')).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});">
                        </div>
                    </div>`).join('')}
                </div>
                <div style="margin-top:20px;padding-top:20px;border-top:2px solid var(--mauve);
                            display:flex;justify-content:space-between;align-items:center;">
                    <span style="color:var(--txt-muted);font-size:0.88rem;">Total mensal</span>
                    <span id="cf-total" style="font-size:1.6rem;font-weight:700;color:var(--danger);">
                        ${R$(total)}
                    </span>
                </div>
            </div>
        `;

        window.Custos = Custos;
    },

    // ─────────────────────────────────────────────
    // RECEITAS
    // ─────────────────────────────────────────────
    receitas: (container) => {
        const cfg   = Config.get();
        const now   = new Date();
        const key   = mesKey(cfg.ano, now.getMonth());
        const data  = Receitas.getMes(key);
        const total = Receitas.totalMes(key);
        const cfReal = Receitas.custoFixoRealMes(key);

        const campos = [
            { k: 'cadeira1', label: 'Cadeira 1' },
            { k: 'cadeira2', label: 'Cadeira 2' },
            { k: 'manicure', label: 'Manicure' },
            { k: 'pedicure', label: 'Pedicure' },
            { k: 'outros1',  label: 'Outros 1' },
            { k: 'outros2',  label: 'Outros 2' },
        ];

        container.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
                <div>
                    <h2>Receitas do Espaço</h2>
                    <div style="font-size:0.83rem;color:var(--txt-muted);">Repasses de cadeiras/estações</div>
                </div>
                <div style="text-align:right;">
                    <div style="font-size:0.78rem;color:var(--txt-muted);">Custo Fixo Real</div>
                    <div style="font-size:1.4rem;font-weight:700;
                                color:${cfReal > 0 ? 'var(--danger)' : 'var(--success)'};" id="rc-cfreal">
                        ${R$(cfReal)}
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="form-row-3">
                    ${campos.map(({ k, label }) => `
                    <div class="form-group">
                        <label>${label}</label>
                        <div class="input-prefix">
                            <span>R$</span>
                            <input type="number" id="rc-${k}" value="${data[k] || ''}" step="0.01"
                                   placeholder="0,00"
                                   onchange="Receitas.setField('${key}','${k}',this.value);
                                             const t=Receitas.totalMes('${key}');
                                             document.getElementById('rc-total').textContent=
                                               Number(t).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
                                             const cf=Receitas.custoFixoRealMes('${key}');
                                             const el=document.getElementById('rc-cfreal');
                                             el.textContent=Number(cf).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
                                             el.style.color=cf>0?'var(--danger)':'var(--success)';">
                        </div>
                    </div>`).join('')}
                </div>
                <div style="margin-top:20px;padding-top:20px;border-top:2px solid var(--mauve);
                            display:flex;justify-content:space-between;align-items:center;">
                    <span style="color:var(--txt-muted);font-size:0.88rem;">Total em repasses</span>
                    <span id="rc-total" style="font-size:1.6rem;font-weight:700;color:var(--success);">
                        ${R$(total)}
                    </span>
                </div>
            </div>
        `;

        window.Receitas = Receitas;
        window.Custos   = Custos;
    },

    // ─────────────────────────────────────────────
    // CONTROLE ANUAL
    // ─────────────────────────────────────────────
    controle: (container) => {
        const cfg   = Config.get();
        const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
        const dados = meses.map((m, i) => ({ mes: m, ...Diario.resumoMes(cfg.ano, i) }));
        const totFat = dados.reduce((s, d) => s + d.faturamento, 0);
        const totLucro = dados.reduce((s, d) => s + d.lucroReal, 0);
        const maxFat = Math.max(...dados.map(d => d.faturamento), 1);

        container.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
                <h2>Controle Anual ${cfg.ano}</h2>
                <div style="display:flex;gap:16px;">
                    <div style="text-align:right;">
                        <div style="font-size:0.72rem;color:var(--txt-muted);">Total ano</div>
                        <div class="fw-700 profit-positive">${R$(totFat)}</div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:0.72rem;color:var(--txt-muted);">Lucro total</div>
                        <div class="fw-700 profit-${totLucro >= 0 ? 'positive' : 'negative'}">${R$(totLucro)}</div>
                    </div>
                </div>
            </div>

            <div class="card" style="margin-bottom:20px;">
                <div style="display:flex;align-items:flex-end;justify-content:space-between;
                            height:160px;padding:12px 0;gap:6px;">
                    ${dados.map(d => {
                        const h = (d.faturamento / maxFat) * 100;
                        return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;">
                            <div style="width:100%;height:${Math.max(h, 2)}px;
                                        background:linear-gradient(180deg,var(--plum),var(--rose));
                                        border-radius:4px 4px 0 0;min-height:2px;"></div>
                            <span style="font-size:0.68rem;color:var(--txt-muted);">${d.mes}</span>
                        </div>`;
                    }).join('')}
                </div>
            </div>

            <div class="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Mês</th>
                            <th class="td-center">Atend.</th>
                            <th class="td-right">Faturamento</th>
                            <th class="td-right">Custo</th>
                            <th class="td-right">Comissão</th>
                            <th class="td-right">Lucro Real</th>
                            <th class="td-right">Margem</th>
                            <th class="td-right">Ticket</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${dados.map(d => `
                        <tr>
                            <td class="fw-600">${d.mes}</td>
                            <td class="td-center">${d.atendimentos || '-'}</td>
                            <td class="td-right profit-positive fw-600">${d.faturamento ? R$(d.faturamento) : '-'}</td>
                            <td class="td-right text-muted">${d.custoTotal ? R$(d.custoTotal) : '-'}</td>
                            <td class="td-right text-muted">${d.comissaoTotal ? R$(d.comissaoTotal) : '-'}</td>
                            <td class="td-right fw-600 profit-${(d.lucroReal||0) >= 0 ? 'positive' : 'negative'}">
                                ${d.lucroReal ? R$(d.lucroReal) : '-'}
                            </td>
                            <td class="td-right">${d.faturamento ? pct(d.margem) : '-'}</td>
                            <td class="td-right">${d.ticket ? R$(d.ticket) : '-'}</td>
                        </tr>`).join('')}
                        <tr style="background:var(--lavender);font-weight:700;">
                            <td>Total</td>
                            <td class="td-center">${dados.reduce((s,d)=>s+d.atendimentos,0)}</td>
                            <td class="td-right profit-positive">${R$(totFat)}</td>
                            <td class="td-right">${R$(dados.reduce((s,d)=>s+d.custoTotal,0))}</td>
                            <td class="td-right">${R$(dados.reduce((s,d)=>s+d.comissaoTotal,0))}</td>
                            <td class="td-right profit-${totLucro>=0?'positive':'negative'}">${R$(totLucro)}</td>
                            <td class="td-right">${totFat ? pct(totLucro/totFat) : '-'}</td>
                            <td class="td-right">${R$(totFat && dados.reduce((s,d)=>s+d.atendimentos,0) ? totFat/dados.reduce((s,d)=>s+d.atendimentos,0) : 0)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    },

    // ─────────────────────────────────────────────
    // RELATÓRIO MENSAL ← página que faltava
    // ─────────────────────────────────────────────
    relatorio: (container) => {
        const cfg  = Config.get();
        const now  = new Date();
        let anoSel = now.getFullYear();
        let mesSel = now.getMonth();

        const mesesNomes = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                            'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

        const render = () => {
            const key  = mesKey(anoSel, mesSel);
            const res  = Diario.resumoMes(anoSel, mesSel);
            const custosMes    = Custos.totalMes(key);
            const receitasMes  = Receitas.totalMes(key);
            const cfReal       = Math.max(0, custosMes - receitasMes);
            const lucroBruto   = res.faturamento - res.custoTotal - res.comissaoTotal;
            const lucroLiquido = lucroBruto - cfReal;
            const margemBruta  = res.faturamento ? lucroBruto / res.faturamento : 0;
            const margemLiq    = res.faturamento ? lucroLiquido / res.faturamento : 0;

            // Top serviços do mês
            const svcsCount = {};
            res.entries.forEach(e => {
                const nome = e.servicoNome || e.produtoNome || 'Outros';
                svcsCount[nome] = (svcsCount[nome] || 0) + ((parseFloat(e.precoCobrado)||0) * (parseInt(e.qtd)||1));
            });
            const topSvcs = Object.entries(svcsCount)
                .sort((a, b) => b[1] - a[1]).slice(0, 5);

            // Formas de pagamento
            const pgtos = {};
            res.entries.forEach(e => {
                const fp = e.formaPagamento || 'Não informado';
                pgtos[fp] = (pgtos[fp] || 0) + ((parseFloat(e.precoCobrado)||0) * (parseInt(e.qtd)||1));
            });

            document.getElementById('relatorio-body').innerHTML = `
                <div class="grid" style="margin-bottom:20px;">
                    <div class="kpi-card">
                        <div class="kpi-label">Faturamento</div>
                        <div class="kpi-value profit-positive">${R$(res.faturamento)}</div>
                        <div class="kpi-sub">${res.atendimentos} atendimentos</div>
                    </div>
                    <div class="kpi-card" style="border-left-color:var(--warning)">
                        <div class="kpi-label">Custos Operacionais</div>
                        <div class="kpi-value">${R$(res.custoTotal + res.comissaoTotal)}</div>
                        <div class="kpi-sub">Produtos + Comissões</div>
                    </div>
                    <div class="kpi-card" style="border-left-color:var(--info)">
                        <div class="kpi-label">Custo Fixo Real</div>
                        <div class="kpi-value">${R$(cfReal)}</div>
                        <div class="kpi-sub">Após repasses: ${R$(receitasMes)}</div>
                    </div>
                    <div class="kpi-card" style="border-left-color:var(--success)">
                        <div class="kpi-label">Lucro Líquido</div>
                        <div class="kpi-value profit-${lucroLiquido >= 0 ? 'positive' : 'negative'}">${R$(lucroLiquido)}</div>
                        <div class="kpi-sub">Margem: ${pct(margemLiq)}</div>
                    </div>
                </div>

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
                    <div class="card">
                        <div class="card-title">DRE Simplificado</div>
                        <div class="summary-row">
                            <span class="label">(+) Faturamento Serviços/Produtos</span>
                            <span class="value profit-positive">${R$(res.faturamento)}</span>
                        </div>
                        <div class="summary-row">
                            <span class="label">(+) Repasses recebidos</span>
                            <span class="value profit-positive">${R$(receitasMes)}</span>
                        </div>
                        <div class="summary-row">
                            <span class="label">(-) Custos de serviços</span>
                            <span class="value">${R$(res.custoTotal)}</span>
                        </div>
                        <div class="summary-row">
                            <span class="label">(-) Comissões pagas</span>
                            <span class="value">${R$(res.comissaoTotal)}</span>
                        </div>
                        <div class="summary-row">
                            <span class="label">(-) Custos fixos</span>
                            <span class="value">${R$(custosMes)}</span>
                        </div>
                        <div class="summary-row" style="border-top:2px solid var(--mauve);padding-top:12px;margin-top:4px;">
                            <span class="label fw-700">= Lucro Líquido</span>
                            <span class="value fw-700 profit-${lucroLiquido>=0?'positive':'negative'}">${R$(lucroLiquido)}</span>
                        </div>
                        <div class="summary-row">
                            <span class="label">Margem bruta</span>
                            <span class="value">${pct(margemBruta)}</span>
                        </div>
                        <div class="summary-row">
                            <span class="label">Margem líquida</span>
                            <span class="value">${pct(margemLiq)}</span>
                        </div>
                        <div class="summary-row">
                            <span class="label">Ticket médio</span>
                            <span class="value">${R$(res.ticket)}</span>
                        </div>
                    </div>

                    <div>
                        <div class="card">
                            <div class="card-title">Top Serviços / Produtos</div>
                            ${topSvcs.length ? topSvcs.map(([nome, val]) => {
                                const pctVal = res.faturamento ? (val / res.faturamento) * 100 : 0;
                                return `<div style="margin-bottom:10px;">
                                    <div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:0.85rem;">
                                        <span class="fw-600">${nome}</span>
                                        <span>${R$(val)}</span>
                                    </div>
                                    <div style="height:6px;background:var(--mauve);border-radius:3px;">
                                        <div style="height:100%;width:${pctVal}%;
                                                    background:linear-gradient(90deg,var(--plum),var(--rose));
                                                    border-radius:3px;transition:width 0.5s;"></div>
                                    </div>
                                </div>`;
                            }).join('') : '<p class="text-muted" style="font-size:0.85rem;">Sem dados no período.</p>'}
                        </div>

                        <div class="card">
                            <div class="card-title">Formas de Pagamento</div>
                            ${Object.keys(pgtos).length ? Object.entries(pgtos).map(([fp, val]) => `
                                <div class="summary-row">
                                    <span class="label">${fp}</span>
                                    <span class="value">${R$(val)} <span class="text-muted">(${pct(res.faturamento ? val/res.faturamento : 0)})</span></span>
                                </div>`).join('')
                            : '<p class="text-muted" style="font-size:0.85rem;">Sem dados no período.</p>'}
                        </div>
                    </div>
                </div>
            `;
        };

        container.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
                <h2>Relatório Mensal</h2>
                <div style="display:flex;align-items:center;gap:10px;">
                    <select id="rel-mes" style="padding:8px 12px;border-radius:8px;border:2px solid var(--mauve);font-size:0.9rem;">
                        ${mesesNomes.map((m, i) => `<option value="${i}" ${i===mesSel?'selected':''}>${m}</option>`).join('')}
                    </select>
                    <input type="number" id="rel-ano" value="${anoSel}" min="2020" max="2030"
                           style="width:90px;padding:8px 12px;border-radius:8px;border:2px solid var(--mauve);font-size:0.9rem;">
                    <button class="btn btn-primary btn-sm" onclick="window.__reloadRelatorio()">
                        ${renderIcon('Filter', { width: 14, height: 14 })} Filtrar
                    </button>
                </div>
            </div>
            <div id="relatorio-body"></div>
        `;

        window.__reloadRelatorio = () => {
            mesSel = parseInt(document.getElementById('rel-mes').value);
            anoSel = parseInt(document.getElementById('rel-ano').value) || now.getFullYear();
            render();
        };

        render();
    },

    // ─────────────────────────────────────────────
    // CONFIGURAÇÕES
    // ─────────────────────────────────────────────
    configuracoes: (container) => {
        const cfg = Config.get();

        container.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
                <h2>Configurações</h2>
                <button class="btn btn-primary btn-sm" onclick="window.__saveCfg()">
                    ${renderIcon('Check', { width: 14, height: 14 })} Salvar Alterações
                </button>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
                <div class="card">
                    <div class="card-title">Dados do Salão</div>
                    <div class="form-group">
                        <label>Nome do Salão <span style="color:var(--danger)">*</span></label>
                        <input type="text" id="cfg-nome" value="${cfg.nomeSalao}">
                    </div>
                    <div class="form-group">
                        <label>Responsável</label>
                        <input type="text" id="cfg-resp" value="${cfg.responsavel}">
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Cidade</label>
                            <input type="text" id="cfg-cidade" value="${cfg.cidade || ''}">
                        </div>
                        <div class="form-group">
                            <label>Telefone</label>
                            <input type="text" id="cfg-tel" value="${cfg.telefone}">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Instagram</label>
                        <input type="text" id="cfg-insta" value="${cfg.instagram || ''}" placeholder="@seusalao">
                    </div>
                </div>

                <div class="card">
                    <div class="card-title">Profissionais</div>
                    <div id="cfg-profs">
                        ${cfg.profissionais.map((p, i) => `
                        <div style="display:flex;gap:8px;margin-bottom:8px;">
                            <input type="text" class="prof-input" data-idx="${i}" value="${p}" style="flex:1;">
                            <button onclick="window.__removeProf(${i})" class="btn btn-sm btn-danger">
                                ${renderIcon('Trash2', { width: 13, height: 13 })}
                            </button>
                        </div>`).join('')}
                    </div>
                    <button class="btn btn-secondary btn-sm" style="width:100%;margin-top:8px;"
                            onclick="window.__addProf()">
                        ${renderIcon('Plus', { width: 13, height: 13 })} Adicionar Profissional
                    </button>
                </div>
            </div>

            <div class="card" style="border:2px solid var(--danger);">
                <div class="card-title" style="color:var(--danger);">Zona de Perigo</div>
                <p style="color:var(--txt-muted);font-size:0.88rem;margin-bottom:16px;">
                    Atenção: estas ações não podem ser desfeitas.
                </p>
                <button class="btn btn-danger"
                        onclick="window.__confirmDelete('Limpar TODOS os dados? Isso apaga agenda, caixa, clientes e configurações.',
                                 ()=>{localStorage.clear();location.reload();},'Limpar Tudo')">
                    ${renderIcon('Trash2', { width: 14, height: 14 })} Limpar Todos os Dados
                </button>
            </div>
        `;

        window.__saveCfg = () => {
            if (!validate([{ id: 'cfg-nome', label: 'Nome do Salão', required: true }])) return;
            const profs = [...document.querySelectorAll('.prof-input')].map(i => i.value.trim()).filter(Boolean);
            Config.save({
                nomeSalao:    document.getElementById('cfg-nome').value.trim(),
                responsavel:  document.getElementById('cfg-resp').value.trim(),
                cidade:       document.getElementById('cfg-cidade').value.trim(),
                telefone:     document.getElementById('cfg-tel').value.trim(),
                instagram:    document.getElementById('cfg-insta').value.trim(),
                profissionais: profs,
            });
            // Atualizar nome no header
            const elNome = document.getElementById('salao-name');
            if (elNome) elNome.textContent = document.getElementById('cfg-nome').value.trim();
            toast('Configurações salvas!', 'success');
        };

        window.__addProf = () => {
            const profs = Config.get().profissionais;
            profs.push('Novo Profissional');
            Config.save({ ...Config.get(), profissionais: profs });
            renderPage('configuracoes', document.getElementById('page-configuracoes'));
        };

        window.__removeProf = (idx) => {
            const profs = Config.get().profissionais.filter((_, i) => i !== idx);
            Config.save({ ...Config.get(), profissionais: profs });
            renderPage('configuracoes', document.getElementById('page-configuracoes'));
        };

        window.Config = Config;
    },
};

// ═══════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════
export function renderPage(page, container) {
    if (PAGES_RENDER[page]) PAGES_RENDER[page](container);
}

// Expõe ao window para handlers inline
window.renderPage   = renderPage;
window.Agenda       = Agenda;
window.Diario       = Diario;
window.Servicos     = Servicos;
window.Produtos     = Produtos;
window.Clientes     = Clientes;
window.Custos       = Custos;
window.Receitas     = Receitas;
window.Config       = Config;
window.applyMoneyMask = applyMoneyMask;
window.getRaw       = getRaw;
window.validate     = validate;
