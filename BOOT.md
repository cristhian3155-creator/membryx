# BOOT — Continuidad del proyecto Membryx

**Última actualización:** 2026-08-28 (sesión de deploy + integración WhatsApp Meta)

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

### Para pasar a producción real con WhatsApp (siguiente sesión)

1. Reintentar verificación del número real (`1261475567050960`) — probablemente ya pasó el
   cooldown. Pedir código, confirmarlo, registrar con el PIN `962320`.
2. Revisar si las plantillas ya se aprobaron (`payment_confirmation_v2` sigue UTILITY;
   `expiry_reminder_v2` fue reclasificada MARKETING por Meta — puede necesitar reescribirse con
   tono menos promocional para volver a UTILITY).
3. Cuando ambas cosas estén listas: cambiar `META_WHATSAPP_PHONE_NUMBER_ID=1261475567050960`,
   `META_WHATSAPP_BUSINESS_ACCOUNT_ID=1727760148479428`, `META_WHATSAPP_MESSAGE_MODE=template`
   en Railway Variables.
4. El link de pago en los recordatorios hoy va como texto plano — en modo plantilla debe migrar
   a un botón de plantilla (URL dinámica), lo que implica volver a someter las plantillas a
   revisión con ese componente agregado.

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
