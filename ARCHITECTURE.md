# Arquitectura

## Decisión y justificación

El BOOT propone Supabase (Postgres + `pg_cron` + Edge Functions en Deno) como arquitectura inicial. Al
inspeccionar el entorno de desarrollo se encontró: sin Docker, sin Supabase CLI, sin `psql` instalados
localmente. Levantar la pila local de Supabase (`supabase start`) requiere Docker; no era razonable
instalarlo solo para evitar un runtime extra.

**Sustitución aplicada (autorizada por la regla de alcance del BOOT §4):** un monolito Node/TypeScript
único que:

- habla con Postgres directamente vía Prisma (puede ser Postgres de Supabase, Railway, Render o Neon —
  el proyecto no depende de ninguna funcionalidad propietaria de Supabase, solo de Postgres estándar);
- corre el scheduler diario **in-process** con `node-cron`, en vez de `pg_cron` + Edge Functions.

Justificación: evita el split de runtime (Node + Deno), no requiere Docker/CLI locales, y es igualmente
confiable siempre que el proceso Node se mantenga vivo (host con proceso persistente, no serverless con
cold starts). Este es el trade-off documentado: **el hosting elegido debe ser un proceso persistente**
(Railway/Render en su plan que no duerme), no una plataforma serverless pura.

La base de datos DEMO efectivamente usada es **Postgres gestionado por Supabase** (el usuario ya tenía un
proyecto provisionado), pero se accede solo vía `DATABASE_URL` estándar — no se usan Supabase Auth, RLS,
Storage, Edge Functions ni Realtime. Esto mantiene la arquitectura portable a cualquier Postgres.

## Diagrama

```
Cliente → Dashboard (EJS, sesión) → Backend Express/TS → Prisma → Postgres (Supabase)
                                          │                              ▲
                                          ├── Wompi Web Checkout (link)  │
                                          ├── Webhook Wompi (POST) ──────┘
                                          ├── Twilio WhatsApp Sandbox
                                          └── node-cron (diario, 08:00 America/Bogota)
```

## Estructura del repositorio

```
src/
  config/            capa única de configuración (Zod sobre process.env)
  db/                cliente Prisma
  domain/             lógica pura: cálculo de renovación, recordatorios, fechas (con tests)
  integrations/
    payments/wompi/   PaymentProvider + WompiProvider (checksum dinámico, checkout link)
    whatsapp/twilio/  WhatsAppProvider + TwilioWhatsAppSandboxProvider + plantillas
  services/           checkout, webhook, membership, notification, import (orquestación)
  http/               Express app, rutas, middleware de auth
  scheduler/          job diario de recordatorios
  dashboard/views/    vistas EJS
prisma/schema.prisma  modelo de datos (7 entidades del BOOT + SchedulerRun)
scripts/              seed demo, reset demo, plantilla de import, smoke test de webhook
tests/unit/           pruebas de dominio (renovación, recordatorios)
templates/            plantilla oficial de importación CSV
```

## Modelo de datos

Las 7 entidades mínimas del BOOT (`businesses, plans, customers, memberships, payments, notifications,
webhook_events`) más una tabla operativa mínima `scheduler_runs` (traza de ejecuciones del scheduler,
necesaria para mostrar su estado en el dashboard, spec §12). Índices/unicidades relevantes:

- `payments`: único por `reference` y por `(provider, providerTransactionId)` — evita pagos duplicados.
- `notifications`: único por `(membershipId, type, offsetDays, scheduledFor)` — evita recordatorios
  duplicados para el mismo ciclo de vigencia; y por `(paymentId, type)` para confirmaciones de pago.
- `webhook_events`: único por `(provider, providerEventId)` — deduplicación de entregas repetidas.
- `payments.planId` (adición sobre el mínimo del BOOT): necesario para que el webhook sepa qué plan
  renovar sin depender de estado mutable externo; documentado aquí para que quede explícito el porqué.

## Regla crítica de renovación

Implementada en [src/domain/membership.ts](./src/domain/membership.ts), con 12 tests unitarios que
cubren los dos ejemplos explícitos del spec (anticipada y tras vencimiento), los 4 planes, y el caso
límite del pago el mismo día del vencimiento.

## Idempotencia

Tres capas independientes:

1. `webhook_events` único por `(provider, providerEventId)` — bloquea reenvíos idénticos del mismo evento.
2. Verificación `payment.status !== 'APPROVED'` antes de renovar — bloquea doble renovación aunque
   lleguen dos eventos APPROVED distintos para el mismo pago.
3. `notifications` único por `(membershipId, type, offsetDays, scheduledFor)` — bloquea reenvío del mismo
   recordatorio; una notificación ya `SENT` nunca se reintenta, una `FAILED`/`PENDING` sí (ver
   [FUTURE.md](./FUTURE.md) para el límite conocido de esto).

Verificado en vivo con [scripts/smoke-webhook.ts](./scripts/smoke-webhook.ts): evento válido, evento
duplicado, evento DECLINED (no renueva), firma inválida (rechazada con 400).

## Seguridad (mínimo MVP, ver también ENVIRONMENT.md)

- Webhook valida checksum SHA-256 leyendo `signature.properties` dinámicamente (no hardcodea campos).
- Dashboard protegido por sesión (`express-session`) + usuario admin único (bcrypt).
- Secretos solo en variables de entorno, nunca en el repo (`.env` en `.gitignore`).
- No se almacenan datos de tarjeta/CVV: el pago ocurre en Wompi Web Checkout.
- **Limitación documentada del MVP:** un solo usuario admin (sin roles), sesión en memoria (no
  distribuida — no correr múltiples instancias del proceso sin mover el store de sesión a algo
  compartido). Aceptable para el alcance de demo/piloto de un solo negocio.

## Sustituibilidad de proveedores

`PaymentProvider` y `WhatsAppProvider` son interfaces; `WompiProvider` y
`TwilioWhatsAppSandboxProvider` son la única implementación. Cambiar de proveedor no debe tocar
`services/` ni `domain/`.
