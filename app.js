// ═══════════════════════════════════════════════════════
// app.js — Núcleo da Aplicação (Router + Auth + Tema)
// v3.2: Multi-tenant ready, PWA ready, White-label ready
// ═══════════════════════════════════════════════════════

import {
    createClient
} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// ═══════════════════════════════════════════════════════
// CONFIGURAÇÃO SUPABASE (Multi-tenant)
// ═══════════════════════════════════════════════════════
const SUPABASE_URL = 'https://wjuooblxcczmbdaxuqhj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_iiKZubiCAW9X2LdCliM7Lw_8Z1cA_2B';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
    }
});

// ═══════════════════════════════════════════════════════
// ÍCONES (Registry inline - Substitui o import do Lucide)
// ═══════════════════════════════════════════════════════
const ICONS = {
    LayoutDashboard: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
    Calendar: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    Scissors: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/>',
    DollarSign: '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
    TrendingUp: '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
    Users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    Settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    Plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    Trash2: '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>',
    Edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
    Check: '<polyline points="20 6 9 17 4 12"/>',
    X: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    MessageCircle: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
    Package: '<line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>',
    Sun: '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>',
    Moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
    LogOut: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
    CreditCard: '<rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>',
    BarChart3: '<line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/>',
    Loader2: '<line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>',
    Search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    Filter: '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>',
    CalendarCheck: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><polyline points="9 16 11 18 15 14"/>',
    Menu: '<line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>',
    ChevronRight: '<polyline points="9 18 15 12 9 6"/>'
};

export function renderIcon(name, attrs = { width: 20, height: 20 }) {
    const path = ICONS[name] || ICONS['LayoutDashboard'];
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${attrs.width}" height="${attrs.height}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
}

// ═══════════════════════════════════════════════════════
// ROUTER & STATE
// ═══════════════════════════════════════════════════════
const PAGES = {
    dashboard: { icon: 'LayoutDashboard', title: 'Dashboard' },
    agenda: { icon: 'Calendar', title: 'Agenda' },
    diario: { icon: 'DollarSign', title: 'Diário / Caixa' },
    servicos: { icon: 'Scissors', title: 'Serviços' },
    clientes: { icon: 'Users', title: 'Clientes' },
    custos: { icon: 'CreditCard', title: 'Custos Fixos' },
    receitas: { icon: 'TrendingUp', title: 'Receitas' },
    controle: { icon: 'BarChart3', title: 'Controle Anual' },
    relatorio: { icon: 'BarChart3', title: 'Relatório Mensal' },
    configuracoes: { icon: 'Settings', title: 'Configurações' }
};

let currentPage = 'dashboard';

// ═══════════════════════════════════════════════════════
// AUTH & SESSION
// ═══════════════════════════════════════════════════════
export async function getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
}

export async function getUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

export async function loginEmail(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { user: data?.user, error };
}

export async function signupEmail(email, password) {
    const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: window.location.href }
    });
    return { user: data?.user, error };
}

export async function loginGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.href }
    });
    return { error };
}

export async function logout() {
    await supabase.auth.signOut();
}

// ═══════════════════════════════════════════════════════
// THEME MANAGEMENT (White-label ready)
// ═══════════════════════════════════════════════════════
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('salao_theme', theme);
    updateThemeIcon(theme);
}

function updateThemeIcon(theme) {
    const btn = document.getElementById('btn-theme-toggle');
    if (!btn) return;
    const isDark = theme === 'dark';
    btn.innerHTML = renderIcon(isDark ? 'Sun' : 'Moon', { width: 16, height: 16 }) +
        `<span style="margin-left: 8px;">${isDark ? 'Modo Claro' : 'Modo Escuro'}</span>`;
}

function loadTheme() {
    const saved = localStorage.getItem('salao_theme') || 'light';
    applyTheme(saved);
}

// ═══════════════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════════════
function renderSkeleton(pageEl) {
    pageEl.innerHTML = `
        <div class="skeleton-wrap">
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;">
                <div class="skeleton-block" style="height:90px;"></div>
                <div class="skeleton-block" style="height:90px;"></div>
                <div class="skeleton-block" style="height:90px;"></div>
            </div>
            <div class="skeleton-block" style="height:200px;"></div>
            <div style="display:flex;flex-direction:column;gap:10px;">
                <div class="skeleton-line" style="height:44px;"></div>
                <div class="skeleton-line" style="height:44px;"></div>
                <div class="skeleton-line" style="height:44px;"></div>
            </div>
        </div>
    `;
}

export function navigateTo(page) {
    if (!PAGES[page]) page = 'dashboard';

    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    // Show target page
    const pageEl = document.getElementById(`page-${page}`);
    const navEl = document.querySelector(`[data-page="${page}"]`);

    if (pageEl) {
        pageEl.classList.remove('hidden');
        renderSkeleton(pageEl);

        // Load content from modules
        import('./modules.js').then(mod => {
            mod.renderPage(page, pageEl);
        });
    }

    if (navEl) navEl.classList.add('active');

    // Sync bottom nav
    document.querySelectorAll('.bottom-nav-item').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.page === page);
    });

    // Update header
    document.getElementById('page-title').textContent = PAGES[page].title;
    currentPage = page;
    localStorage.setItem('salao_last_page', page);

    // Mobile: close sidebar
    if (window.innerWidth <= 768) {
        document.getElementById('sidebar').classList.remove('open');
    }
}

function renderNav() {
    const nav = document.getElementById('nav-menu');
    nav.innerHTML = Object.entries(PAGES).map(([key, val]) => `
        <li>
            <button class="nav-item ${key === currentPage ? 'active' : ''}" data-page="${key}">
                ${renderIcon(val.icon, { width: 20, height: 20 })}
                <span class="nav-label" style="margin-left: 12px;">${val.title}</span>
            </button>
        </li>
    `).join('');

    // Event listeners
    nav.querySelectorAll('.nav-item').forEach(btn => {
        btn.onclick = () => navigateTo(btn.dataset.page);
    });

    // Render bottom nav mobile
    const bottomNav = document.getElementById('bottom-nav-items');
    if (bottomNav) {
        const BOTTOM_PAGES = ['dashboard', 'agenda', 'diario', 'clientes', 'configuracoes'];
        bottomNav.innerHTML = BOTTOM_PAGES.map(key => {
            const val = PAGES[key];
            return `
                <li>
                    <button class="bottom-nav-item ${key === currentPage ? 'active' : ''}" 
                            data-page="${key}"
                            aria-label="${val.title}">
                        ${renderIcon(val.icon, { width: 22, height: 22 })}
                        <span>${val.title}</span>
                    </button>
                </li>
            `;
        }).join('');

        bottomNav.querySelectorAll('.bottom-nav-item').forEach(btn => {
            btn.onclick = () => navigateTo(btn.dataset.page);
        });
    }
}

// ═══════════════════════════════════════════════════════
// MODAL SYSTEM
// ═══════════════════════════════════════════════════════
window.__openModal = function (title, bodyHTML, footerHTML = '') {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = bodyHTML;
    document.getElementById('modal-footer').innerHTML = footerHTML;
    document.getElementById('modal-overlay').classList.add('open');
};

window.__closeModal = function () {
    document.getElementById('modal-overlay').classList.remove('open');
};

// ── BOTTOM SHEET (mobile forms) ──
window.__openSheet = function (title, bodyHTML) {
    document.getElementById('sheet-title').textContent = title;
    document.getElementById('sheet-body').innerHTML = bodyHTML;
    document.getElementById('sheet-overlay').classList.add('open');
    document.getElementById('sheet').classList.add('open');
    setTimeout(() => {
        const first = document.querySelector('#sheet-body input, #sheet-body select');
        if (first) first.focus();
    }, 350);
};

window.__closeSheet = function () {
    document.getElementById('sheet-overlay').classList.remove('open');
    document.getElementById('sheet').classList.remove('open');
};

window.__openForm = function (title, bodyHTML) {
    if (window.innerWidth <= 768) {
        window.__openSheet(title, bodyHTML);
    } else {
        window.__openModal(title, bodyHTML);
    }
};

window.__closeForm = function () {
    window.__closeModal();
    window.__closeSheet();
};

// ── CONFIRM DIALOG ──
window.__confirmDelete = function (message, onConfirm, confirmLabel = 'Remover') {
    const overlay = document.getElementById('confirm-overlay');
    document.getElementById('confirm-msg').textContent = message;
    document.getElementById('confirm-ok').textContent = confirmLabel;
    overlay.classList.add('open');

    const ok = document.getElementById('confirm-ok');
    const cancel = document.getElementById('confirm-cancel');

    const cleanup = () => overlay.classList.remove('open');

    ok.onclick = () => { cleanup(); onConfirm(); };
    cancel.onclick = cleanup;
    overlay.onclick = (e) => { if (e.target === overlay) cleanup(); };
};

// ═══════════════════════════════════════════════════════
// TOAST SYSTEM
// ═══════════════════════════════════════════════════════
export function toast(message, type = 'default', duration = 3000) {
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');

    const config = {
        success: { bg: '#E8F5E9', color: '#2E7D32', border: '#4CAF50', icon: '<polyline points="20 6 9 17 4 12"/>' },
        error: { bg: '#FFEBEE', color: '#C62828', border: '#f44336', icon: '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>' },
        warning: { bg: '#FFF8E1', color: '#E65100', border: '#ff9800', icon: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>' },
        default: { bg: '#F3E5F5', color: '#4A1070', border: '#7B4F8E', icon: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>' },
    };

    const c = config[type] || config.default;

    el.style.cssText = `
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 16px;
        background: ${c.bg};
        color: ${c.color};
        border-left: 4px solid ${c.border};
        border-radius: 10px;
        font-size: 0.9rem;
        min-width: 260px;
        max-width: 380px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.12);
        animation: fadeIn 0.3s ease;
        cursor: pointer;
    `;

    el.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" 
             fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" 
             stroke-linejoin="round" style="flex-shrink:0">${c.icon}</svg>
        <span style="flex:1">${message}</span>
        <button style="background:none;border:none;cursor:pointer;color:${c.color};opacity:0.6;padding:0;display:flex;" 
                onclick="this.parentElement.remove()">✕</button>
    `;

    el.onclick = (e) => { if (e.target.tagName !== 'BUTTON') el.remove(); };
    container.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity 0.3s'; setTimeout(() => el.remove(), 300); }, duration);
}

// ═══════════════════════════════════════════════════════
// LOGIN RENDER
// ═══════════════════════════════════════════════════════
function renderLogin() {
    const el = document.getElementById('page-login');
    const app = document.getElementById('app-shell');

    el.style.display = 'flex';
    app.style.display = 'none';

    el.innerHTML = `
        <div class="login-split">
            <div class="login-marketing">
                <div style="background: rgba(255,255,255,0.1); padding: 6px 12px; border-radius: 20px; 
                            font-size: 12px; font-weight: 600; letter-spacing: 1px; 
                            text-transform: uppercase; margin-bottom: 24px; width: fit-content;">
                    Sistema de Gestão Premium
                </div>
                <h1 style="font-size: 42px; font-weight: 600; line-height: 1.1; margin-bottom: 24px;">
                    Sua mente no estilo,<br>sua gestão no luxo.
                </h1>
                <p style="font-size: 16px; opacity: 0.9; margin-bottom: 40px; max-width: 400px; line-height: 1.5;">
                    Abandone o papel. Controle sua agenda, calcule seu lucro real instantaneamente 
                    e fidelize seus clientes em uma única plataforma.
                </p>
                
                <div style="display: flex; flex-direction: column; gap: 16px;">
                    <div style="display: flex; align-items: center; gap: 12px; font-size: 14px; font-weight: 500;">
                        <div style="background: white; color: var(--plum); border-radius: 50%; 
                                    padding: 8px; display: flex;">
                            ${renderIcon('CalendarCheck', { width: 16, height: 16 })}
                        </div>
                        <span>Agendamentos organizados sem conflitos</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 12px; font-size: 14px; font-weight: 500;">
                        <div style="background: white; color: var(--plum); border-radius: 50%; 
                                    padding: 8px; display: flex;">
                            ${renderIcon('TrendingUp', { width: 16, height: 16 })}
                        </div>
                        <span>Frente de Caixa com cálculo de Lucro Real</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 12px; font-size: 14px; font-weight: 500;">
                        <div style="background: white; color: var(--plum); border-radius: 50%; 
                                    padding: 8px; display: flex;">
                            ${renderIcon('Users', { width: 16, height: 16 })}
                        </div>
                        <span>CRM integrado para retenção de clientes</span>
                    </div>
                </div>
            </div>

            <div class="login-form-side">
                <div style="margin-bottom: 32px;">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                        <div style="width: 40px; height: 40px; background: var(--plum); color: white; 
                                    display: flex; align-items: center; justify-content: center; 
                                    border-radius: 8px; font-size: 20px; font-weight: bold;">
                            ✦
                        </div>
                        <div>
                            <div style="font-size: 24px; font-weight: 600; color: var(--txt-dark);">
                                Salão Premium
                            </div>
                            <div style="font-size: 12px; color: var(--txt-muted);">Gestão Inteligente</div>
                        </div>
                    </div>
                </div>

                <div style="display: flex; gap: 0; margin-bottom: 24px; border-bottom: 2px solid var(--mauve);">
                    <button class="login-tab active" id="tab-login" 
                            style="flex: 1; padding: 12px; background: none; border: none; 
                                   border-bottom: 2px solid var(--plum); color: var(--plum); 
                                   font-weight: 600; cursor: pointer; margin-bottom: -2px;">
                        Entrar
                    </button>
                    <button class="login-tab" id="tab-signup" 
                            style="flex: 1; padding: 12px; background: none; border: none; 
                                   color: var(--txt-muted); cursor: pointer;">
                        Criar conta
                    </button>
                </div>

                <div id="login-panel">
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 6px; font-size: 14px; font-weight: 500;">E-mail</label>
                        <input type="email" id="li-email" placeholder="seu@email.com" 
                               style="width: 100%; padding: 10px; border: 1px solid var(--mauve); 
                                      border-radius: 8px; font-size: 14px;">
                    </div>
                    <div style="margin-bottom: 24px;">
                        <label style="display: block; margin-bottom: 6px; font-size: 14px; font-weight: 500;">Senha</label>
                        <input type="password" id="li-pass" placeholder="••••••••" 
                               style="width: 100%; padding: 10px; border: 1px solid var(--mauve); 
                                      border-radius: 8px; font-size: 14px;">
                    </div>
                    <button id="btn-login" class="btn btn-primary" style="width: 100%; margin-bottom: 16px;">
                        Entrar
                    </button>
                    <button id="btn-google" class="btn btn-secondary" style="width: 100%;">
                        ${renderIcon('Users', { width: 16, height: 16 })} Continuar com Google
                    </button>
                </div>

                <div id="signup-panel" style="display: none;">
                    <div style="background: var(--lavender); padding: 12px; border-radius: 8px; 
                                margin-bottom: 16px; font-size: 13px; color: var(--plum);">
                        Você receberá um <strong>e-mail de confirmação</strong>. 
                        Clique no link para ativar sua conta.
                    </div>
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 6px; font-size: 14px; font-weight: 500;">
                            Nome do Salão
                        </label>
                        <input type="text" id="su-salao" placeholder="Ex: Studio Rose" 
                               style="width: 100%; padding: 10px; border: 1px solid var(--mauve); 
                                      border-radius: 8px; font-size: 14px;">
                    </div>
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 6px; font-size: 14px; font-weight: 500;">E-mail</label>
                        <input type="email" id="su-email" placeholder="seu@email.com" 
                               style="width: 100%; padding: 10px; border: 1px solid var(--mauve); 
                                      border-radius: 8px; font-size: 14px;">
                    </div>
                    <div style="margin-bottom: 24px;">
                        <label style="display: block; margin-bottom: 6px; font-size: 14px; font-weight: 500;">Senha</label>
                        <input type="password" id="su-pass" placeholder="Mínimo 6 caracteres" 
                               style="width: 100%; padding: 10px; border: 1px solid var(--mauve); 
                                      border-radius: 8px; font-size: 14px;">
                    </div>
                    <button id="btn-signup" class="btn btn-primary" style="width: 100%;">
                        Criar conta
                    </button>
                </div>
            </div>
        </div>
    `;

    // Events
    document.getElementById('tab-login').onclick = () => {
        document.getElementById('login-panel').style.display = '';
        document.getElementById('signup-panel').style.display = 'none';
        document.getElementById('tab-login').classList.add('active');
        document.getElementById('tab-login').style.cssText = 'flex: 1; padding: 12px; background: none; border: none; border-bottom: 2px solid var(--plum); color: var(--plum); font-weight: 600; cursor: pointer; margin-bottom: -2px;';
        document.getElementById('tab-signup').style.cssText = 'flex: 1; padding: 12px; background: none; border: none; color: var(--txt-muted); cursor: pointer;';
    };

    document.getElementById('tab-signup').onclick = () => {
        document.getElementById('login-panel').style.display = 'none';
        document.getElementById('signup-panel').style.display = '';
        document.getElementById('tab-signup').classList.add('active');
        document.getElementById('tab-signup').style.cssText = 'flex: 1; padding: 12px; background: none; border: none; border-bottom: 2px solid var(--plum); color: var(--plum); font-weight: 600; cursor: pointer; margin-bottom: -2px;';
        document.getElementById('tab-login').style.cssText = 'flex: 1; padding: 12px; background: none; border: none; color: var(--txt-muted); cursor: pointer;';
    };

    document.getElementById('btn-login').onclick = async () => {
        const email = document.getElementById('li-email').value;
        const pass = document.getElementById('li-pass').value;
        const { user, error } = await loginEmail(email, pass);
        if (error) return toast(error.message, 'error');
        initApp(user);
    };

    document.getElementById('btn-signup').onclick = async () => {
        const email = document.getElementById('su-email').value;
        const pass = document.getElementById('su-pass').value;
        const salao = document.getElementById('su-salao').value;
        const { user, error } = await signupEmail(email, pass);
        if (error) return toast(error.message, 'error');
        if (salao) localStorage.setItem('salao_pending_name', salao);
        toast('Verifique seu e-mail para confirmar!', 'success');
    };

    document.getElementById('btn-google').onclick = async () => {
        await loginGoogle();
    };
}

// ═══════════════════════════════════════════════════════
// APP INITIALIZATION
// ═══════════════════════════════════════════════════════
let _appInitialized = false;

async function initApp(user) {
    if (_appInitialized) return;
    _appInitialized = true;
    // Hide login, show app
    document.getElementById('page-login').style.display = 'none';
    document.getElementById('app-shell').style.display = 'flex';
    document.getElementById('boot-loader').style.display = 'none';

    // Load user data
    document.getElementById('user-email').textContent = user.email;

    // Load config from modules
    const { Config } = await import('./modules.js');
    const cfg = Config.get();
    document.getElementById('salao-name').textContent = cfg.nomeSalao || 'Meu Salão';

    // Aplicar brand colors do salão
    if (cfg.corPrimaria) {
        document.documentElement.style.setProperty('--plum', cfg.corPrimaria);
        document.documentElement.style.setProperty('--plum-light', cfg.corPrimaria + 'AA');
    }
    if (cfg.corSecundaria) {
        document.documentElement.style.setProperty('--rose', cfg.corSecundaria);
        document.documentElement.style.setProperty('--rose-light', cfg.corSecundaria + '33');
    }

    // Set badge month
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const now = new Date();
    document.getElementById('badge-mes').textContent = `${meses[now.getMonth()]} ${now.getFullYear()}`;

    // Render nav
    renderNav();

    // Load last page or dashboard
    const lastPage = localStorage.getItem('salao_last_page') || 'dashboard';
    navigateTo(PAGES[lastPage] ? lastPage : 'dashboard');

    // Theme toggle
    document.getElementById('btn-theme-toggle').onclick = () => {
        const current = localStorage.getItem('salao_theme') || 'light';
        applyTheme(current === 'light' ? 'dark' : 'light');
    };

    // Logout
    document.getElementById('btn-logout').onclick = async () => {
        window.__confirmDelete('Sair do sistema?', async () => {
            await logout();
            Object.keys(localStorage)
                .filter(k => k.startsWith('salao_') || k === 'sb-' || k.includes('supabase'))
                .forEach(k => localStorage.removeItem(k));
            _appInitialized = false;
            location.reload();
        }, 'Sair');
    };

    // Sidebar toggle
    const sidebar = document.getElementById('sidebar');
    if (window.innerWidth > 768 && localStorage.getItem('sidebarCollapsed') === 'true') {
        sidebar.classList.add('collapsed');
    }

    // Mobile menu button (create if not exists)
    if (!document.getElementById('btn-menu')) {
        const btn = document.createElement('button');
        btn.id = 'btn-menu';
        btn.innerHTML = renderIcon('Menu', { width: 24, height: 24 });
        btn.style.cssText = 'position: fixed; top: 20px; left: 20px; z-index: 1001; background: white; border: none; padding: 8px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); cursor: pointer; display: none;';
        btn.onclick = () => sidebar.classList.toggle('open');
        document.body.appendChild(btn);

        if (window.innerWidth <= 768) btn.style.display = 'block';
        window.addEventListener('resize', () => {
            btn.style.display = window.innerWidth <= 768 ? 'block' : 'none';
        });
    }

    // ── Indicador offline ──
    const offlineBanner = document.getElementById('offline-banner');
    const showOffline = () => {
        offlineBanner.textContent = 'Sem conexão — dados salvos localmente';
        offlineBanner.classList.remove('reconnected');
        offlineBanner.classList.add('visible');
    };
    const showReconnected = () => {
        offlineBanner.textContent = 'Conexão restaurada!';
        offlineBanner.classList.add('reconnected', 'visible');
        setTimeout(() => offlineBanner.classList.remove('visible', 'reconnected'), 2500);
    };

    if (!navigator.onLine) showOffline();
    window.addEventListener('offline', showOffline);
    window.addEventListener('online', showReconnected);

    // ── Atalhos de teclado (desktop) ──
    document.addEventListener('keydown', (e) => {
        const tag = document.activeElement?.tagName?.toLowerCase();
        if (['input', 'select', 'textarea'].includes(tag)) return;
        if (e.ctrlKey || e.altKey || e.metaKey) return;

        const shortcuts = {
            '1': 'dashboard',
            '2': 'agenda',
            '3': 'diario',
            '4': 'clientes',
            '5': 'servicos',
            '6': 'controle',
            '9': 'configuracoes',
            'Escape': () => { window.__closeModal(); window.__closeSheet(); },
        };

        if (shortcuts[e.key]) {
            if (typeof shortcuts[e.key] === 'string') {
                navigateTo(shortcuts[e.key]);
            } else {
                shortcuts[e.key]();
            }
        }

        if (e.key === '?') {
            window.__openModal('Atalhos de Teclado', `
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:0.9rem;">
                    ${Object.entries({ '1': 'Dashboard', '2': 'Agenda', '3': 'Diário', '4': 'Clientes', '5': 'Serviços', '6': 'Controle', '9': 'Configurações', 'Esc': 'Fechar modal', '?': 'Este menu' }).map(([k, v]) => `
                        <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--mauve);">
                            <span style="color:var(--txt-muted)">${v}</span>
                            <kbd style="background:var(--mauve);padding:2px 8px;border-radius:4px;font-family:monospace;font-size:0.85rem;">${k}</kbd>
                        </div>
                    `).join('')}
                </div>
            `);
        }
    });
}

// ═══════════════════════════════════════════════════════
// BOOT SEQUENCE
// ═══════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async () => {
    loadTheme();

    try {
        // Check session
        const session = await getSession();

        if (session?.user) {
            initApp(session.user);
        } else {
            document.getElementById('boot-loader').style.display = 'none';
            renderLogin();
        }
    } catch (err) {
        console.error('[boot] Erro ao verificar sessão:', err);
        document.getElementById('boot-loader').style.display = 'none';
        renderLogin();
    }

    // Listen auth changes
    supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
            initApp(session.user);
        }
        if (event === 'SIGNED_OUT') {
            _appInitialized = false;
            renderLogin();
        }
    });
});