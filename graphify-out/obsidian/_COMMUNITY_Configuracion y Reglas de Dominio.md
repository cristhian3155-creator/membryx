---
type: community
cohesion: 0.10
members: 38
---

# Configuracion y Reglas de Dominio

**Cohesion:** 0.10 - loosely connected
**Members:** 38 nodes

## Members
- [[CheckoutError]] - code - src/services/checkout-service.ts
- [[SchedulerRunSummary]] - code - src/scheduler/reminder-scheduler.ts
- [[SessionData]] - code - src/http/middleware/auth.ts
- [[app]] - code - src/server.ts
- [[app.ts]] - code - src/http/app.ts
- [[auth.routes.ts]] - code - src/http/routes/auth.routes.ts
- [[auth.ts]] - code - src/http/middleware/auth.ts
- [[authRouter]] - code - src/http/routes/auth.routes.ts
- [[bodySchema]] - code - src/http/routes/checkout.routes.ts
- [[checkout.routes.ts]] - code - src/http/routes/checkout.routes.ts
- [[checkoutRouter]] - code - src/http/routes/checkout.routes.ts
- [[config]] - code - src/config/index.ts
- [[configindex.ts]] - code - src/config/index.ts
- [[createApp()]] - code - src/http/app.ts
- [[csvIntArray()]] - code - src/config/index.ts
- [[dashboard.routes.ts]] - code - src/http/routes/dashboard.routes.ts
- [[dashboardRouter]] - code - src/http/routes/dashboard.routes.ts
- [[envSchema]] - code - src/config/index.ts
- [[express-session_2]] - code - src/http/middleware/auth.ts
- [[import.routes.ts]] - code - src/http/routes/import.routes.ts
- [[importRouter]] - code - src/http/routes/import.routes.ts
- [[intFromString()]] - code - src/config/index.ts
- [[isDemo]] - code - src/config/index.ts
- [[metaWebhookRouter]] - code - src/http/routes/meta-webhook.routes.ts
- [[parsed]] - code - src/config/index.ts
- [[reminder-scheduler.ts]] - code - src/scheduler/reminder-scheduler.ts
- [[reminderOffsetForToday()]] - code - src/domain/reminders.ts
- [[reminders.test.ts]] - code - tests/unit/reminders.test.ts
- [[reminders.ts]] - code - src/domain/reminders.ts
- [[requireAuth()]] - code - src/http/middleware/auth.ts
- [[run-once.ts]] - code - src/scheduler/run-once.ts
- [[runReminderScheduler()]] - code - src/scheduler/reminder-scheduler.ts
- [[schedulerindex.ts]] - code - src/scheduler/index.ts
- [[server.ts]] - code - src/server.ts
- [[startScheduler()]] - code - src/scheduler/index.ts
- [[syncMembershipStatuses()]] - code - src/scheduler/reminder-scheduler.ts
- [[upload]] - code - src/http/routes/import.routes.ts
- [[webhookRouter]] - code - src/http/routes/webhook.routes.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Configuracion_y_Reglas_de_Dominio
SORT file.name ASC
```

## Connections to other communities
- 22 edges to [[_COMMUNITY_Servicios de Pago y Notificacion]]
- 21 edges to [[_COMMUNITY_Generacion de Datos Demo]]
- 4 edges to [[_COMMUNITY_Importacion de Clientes (CSVXLSX)]]
- 2 edges to [[_COMMUNITY_Integracion WhatsApp]]

## Top bridge nodes
- [[configindex.ts]] - degree 23, connects to 4 communities
- [[config]] - degree 16, connects to 4 communities
- [[import.routes.ts]] - degree 12, connects to 3 communities
- [[reminder-scheduler.ts]] - degree 18, connects to 2 communities
- [[runReminderScheduler()]] - degree 11, connects to 2 communities