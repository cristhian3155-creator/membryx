# Membryx — MVP de Pagos, Membresías y Recordatorios WhatsApp

MVP funcional para negocios con membresías (piloto: gimnasio) que resuelve el flujo:

```
Cliente → Wompi Checkout → Webhook Wompi → Registrar pago → Renovar membresía
        → Confirmación WhatsApp → Scheduler diario → Recordatorios D-3/D-2/D-1/D-0
```

Ver también: [ARCHITECTURE.md](./ARCHITECTURE.md) · [SETUP.md](./SETUP.md) · [DEMO.md](./DEMO.md) ·
[ENVIRONMENT.md](./ENVIRONMENT.md) · [PRODUCTION_MIGRATION.md](./PRODUCTION_MIGRATION.md) · [FUTURE.md](./FUTURE.md)

## Stack

Node 24 + TypeScript + Express, Prisma + PostgreSQL, `node-cron`, Wompi Web Checkout, Twilio WhatsApp Sandbox,
dashboard server-rendered con EJS. Ver la justificación completa en [ARCHITECTURE.md](./ARCHITECTURE.md).

## Comandos principales

```bash
npm install                 # instalar dependencias
npm run prisma:migrate      # aplicar migraciones (requiere DATABASE_URL)
npm run db:seed:demo        # poblar ~500 clientes demo con escenarios deterministas
npm run db:reset:demo       # borrar y regenerar la base demo
npm run dev                 # servidor de desarrollo (http://localhost:3000)
npm run scheduler:run       # ejecutar el job de recordatorios una sola vez
npm test                    # pruebas unitarias
```

Detalle de instalación y arranque en [SETUP.md](./SETUP.md).

## Estado del MVP

Implementado y verificado en vivo contra una base Postgres real (Supabase, entorno DEMO):
checkout, webhook (firma, idempotencia, APPROVED/DECLINED), renovación de membresía, scheduler de
recordatorios, dashboard, importador CSV/XLSX, seed de 500 clientes demo.

Pendiente de credenciales externas para verificación 100% en vivo: Wompi Sandbox (checkout real) y
Twilio WhatsApp Sandbox (envío real). Ver [ENVIRONMENT.md](./ENVIRONMENT.md) para la lista de
variables/credenciales requeridas y dónde obtenerlas.
