// supabase/functions/telegram-bot/index.ts
// Bot Telegram do Vellovy — Sprint 4 (migrado para novo schema)
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── ENV ────────────────────────────────────────────
const TELEGRAM_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SRK = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// ─── Tipos ──────────────────────────────────────────
interface TelegramMessage {
  chat: { id: number };
  text?: string;
  from?: { first_name?: string };
}

interface WebhookPayload {
  message?: TelegramMessage;
}

// ─── Entrada ────────────────────────────────────────
serve(async (req) => {
  if (req.method !== "POST") return new Response("OK");

  let payload: WebhookPayload;
  try { payload = await req.json(); }
  catch { return new Response("Bad request", { status: 400 }); }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SRK);

  if (payload.message?.text) {
    await handleMessage(payload.message, supabase);
  }

  return new Response("OK");
});

// ─── Handler ────────────────────────────────────────
// deno-lint-ignore no-explicit-any
async function handleMessage(msg: TelegramMessage, sb: any) {
  const chatId = msg.chat.id;
  const texto = (msg.text || "").trim();

  // 1. Busca salão vinculado
  const { data: salao } = await sb
    .from("saloes")
    .select("id, nome")
    .eq("telegram_chat_id", String(chatId))
    .maybeSingle();

  // Vincular
  if (!salao) {
    if (texto.startsWith("/vincular ")) {
      const token = texto.split(" ")[1]?.toUpperCase();
      if (!token) { await sendText(chatId, "❌ Envie: /vincular SEU_TOKEN"); return; }

      const { data: link } = await sb
        .from("telegram_link_tokens")
        .select("salao_id")
        .eq("token", token)
        .maybeSingle();

      if (!link) { await sendText(chatId, "❌ Token inválido ou expirado."); return; }

      await sb.from("saloes").update({ telegram_chat_id: String(chatId) }).eq("id", link.salao_id);
      await sb.from("telegram_link_tokens").delete().eq("token", token);
      await sendText(chatId, "✅ Bot vinculado ao seu salão! Envie /ajuda para ver os comandos.");
      return;
    }

    await sendText(chatId, "👋 Olá! Para vincular este bot, vá em *Configurações > Bot Telegram* no sistema e gere um token.\n\nDepois envie: `/vincular SEU_TOKEN`");
    return;
  }

  const salaoId = salao.id;
  const salaoNome = salao.nome || "Salão";

  // 2. Dispatch de comandos
  const t = texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  if (match(t, ["/ajuda", "ajuda", "help", "/help"])) {
    await sendText(chatId, cmdAjuda()); return;
  }
  if (match(t, ["/agenda", "agenda"])) {
    await cmdAgenda(chatId, salaoId, salaoNome, sb); return;
  }
  if (match(t, ["/caixa", "caixa"])) {
    await cmdCaixa(chatId, salaoId, sb); return;
  }
  if (match(t, ["/fechar", "fechar"])) {
    await cmdFechar(chatId, salaoId, salaoNome, sb); return;
  }
  if (match(t, ["/ticket", "ticket"])) {
    await cmdTicket(chatId, salaoId, sb); return;
  }
  if (match(t, ["/clientes", "clientes"])) {
    await cmdClientes(chatId, salaoId, sb); return;
  }
  if (match(t, ["/semana", "semana"])) {
    await cmdSemana(chatId, salaoId, sb); return;
  }

  await sendText(chatId, "🤔 Não entendi. Envie /ajuda para ver os comandos.");
}

// ─── Comandos ───────────────────────────────────────

function cmdAjuda(): string {
  return `🤖 *Comandos Vellovy*\n\n` +
    `📅 /agenda — agenda do dia\n` +
    `💰 /caixa — total do dia por forma\n` +
    `📊 /fechar — resumo completo\n` +
    `🎯 /ticket — ticket médio 30 dias\n` +
    `👥 /clientes — top 5 do mês\n` +
    `📆 /semana — receita da semana`;
}

// deno-lint-ignore no-explicit-any
async function cmdAgenda(chatId: number, salaoId: string, salaoNome: string, sb: any) {
  const hoje = isoHoje();
  const { data: agenda } = await sb
    .from("agendamentos")
    .select("data_hora, duracao_minutos, valor, status, cliente:clientes(nome), servico:servicos(nome), profissional:profissionais(nome)")
    .eq("salao_id", salaoId)
    .gte("data_hora", `${hoje}T00:00:00`)
    .lte("data_hora", `${hoje}T23:59:59`)
    .neq("status", "cancelado")
    .order("data_hora");

  if (!agenda?.length) {
    await sendText(chatId, `📅 *${salaoNome}*\n_${fmtDataExtenso(new Date())}_\n\nNenhum agendamento hoje.`);
    return;
  }

  const linhas = agenda.map((a: Record<string, unknown>) => {
    const hora = String(a.data_hora).split("T")[1]?.slice(0, 5) ?? "?";
    const cliente = (a.cliente as Record<string, string>)?.nome ?? "?";
    const servico = (a.servico as Record<string, string>)?.nome ?? "";
    const status = a.status === "confirmado" ? "✅" : a.status === "realizado" ? "🟢" : "🔵";
    return `${status} *${hora}* ${cliente}${servico ? ` — ${servico}` : ""}`;
  }).join("\n");

  await sendText(chatId,
    `📅 *Agenda — ${fmtDataExtenso(new Date())}*\n_${salaoNome}_\n\n${linhas}\n\n_${agenda.length} agendamento(s)_`
  );
}

// deno-lint-ignore no-explicit-any
async function cmdCaixa(chatId: number, salaoId: string, sb: any) {
  const hoje = isoHoje();
  const { data: lancs } = await sb
    .from("lancamentos_caixa")
    .select("valor, forma_pagamento")
    .eq("salao_id", salaoId)
    .eq("data", hoje);

  if (!lancs?.length) {
    await sendText(chatId, "💰 *Caixa Hoje*\n\nNenhum lançamento registrado.");
    return;
  }

  const total = lancs.reduce((s: number, l: Record<string, number>) => s + (l.valor ?? 0), 0);
  const porForma: Record<string, number> = {};
  lancs.forEach((l: Record<string, unknown>) => {
    const f = String(l.forma_pagamento ?? "outro");
    porForma[f] = (porForma[f] ?? 0) + Number(l.valor ?? 0);
  });

  const formas = Object.entries(porForma)
    .sort((a, b) => b[1] - a[1])
    .map(([f, v]) => `  • ${fmtForma(f)}: *${fmt$(v)}*`)
    .join("\n");

  await sendText(chatId,
    `💰 *Caixa Hoje*\n\nTotal: *${fmt$(total)}*\n${lancs.length} lançamento(s)\n\n${formas}`
  );
}

// deno-lint-ignore no-explicit-any
async function cmdFechar(chatId: number, salaoId: string, salaoNome: string, sb: any) {
  const hoje = isoHoje();

  const [{ data: lancs }, { data: agenda }] = await Promise.all([
    sb.from("lancamentos_caixa").select("valor, forma_pagamento, tipo").eq("salao_id", salaoId).eq("data", hoje),
    sb.from("agendamentos").select("status").eq("salao_id", salaoId).gte("data_hora", `${hoje}T00:00:00`).lte("data_hora", `${hoje}T23:59:59`),
  ]);

  const totalReceita = (lancs ?? []).reduce((s: number, l: Record<string, number>) => s + (l.valor ?? 0), 0);
  const servicos = (lancs ?? []).filter((l: Record<string, string>) => l.tipo === "servico").length;
  const produtos = (lancs ?? []).filter((l: Record<string, string>) => l.tipo === "produto").length;
  const realizados = (agenda ?? []).filter((a: Record<string, string>) => a.status === "realizado").length;
  const noShows = (agenda ?? []).filter((a: Record<string, string>) => a.status === "no_show").length;

  await sendText(chatId,
    `📊 *Fechamento — ${fmtDataExtenso(new Date())}*\n_${salaoNome}_\n\n` +
    `💰 Receita: *${fmt$(totalReceita)}*\n` +
    `✂️ Serviços: *${servicos}*\n` +
    `🛍️ Produtos: *${produtos}*\n` +
    `✅ Realizados: *${realizados}*\n` +
    `❌ No-shows: *${noShows}*\n` +
    `🎯 Ticket médio: *${fmt$((lancs?.length ?? 0) > 0 ? totalReceita / lancs.length : 0)}*`
  );
}

// deno-lint-ignore no-explicit-any
async function cmdTicket(chatId: number, salaoId: string, sb: any) {
  const d30 = new Date();
  d30.setDate(d30.getDate() - 30);
  const desde = d30.toISOString().split("T")[0];

  const { data: lancs } = await sb
    .from("lancamentos_caixa")
    .select("valor")
    .eq("salao_id", salaoId)
    .gte("data", desde);

  if (!lancs?.length) {
    await sendText(chatId, "🎯 *Ticket Médio*\n\nSem dados nos últimos 30 dias.");
    return;
  }

  const total = lancs.reduce((s: number, l: Record<string, number>) => s + (l.valor ?? 0), 0);
  const ticket = Math.round(total / lancs.length);

  await sendText(chatId, `🎯 *Ticket Médio — últimos 30 dias*\n\n*${fmt$(ticket)}* (${lancs.length} lançamentos)`);
}

// deno-lint-ignore no-explicit-any
async function cmdClientes(chatId: number, salaoId: string, sb: any) {
  const { data: clientes } = await sb
    .from("clientes")
    .select("nome, total_gasto, total_visitas")
    .eq("salao_id", salaoId)
    .order("total_gasto", { ascending: false })
    .limit(5);

  if (!clientes?.length) {
    await sendText(chatId, "👥 Nenhum cliente cadastrado.");
    return;
  }

  const linhas = clientes.map((c: Record<string, unknown>, i: number) => {
    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
    return `${medal} ${c.nome} — *${fmt$(Number(c.total_gasto ?? 0))}* (${c.total_visitas ?? 0} visitas)`;
  }).join("\n");

  await sendText(chatId, `👥 *Top 5 Clientes*\n\n${linhas}`);
}

// deno-lint-ignore no-explicit-any
async function cmdSemana(chatId: number, salaoId: string, sb: any) {
  const hoje = new Date();
  const inicioSemana = new Date(hoje);
  inicioSemana.setDate(hoje.getDate() - hoje.getDay());
  const desde = inicioSemana.toISOString().split("T")[0];

  const { data: lancs } = await sb
    .from("lancamentos_caixa")
    .select("valor")
    .eq("salao_id", salaoId)
    .gte("data", desde);

  const total = (lancs ?? []).reduce((s: number, l: Record<string, number>) => s + (l.valor ?? 0), 0);
  const count = lancs?.length ?? 0;

  await sendText(chatId,
    `📆 *Receita da Semana*\n\nTotal: *${fmt$(total)}*\nLançamentos: *${count}*\n` +
    `Ticket médio: *${fmt$(count > 0 ? total / count : 0)}*`
  );
}

// ─── Helpers ────────────────────────────────────────
async function sendText(chatId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
  });
}

function isoHoje(): string { return new Date().toISOString().slice(0, 10); }

function fmtDataExtenso(d: Date): string {
  return d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit" });
}

function fmt$(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtForma(f: string): string {
  const m: Record<string, string> = {
    pix: "PIX", dinheiro: "Dinheiro", credito: "Crédito",
    debito: "Débito", outro: "Outro",
  };
  return m[f] ?? f;
}

function match(t: string, terms: string[]): boolean {
  return terms.some((term) => t === term || t.startsWith(term + " "));
}
