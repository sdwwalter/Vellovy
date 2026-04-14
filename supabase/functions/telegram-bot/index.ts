
<<<<<<< HEAD
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─────────────────────────────────────────────────────
// ENV (configurados via: supabase secrets set ...)
// ─────────────────────────────────────────────────────
const TELEGRAM_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SRK = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// ─────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────
interface TelegramMessage {
    chat: { id: number };
    text?: string;
    from?: { first_name?: string };
}

interface WebhookPayload {
    message?: TelegramMessage;
    callback_query?: {
        id: string;
        message?: TelegramMessage;
        data?: string;
    };
}

interface SalaoData {
    config?: Record<string, unknown>;
    agenda?: AgendaItem[];
    diario?: DiarioItem[];
    clientes?: ClienteItem[];
}

interface AgendaItem {
    id?: number;
    data?: string;
    horario?: string;
    cliente?: string;
    servico?: string;
    profissional?: string;
    status?: string;
}

interface DiarioItem {
    id?: number;
    data?: string;
    cliente?: string;
    servico?: string;
    precoCobrado?: number;
    qtd?: number;
    custoTotal?: number;
    comissaoValor?: number;
}

interface ClienteItem {
    nome: string;
    obs?: string;
    criadoEm?: string;
    telefone?: string;
}

// ─────────────────────────────────────────────────────
// ENTRADA PRINCIPAL
// ─────────────────────────────────────────────────────
serve(async (req) => {
    if (req.method !== "POST") return new Response("OK");

    let payload: WebhookPayload;
    try {
        payload = await req.json();
    } catch {
        return new Response("Bad request", { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SRK);

    // ── Mensagem comum ────────────────────────────────
    if (payload.message?.text) {
        await handleMessage(payload.message, supabase);
    }

    return new Response("OK");
});

// ─────────────────────────────────────────────────────
// HANDLER DE MENSAGEM
// ─────────────────────────────────────────────────────
async function handleMessage(message: TelegramMessage, supabase: ReturnType<typeof createClient>) {
    const chatId = message.chat.id;
    const texto = (message.text || "").trim();

    // 1. Identifica usuário pelo telegram_chat_id
    const { data: profile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("telegram_chat_id", String(chatId))
        .maybeSingle();

    // Fluxo de vínculo: usuário não cadastrado envia /start
    if (!profile) {
        if (texto === "/start") {
            // Gera um token de vínculo temporário
            const token = Math.random().toString(36).slice(2, 10).toUpperCase();
            await supabase.from("telegram_link_tokens").upsert({
                chat_id: String(chatId),
                token,
                created_at: new Date().toISOString(),
            });
            await sendText(chatId,
                `👋 Olá! Para vincular este bot ao seu salão:\n\n` +
                `1. Acesse o sistema web\n` +
                `2. Vá em *Configurações > Bot Telegram*\n` +
                `3. Digite o código: \`${token}\`\n\n` +
                `_O código expira em 10 minutos._`
            );
        } else {
            await sendText(chatId,
                `❌ Seu Telegram não está vinculado a nenhum salão.\n\n` +
                `Envie /start para gerar um código de vínculo.`
            );
        }
        return;
    }

    const userId = profile.user_id;

    // 2. Carrega os dados do salão (somente os necessários)
    const dados = await carregarDados(userId, supabase);

    // 3. Determina e executa o comando
    const resposta = dispatch(texto, dados);
    await sendText(chatId, resposta);
}

// ─────────────────────────────────────────────────────
// DISPATCHER — Zero IA, zero alucinação
// ─────────────────────────────────────────────────────
function dispatch(texto: string, dados: SalaoData): string {
    // Normaliza: minúsculas + remove acentos
    const t = texto.toLowerCase().trim()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    if (t === "/start" || t === "start") return cmdAjuda();
    if (match(t, ["ajuda", "help", "comandos"])) return cmdAjuda();
    if (match(t, ["resumo", "briefing"])) return cmdResumo(dados);

    // Agenda
    if (match(t, ["agenda hoje", "hoje"])) return cmdAgendaHoje(dados);
    if (match(t, ["agenda amanha", "amanha"])) return cmdAgendaAmanha(dados);
    if (match(t, ["proximos", "agenda proximos"])) return cmdAgendaProximos(dados);

    // Caixa
    if (match(t, ["caixa hoje", "faturamento hoje", "quanto fiz hoje"])) return cmdCaixaHoje(dados);
    if (match(t, ["caixa ontem", "faturamento ontem", "quanto fiz ontem"])) return cmdCaixaOntem(dados);
    if (match(t, ["semana", "essa semana"])) return cmdSemana(dados);
    if (match(t, ["mes", "esse mes", "resumo mes"])) return cmdMes(dados);

    // Clientes
    if (match(t, ["inativos", "risco", "churn", "ausentes"])) return cmdClientesInativos(dados);

    // Não reconhecido
    return `🤔 Não entendi. Envie *ajuda* para ver os comandos disponíveis.`;
}

// ─────────────────────────────────────────────────────
// COMANDOS
// ─────────────────────────────────────────────────────
function cmdAjuda(): string {
    return `🤖 *Comandos disponíveis:*\n\n` +
        `📅 *Agenda*\n` +
        `• \`agenda hoje\`\n` +
        `• \`agenda amanhã\`\n` +
        `• \`próximos\`\n\n` +
        `💰 *Financeiro*\n` +
        `• \`caixa hoje\`\n` +
        `• \`caixa ontem\`\n` +
        `• \`semana\`\n` +
        `• \`mês\`\n\n` +
        `👥 *Clientes*\n` +
        `• \`clientes inativos\`\n\n` +
        `📋 *Outros*\n` +
        `• \`resumo\` — briefing do dia`;
}

function cmdAgendaHoje(dados: SalaoData): string {
    const hojeStr = isoHoje();
    const agenda = (dados.agenda || [])
        .filter(a => a.data === hojeStr && a.status !== "cancelado")
        .sort((a, b) => (a.horario || "").localeCompare(b.horario || ""));

    const nomeSalao = (dados.config as Record<string, string>)?.nomeSalao || "Salão";
    const dataFmt = fmtDataExtenso(new Date());

    if (!agenda.length) {
        return `📅 *${nomeSalao}*\n_${dataFmt}_\n\nNenhum agendamento para hoje.`;
    }

    const linhas = agenda.map(a => {
        const status = a.status === "confirmado" ? "✅" : "🔵";
        const serv = a.servico ? ` — ${a.servico}` : "";
        return `${status} *${a.horario || "?"}* ${a.cliente}${serv}`;
    }).join("\n");

    return `📅 *Agenda de Hoje — ${dataFmt}*\n_${nomeSalao}_\n\n${linhas}\n\n_${agenda.length} agendamento(s)_`;
}

function cmdAgendaAmanha(dados: SalaoData): string {
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    const amanhaStr = amanha.toISOString().slice(0, 10);

    const agenda = (dados.agenda || [])
        .filter(a => a.data === amanhaStr && a.status !== "cancelado")
        .sort((a, b) => (a.horario || "").localeCompare(b.horario || ""));

    const nomeSalao = (dados.config as Record<string, string>)?.nomeSalao || "Salão";
    const dataFmt = fmtDataExtenso(amanha);

    if (!agenda.length) {
        return `📅 *Amanhã — ${dataFmt}*\n_${nomeSalao}_\n\nNenhum agendamento.`;
    }

    const linhas = agenda.map(a =>
        `🔵 *${a.horario || "?"}* ${a.cliente}${a.servico ? ` — ${a.servico}` : ""}`
    ).join("\n");

    return `📅 *Agenda de Amanhã — ${dataFmt}*\n_${nomeSalao}_\n\n${linhas}\n\n_${agenda.length} agendamento(s)_`;
}

function cmdAgendaProximos(dados: SalaoData): string {
    const hojeStr = isoHoje();
    const proximos = (dados.agenda || [])
        .filter(a => (a.data || "") >= hojeStr && a.status !== "cancelado")
        .sort((a, b) => ((a.data || "") + (a.horario || "")).localeCompare((b.data || "") + (b.horario || "")))
        .slice(0, 10);

    if (!proximos.length) return "📅 Nenhum agendamento futuro cadastrado.";

    const porDia: Record<string, AgendaItem[]> = {};
    proximos.forEach(a => {
        const k = a.data || "?";
        if (!porDia[k]) porDia[k] = [];
        porDia[k].push(a);
    });

    const linhas = Object.entries(porDia).map(([data, ags]) => {
        const itens = ags.map(a => `  • ${a.horario || "?"} ${a.cliente}`).join("\n");
        return `*${fmtData(data)}*\n${itens}`;
    }).join("\n\n");

    return `📅 *Próximos Agendamentos*\n\n${linhas}`;
}

function cmdCaixaHoje(dados: SalaoData): string {
    const hojeStr = isoHoje();
    return _resumoCaixa(dados.diario || [], hojeStr, "Hoje");
}

function cmdCaixaOntem(dados: SalaoData): string {
    const ontem = new Date();
    ontem.setDate(ontem.getDate() - 1);
    return _resumoCaixa(dados.diario || [], ontem.toISOString().slice(0, 10), "Ontem");
}

function cmdSemana(dados: SalaoData): string {
    const hoje = new Date();
    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() - hoje.getDay());
    const inicioStr = inicioSemana.toISOString().slice(0, 10);
    const hojeStr = isoHoje();

    const entries = (dados.diario || []).filter(e => (e.data || "") >= inicioStr && (e.data || "") <= hojeStr);
    const fat = somaFat(entries);

    return `📊 *Faturamento da Semana*\n\n` +
        `Total: *${fmt$(fat)}*\n` +
        `Atendimentos: *${entries.length}*\n` +
        `Ticket médio: *${fmt$(entries.length ? fat / entries.length : 0)}*`;
}

function cmdMes(dados: SalaoData): string {
    const now = new Date();
    const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const entries = (dados.diario || []).filter(e => (e.data || "").startsWith(prefix));
    const fat = somaFat(entries);
    const lucro = somaLucro(entries);
    const nomeMes = now.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

    return `📊 *Resumo de ${nomeMes}*\n\n` +
        `Faturamento: *${fmt$(fat)}*\n` +
        `Lucro estimado: *${fmt$(lucro)}*\n` +
        `Atendimentos: *${entries.length}*\n` +
        `Ticket médio: *${fmt$(entries.length ? fat / entries.length : 0)}*`;
}

function cmdClientesInativos(dados: SalaoData): string {
    const diario = dados.diario || [];
    const clientes = dados.clientes || [];

    // Calcula última visita por cliente a partir do diário
    const ultimaVisita: Record<string, string> = {};
    diario.forEach(e => {
        if (!e.cliente || !e.data) return;
        const k = e.cliente.toLowerCase().trim();
        if (!ultimaVisita[k] || e.data > ultimaVisita[k]) ultimaVisita[k] = e.data;
    });

    const inativos = clientes
        .map(c => {
            const k = c.nome.toLowerCase().trim();
            const ultima = ultimaVisita[k] || null;
            const dias = ultima
                ? Math.floor((Date.now() - new Date(ultima + "T12:00:00").getTime()) / 86400000)
                : Infinity;
            return { nome: c.nome, dias };
        })
        .filter(c => c.dias >= 45 && c.dias < Infinity)
        .sort((a, b) => b.dias - a.dias)
        .slice(0, 8);

    if (!inativos.length) {
        return `✅ *Retenção OK!*\n\nNenhum cliente ausente há mais de 45 dias.`;
    }

    const linhas = inativos.map(c => `• ${c.nome} — _${c.dias} dias_`).join("\n");
    return `⚠️ *Clientes em Risco — +45 dias sem visita*\n\n${linhas}`;
}

function cmdResumo(dados: SalaoData): string {
    const hojeStr = isoHoje();
    const agenda = (dados.agenda || [])
        .filter(a => a.data === hojeStr && a.status !== "cancelado");
    const entries = (dados.diario || []).filter(e => e.data === hojeStr);
    const fat = somaFat(entries);
    const nomeSalao = (dados.config as Record<string, string>)?.nomeSalao || "Salão";
    const dataFmt = fmtDataExtenso(new Date());

    return `🌅 *Resumo do Dia — ${dataFmt}*\n_${nomeSalao}_\n\n` +
        `📅 Agenda: *${agenda.length}* agendamento(s)\n` +
        `💰 Caixa: *${fmt$(fat)}* (${entries.length} atendimento(s))\n\n` +
        (agenda.length > 0
            ? `*Próximos:*\n` + agenda.slice(0, 3).map(a => `  • ${a.horario} ${a.cliente}`).join("\n")
            : "_Nenhum agendamento para hoje._");
}

// ─────────────────────────────────────────────────────
// CARGA DE DADOS (Supabase → estruturas locais)
// ─────────────────────────────────────────────────────
async function carregarDados(userId: string, supabase: ReturnType<typeof createClient>): Promise<SalaoData> {
    const tipos = ["config", "agenda", "diario", "clientes"];
    const { data, error } = await supabase
        .from("salao_data")
        .select("data_type, data")
        .eq("user_id", userId)
        .in("data_type", tipos);

    if (error || !data) return {};

    const resultado: SalaoData = {};
    data.forEach((row: { data_type: string; data: unknown }) => {
        (resultado as Record<string, unknown>)[row.data_type] = row.data;
    });

    return resultado;
}

// ─────────────────────────────────────────────────────
// HELPERS DE ENVIO
// ─────────────────────────────────────────────────────
async function sendText(chatId: number, text: string) {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: "Markdown",
        }),
    });
}

// ─────────────────────────────────────────────────────
// HELPERS MATEMÁTICOS E DE DATA
// ─────────────────────────────────────────────────────
function isoHoje(): string {
    return new Date().toISOString().slice(0, 10);
}

function fmtData(iso: string): string {
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
}

function fmtDataExtenso(date: Date): string {
    return date.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit" });
}

function fmt$(v: number): string {
    return Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function somaFat(entries: DiarioItem[]): number {
    return entries.reduce((s, e) => s + (parseFloat(String(e.precoCobrado)) || 0) * (parseInt(String(e.qtd)) || 1), 0);
}

function somaLucro(entries: DiarioItem[]): number {
    return entries.reduce((s, e) => {
        const f = (parseFloat(String(e.precoCobrado)) || 0) * (parseInt(String(e.qtd)) || 1);
        const c = (parseFloat(String(e.custoTotal)) || 0) * (parseInt(String(e.qtd)) || 1);
        const k = (parseFloat(String(e.comissaoValor)) || 0) * (parseInt(String(e.qtd)) || 1);
        return s + f - c - k;
    }, 0);
}

function _resumoCaixa(entries: DiarioItem[], dataStr: string, label: string): string {
    const filtrado = entries.filter(e => e.data === dataStr);
    const fat = somaFat(filtrado);
    const lucro = somaLucro(filtrado);

    if (!filtrado.length) return `💰 *${label}*\n\nNenhum atendimento registrado.`;

    return `💰 *Caixa — ${label}*\n\n` +
        `Faturamento: *${fmt$(fat)}*\n` +
        `Lucro estimado: *${fmt$(lucro)}*\n` +
        `Atendimentos: *${filtrado.length}*\n` +
        `Ticket médio: *${fmt$(filtrado.length ? fat / filtrado.length : 0)}*`;
}

function match(texto: string, termos: string[]): boolean {
    return termos.some(t => texto.includes(t));
}
=======
>>>>>>> c64922ea543a091756dbc14b19a87785a9cbfb97
