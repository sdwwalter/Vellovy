// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: 0.1, // 10% das transações em produção
  
  // Session Replay (opcional — aumenta uso de cota)
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,

  // Ambiente
  environment: process.env.NODE_ENV,
  
  // Ignorar erros conhecidos de navegador
  ignoreErrors: [
    "ResizeObserver loop",
    "Non-Error exception captured",
    "AbortError",
  ],
  
  enabled: process.env.NODE_ENV === "production",
});
