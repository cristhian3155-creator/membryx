# BOOT — Continuidad del proyecto Membryx

**Última actualización:** 2026-08-29 (sesión "a producción": templates en WABA real, scripts de
promoción/purga, diagnóstico del bloqueo de verificación del número)

Este archivo es el punto de partida para retomar el proyecto en una conversación nueva.
Léelo completo antes de tocar código. La documentación general del proyecto (arquitectura,
setup, demo, entorno, migración a producción) ya existe y sigue vigente — no la repitas aquí:

- [README.md](./README.md) — resumen y comandos
- [ARCHITECTURE.md](./ARCHITECTURE.md) — decisiones de arquitectura y por qué
- [SETUP.md](./SETUP.md) — instalación y despliegue
- [DEMO.md](./DEMO.md) — guion de demostración
- [ENVIRONMENT.md](./ENVIRONMENT.md) — variables y credenciales
- [PRODUCTION_MIGRATION.md](./PRODUCTION_MIGRATION.md) — checklist demo → producción
- [FUTURE.md](./FUTURE.md) — mejoras fuera de alcance, documentadas y no implementadas
- `graphify-out/GRAPH_REPORT.md` y `graphify-out/graph.html` — grafo de conocimiento del código,
  útil para preguntas de arquitectura sin releer todo el repo (`graphify query "<pregunta>"`)

Este documento cubre lo que pasó **en la sesión anterior** que esos archivos no capturan:
estado operativo real, credenciales activas, y qué quedó pendiente.

---

## Estado operativo (verificado en vivo, no solo en código)

- **Deploy:** https://membryx-production.up.railway.app — Railway, conectado a GitHub, auto-deploy
  en cada push a `main`. Custom Start Command: `npx prisma migrate deploy && npm start`.
- **Base de datos:** Supabase Postgres (pooler de sesión). Migrada, con ~500 clientes demo +
  2 clientes de prueba reales creados en esta sesión (ver abajo).
- **Repo:** github.com/cristhian3155-creator/membryx, rama `main`. Todo commiteado y pusheado
  directo a `main` (no hay PR pendiente ni rama sin mergear — se verificó con `git status` y
  `git log origin/main..HEAD` limpio antes de escribir este archivo).
- **Login admin del dashboard:** `membryx.ia@gmail.com` / ver `ADMIN_PASSWORD_HASH` en Railway
  Variables (la contraseña en texto plano no quedó guardada en ningún archivo, solo se mostró
  una vez en el chat de la sesión anterior).

## Pagos — Wompi Sandbox: ✅ funcionando al 100%, probado con dinero de prueba real

Checkout → pago aprobado real en Wompi Sandbox → webhook validado (checksum dinámico) →
membresía renovada con la fecha correcta → todo confirmado en producción, no solo en local.
Webhook de Wompi registrado en modo Sandbox del dashboard de Wompi apuntando a
`https://membryx-production.up.railway.app/webhooks/wompi`.

## WhatsApp — Meta Cloud API: 🟡 funcionando parcialmente

**Lo que SÍ funciona hoy:** confirmación de pago y recordatorios (D-3/D-2/D-1/D-0) se envían y
llegan de verdad por WhatsApp, **en modo texto libre** (`META_WHATSAPP_MESSAGE_MODE=text`), con
link de pago real incluido en los recordatorios. Verificado en vivo con dos clientes de prueba.

**Por qué modo texto y no plantillas:** los mensajes iniciados por el negocio requieren una
plantilla aprobada por Meta fuera de la ventana de 24h de conversación. Nuestras plantillas
propias (`payment_confirmation_v2`, `expiry_reminder_v2`) siguen `PENDING` de revisión. El modo
texto solo entrega si el cliente escribió primero (ventana de 24h) — por eso el número de prueba
`+57 310 5974565` es el único destinatario habilitado para recibir mensajes reales ahora mismo.

**App de Meta:** "Membrix", `app_id = 27614364914912037`.

- WABA de prueba (la que se está usando activamente): `37739441525702105`
  - Número remitente activo: `+1 555 674 1232`, `phone_number_id = 1291442850716192`
- WABA real de producción (creada, número agregado, **sin verificar todavía**): `1727760148479428`
  - Número real: `+57 310 5974565`, `phone_number_id = 1261475567050960`
  - **Pendiente:** pedir código de verificación SMS/voz — Meta ha devuelto repetidamente
    "espera 1 hora" (`error_subcode 2388091`). Nunca se completó. Hay que reintentar
    `POST /{phone_number_id}/request_code?code_method=SMS&language=es` más tarde.
  - PIN de verificación en dos pasos ya asignado a este número: `962320` (no confirmado aún
    porque el registro nunca se completó — guardarlo para cuando se complete el paso 4 del
    registro, `POST /{phone_number_id}/register`).
- WABA vacía duplicada, **pendiente de borrar manualmente** (no se puede por API):
  `1806224457228690` — Configuración → Cuentas de WhatsApp → `...` → Eliminar.
- Token de acceso activo: **System User "Membrix_WhatsApp_API" (permanente, no expira)**,
  guardado en `META_WHATSAPP_ACCESS_TOKEN` (local `.env` y Railway Variables). Si hace falta uno
  nuevo: Business Settings → Usuarios del sistema → Membrix_WhatsApp_API → Generar token
  (permisos `whatsapp_business_management` + `whatsapp_business_messaging`).
- Webhook de Meta ya suscrito automáticamente (vía MCP `devtools_webhook_manage`) apuntando a
  `https://membryx-production.up.railway.app/webhooks/meta`.

### Avances de la sesión 2026-08-29

- **Plantillas en la WABA de PRUEBA `37739441525702105`: las dos APROBADAS.**
  `payment_confirmation_v2` (UTILITY) y `expiry_reminder_v2` (Meta la reclasificó a MARKETING).
- **Plantillas recreadas en la WABA de PRODUCCIÓN `1727760148479428`** (no se transfieren entre
  WABAs). Ambas `PENDING`, ambas sometidas como UTILITY:
  - `payment_confirmation_v2` (id `929206556901076`) — texto idéntico al aprobado.
  - `expiry_reminder_v2` (id `1552314305941720`) — **reescrita en tono transaccional** para que
    entre como UTILITY y no como MARKETING: _"Hola {{1}}, te informamos que tu membresia {{2}}
    vence el {{3}}. Si ya renovaste tu pago, puedes ignorar este mensaje."_ (3 params posicionales,
    mismo orden que arma `meta-provider.ts`: nombre, plan, fecha ISO).
- **App suscrita a la WABA de producción** (`POST /1727760148479428/subscribed_apps` → ok) para
  que los webhooks lleguen cuando se cambie de WABA.
- **Verificación del número real `1261475567050960`: BLOQUEO IDENTIFICADO.** `request_code` lleva
  >24h devolviendo `error_subcode 2388091` con `is_transient:false`. No es cooldown: el número
  `+57 310 5974565` **tiene una cuenta de WhatsApp activa** (es el teléfono real desde el que se
  "escribió primero" en la demo). No se puede registrar en la Cloud API mientras esté en uso en
  la app. **Decisión tomada con el usuario:** va a borrar esa cuenta de WhatsApp (Ajustes →
  Cuenta → Eliminar mi cuenta), esperar unas horas, y reintentar el registro.
  PIN de verificación en dos pasos para ese número: `962320`.
- **Scripts nuevos** (`package.json`): `npm run db:promote:production` (marca el Business como
  `production` y re-sincroniza los 4 planes desde el env; no toca clientes) y
  `npm run db:purge:demo -- --confirm` (borra clientes `demo_record=true` + su cascada +
  `webhook_events` + `scheduler_runs`; guard: exige `ENVIRONMENT=production` y `--confirm`).
- **Secretos de producción generados** (esta sesión, en el chat — NO commiteados): nuevos
  `ADMIN_PASSWORD_HASH` y `SESSION_SECRET`. Contraseña admin en claro mostrada una sola vez;
  guardarla en gestor y rotar.

### Identidad visual del panel por negocio (hecho 2026-08-29)

El dashboard EJS se parametrizó para vestirse con la marca de cada cliente sin tocar código:

- Variables nuevas (todas opcionales, con default = marca Membryx índigo):
  `BRAND_NAME`, `BRAND_PRIMARY`, `BRAND_PRIMARY_DARK`, `BRAND_ACCENT` (colores hex, validados con
  zod), `BRAND_LOGO_URL`, `BRAND_FAVICON_URL`. Expuestas en `config.brand`.
- `src/http/app.ts`: middleware que inyecta `res.locals.business` y `res.locals.brand` en todas
  las vistas (ya no hace falta pasarlos por cada `res.render`).
- `partials/head.ejs`: inyecta `tailwind.config` (colores `brand` / `brand-dark` / `brand-accent`)
  + CSS vars `--brand-*`, `<title>` y favicon desde `brand`.
- `partials/nav.ejs` + `login.ejs`: logo opcional, nombre desde `brand.name`, el tag
  `(environment)` solo se muestra fuera de producción.
- Todas las clases `indigo-600/700` de las vistas pasaron a `brand` / `brand-dark`. Los colores
  de estado (emerald/amber/red) se dejaron intactos a propósito.
- Para Yeye: setear en Railway `BRAND_NAME="Yeye Trainer GYM"` y sus colores/logo cuando los dé.
- Nota: el panel usa Tailwind por CDN (`cdn.tailwindcss.com`); el navegador embebido de esta
  sesión lo bloquea, así que la verificación visual fue por HTML renderizado, no screenshot.
  Typecheck + tests (12) en verde.

### Checklist restante para producción

1. **WhatsApp — número:** usuario borra WhatsApp de `+57 310 5974565` → reintentar
   `POST /1261475567050960/request_code?code_method=SMS&language=es` → `POST .../verify_code`
   con el código → `POST /1261475567050960/register` con `pin=962320`.
2. **WhatsApp — plantillas:** confirmar que `payment_confirmation_v2` y `expiry_reminder_v2` en
   la WABA `1727760148479428` pasaron a `APPROVED`.
3. **WhatsApp — env (Railway):** `META_WHATSAPP_PHONE_NUMBER_ID=1261475567050960`,
   `META_WHATSAPP_BUSINESS_ACCOUNT_ID=1727760148479428`, `META_WHATSAPP_MESSAGE_MODE=template`.
4. **Wompi:** usuario está creando la cuenta de comercio real. Cuando tenga las llaves de
   producción (`pub_prod_...` / `prod_integrity_...` / `prod_events_...`): cargarlas en Railway y
   registrar la URL de eventos de **producción** en el dashboard de Wompi apuntando a
   `https://membryx-production.up.railway.app/webhooks/wompi` (separada de la de Sandbox).
5. **Base de datos:** `ENVIRONMENT=production` + `APP_BASE_URL` real en Railway →
   `npm run db:promote:production` → `npm run db:purge:demo -- --confirm` → importar el CSV real
   de clientes por `/dashboard/import` (el usuario lo tiene).
6. **Admin/sesión:** cargar en Railway el `ADMIN_PASSWORD_HASH` y `SESSION_SECRET` nuevos.
7. **(Follow-up, no bloquea):** el link de pago en el recordatorio, en modo plantilla, hoy no se
   envía (el código solo manda 3 params de body, sin botón). Migrar a un botón URL dinámico
   implica re-someter la plantilla con ese componente y pasar `checkoutUrl` como 4º param en
   `meta-provider.ts`. Mientras tanto el recordatorio en modo plantilla llega sin link.
8. **(Follow-up):** borrar la WABA vacía duplicada `1806224457228690` (manual, no por API).

## Clientes de prueba creados en esta sesión (no son parte del seed original de 500)

- **Demo Cliente D-0** (uno de los 500 del seed): su teléfono se sobreescribió a
  `+573105974565` (el real) para poder probar envío real — originalmente tenía un teléfono falso
  del seed.
- **Yeye Remirez**: cliente nuevo creado en esta sesión, plan mensual, pago simulado válido
  (firma real de Wompi), membresía activa hasta 2026-09-27, con las 5 notificaciones (pago +
  4 recordatorios) enviadas y confirmadas `SENT`.

## Bugs reales encontrados y corregidos en esta sesión (ya en `main`)

1. `package.json` `start` apuntaba a `dist/server.js`, pero `tsconfig.json` (`rootDir: "."`)
   compila a `dist/src/server.js` → crash inmediato en Railway. Corregido.
2. Las vistas EJS del dashboard no se copiaban al build (`tsc` solo compila `.ts`) → hubiera
   crasheado en cualquier ruta que renderizara una vista. Se agregó `scripts/copy-views.js` al
   build.
3. Faltaba `postinstall: prisma generate` — necesario para que el cliente de Prisma se genere en
   cualquier entorno de build limpio (Railway, o cualquier `npm install` sin cache local).
4. `sendReminderNotification` perdía el `this` del proveedor al extraer
   `provider.sendExpiryNotice` como referencia suelta antes de invocarla → crash silencioso en
   el recordatorio D-0. Estaba oculto porque Twilio fallaba antes por falta de credenciales.
   Corregido: se llama como método directamente.

## Regla de oro para la siguiente sesión

No hay nada bloqueado por código — todo lo pendiente depende de tiempos externos de Meta
(aprobación de plantillas, cooldown de verificación de número). Si vas a seguir el trabajo,
empieza por el punto "Para pasar a producción real con WhatsApp" de arriba.
