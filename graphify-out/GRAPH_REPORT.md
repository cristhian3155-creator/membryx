# Graph Report - C:/Users/meret/OneDrive/Escritorio/Membryx  (2026-08-27)

## Corpus Check
- Corpus is ~17,981 words - fits in a single context window. You may not need a graph.

## Summary
- 289 nodes · 488 edges · 21 communities (11 shown, 10 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 12 edges (avg confidence: 0.81)
- Token cost: 60,000 input · 6,482 output

## Community Hubs (Navigation)
- Configuracion y Reglas de Dominio
- Arquitectura del Backend
- Integracion WhatsApp
- Generacion de Datos Demo
- Dependencias de Produccion
- Dependencias de Desarrollo
- Scripts de package.json
- Configuracion de Build (tsconfig)
- Servicios de Pago y Notificacion
- Proveedor de Pago Wompi
- Importacion de Clientes (CSV/XLSX)
- Interactividad del Sitio de Marketing
- Contrato del Proveedor de Pago
- Mejoras Futuras Pendientes
- Migracion a Produccion
- Esquema de Datos
- Configuracion de Base de Datos
- Soporte Multi-negocio (futuro)
- Cuenta de WhatsApp Business
- Pasos de Instalacion
- Prueba de Humo del Webhook

## God Nodes (most connected - your core abstractions)
1. `config` - 16 edges
2. `scripts` - 14 edges
3. `Membryx` - 14 edges
4. `prisma` - 13 edges
5. `compilerOptions` - 13 edges
6. `SendMessageResult` - 11 edges
7. `runReminderScheduler()` - 11 edges
8. `businessToday()` - 10 edges
9. `toDateOnly()` - 10 edges
10. `WhatsAppProvider` - 9 edges

## Surprising Connections (you probably didn't know these)
- `Membrix` --implements--> `Membryx`  [EXTRACTED]
  marketing/index.html → README.md
- `Membryx` --includes--> `Dashboard`  [EXTRACTED]
  README.md → ARCHITECTURE.md
- `Membryx` --uses--> `Express`  [EXTRACTED]
  README.md → ARCHITECTURE.md
- `Membryx` --uses--> `node-cron`  [EXTRACTED]
  README.md → ARCHITECTURE.md
- `Membryx` --uses--> `PostgreSQL`  [EXTRACTED]
  README.md → ARCHITECTURE.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Payment Processing Flow** — architecture_wompi, architecture_webhook_handler, architecture_membership_renewal, architecture_idempotency [INFERRED 0.85]
- **Notification and Reminder System** — architecture_scheduler, architecture_scheduler_cron_expression, architecture_twilio_whatsapp, architecture_whatsapp_provider [INFERRED 0.85]
- **Provider Interface Pattern** — architecture_payment_provider, architecture_wompi_provider, architecture_whatsapp_provider, architecture_twilio_whatsapp [EXTRACTED 1.00]

## Communities (21 total, 10 thin omitted)

### Community 0 - "Configuracion y Reglas de Dominio"
Cohesion: 0.10
Nodes (23): config, envSchema, isDemo, parsed, reminderOffsetForToday(), createApp(), express-session, requireAuth() (+15 more)

### Community 1 - "Arquitectura del Backend"
Cohesion: 0.07
Nodes (29): Dashboard, EJS, Express, Idempotency Layer, Membership Renewal Logic, node-cron, PostgreSQL, Prisma (+21 more)

### Community 2 - "Integracion WhatsApp"
Cohesion: 0.17
Nodes (11): messageTemplates, MetaWhatsAppCloudProvider, MetaWhatsAppConfig, toE164Digits(), toWhatsAppAddress(), TwilioConfig, TwilioWhatsAppSandboxProvider, ExpiryReminderInput (+3 more)

### Community 3 - "Generacion de Datos Demo"
Cohesion: 0.14
Nodes (20): resetDemo(), FIRST_NAMES, LAST_NAMES, mulberry32(), PLAN_CODES, randomPhone(), seedDemo(), PLAN_DEFINITIONS (+12 more)

### Community 4 - "Dependencias de Produccion"
Cohesion: 0.07
Nodes (27): bcryptjs, csv-parse, dotenv, ejs, exceljs, express, express-session, luxon (+19 more)

### Community 5 - "Dependencias de Desarrollo"
Cohesion: 0.08
Nodes (25): devDependencies, prisma, tsx, @types/bcryptjs, @types/ejs, @types/express, @types/express-session, @types/luxon (+17 more)

### Community 6 - "Scripts de package.json"
Cohesion: 0.09
Nodes (21): description, engines, node, name, private, scripts, build, db:reset:demo (+13 more)

### Community 7 - "Configuracion de Build (tsconfig)"
Cohesion: 0.10
Nodes (20): dist, ES2022, node_modules, scripts, src, compilerOptions, esModuleInterop, forceConsistentCasingInFileNames (+12 more)

### Community 8 - "Servicios de Pago y Notificacion"
Cohesion: 0.24
Nodes (12): buildSignedEvent(), main(), prisma, getPaymentProvider(), getWhatsAppProvider(), createCheckoutIntent(), generateReference(), sendPaymentConfirmationNotification() (+4 more)

### Community 9 - "Proveedor de Pago Wompi"
Cohesion: 0.18
Nodes (10): CheckoutLinkRequest, CheckoutLinkResult, NormalizedPaymentEvent, PaymentProvider, PaymentStatusValue, WebhookVerificationResult, getByPath(), WOMPI_TO_INTERNAL_STATUS (+2 more)

### Community 10 - "Importacion de Clientes (CSV/XLSX)"
Cohesion: 0.20
Nodes (12): EXAMPLE_ROWS, lines, outPath, IMPORT_COLUMNS, ImportRowError, readRawRows(), readXlsxRows(), VALID_PLAN_CODES (+4 more)

## Knowledge Gaps
- **103 isolated node(s):** `name`, `version`, `private`, `description`, `type` (+98 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `config` connect `Configuracion y Reglas de Dominio` to `Servicios de Pago y Notificacion`, `Importacion de Clientes (CSV/XLSX)`, `Integracion WhatsApp`, `Generacion de Datos Demo`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Dependencias de Produccion` to `Scripts de package.json`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Dependencias de Desarrollo` to `Scripts de package.json`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _103 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Configuracion y Reglas de Dominio` be split into smaller, more focused modules?**
  _Cohesion score 0.09672830725462304 - nodes in this community are weakly interconnected._
- **Should `Arquitectura del Backend` be split into smaller, more focused modules?**
  _Cohesion score 0.07389162561576355 - nodes in this community are weakly interconnected._
- **Should `Generacion de Datos Demo` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._