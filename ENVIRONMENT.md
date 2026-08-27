# Variables de entorno y credenciales

Copiar `.env.example` a `.env` y completar. **Nunca commitear `.env`** (ya está en `.gitignore`).

## Negocio / configuración (no son secretos, pero definen el negocio)

| Variable | Descripción |
|---|---|
| `BUSINESS_NAME`, `BUSINESS_TIMEZONE`, `CURRENCY`, `ENVIRONMENT` | Identidad del negocio. `ENVIRONMENT` es `demo` o `production`. |
| `APP_BASE_URL` | URL pública HTTPS de la app (usada para construir `redirect-url` de Wompi). |
| `REMINDER_DAYS` | Lista de offsets de recordatorio, ej. `3,2,1,0`. |
| `*_DURATION_DAYS`, `*_PRICE_CENTS` (x4 planes) | Configuración de los 4 planes. Precios en centavos. |

## Credenciales externas requeridas

| Proveedor | Variable | Dónde obtenerla | Dónde configurarla | Entorno |
|---|---|---|---|---|
| Wompi | `WOMPI_PUBLIC_KEY` | Dashboard comercios.wompi.co → API Keys (modo Sandbox) | Backend `.env` / secretos del host | DEMO |
| Wompi | `WOMPI_INTEGRITY_SECRET` | Mismo dashboard, sección de integridad del Checkout | Backend `.env` / secretos del host | DEMO |
| Wompi | `WOMPI_EVENTS_SECRET` | Mismo dashboard, sección de Eventos/Webhooks | Backend `.env` / secretos del host | DEMO |
| Meta | `META_WHATSAPP_PHONE_NUMBER_ID` | developers.facebook.com → app "Membrix" → WhatsApp → Configuración de la API | Backend `.env` / secretos del host | DEMO (usar el número real en producción) |
| Meta | `META_WHATSAPP_ACCESS_TOKEN` | Mismo lugar: token temporal (24h, para probar hoy) o token permanente de un System User (para que no expire) | Backend `.env` / secretos del host | DEMO |
| Meta | `META_WHATSAPP_BUSINESS_ACCOUNT_ID` | Mismo lugar, WABA ID | Backend `.env` / secretos del host | DEMO |
| Meta | `META_WHATSAPP_VERIFY_TOKEN` | Cadena que ustedes inventan (ej. un UUID) — se configura igual en Meta al suscribir el webhook | Backend `.env` / secretos del host | DEMO |
| _(alternativa no usada)_ | `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` | Twilio Console → Account | Solo si se cambia `WHATSAPP_PROVIDER=twilio` | — |
| Base de datos | `DATABASE_URL` | Postgres gestionado (Supabase/Railway/Render/Neon) | Backend `.env` / secretos del host | DEMO y PRODUCCIÓN por separado |
| Dashboard | `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH` | Ustedes las definen (hash bcrypt) | Backend `.env` / secretos del host | ambos |
| Dashboard | `SESSION_SECRET` | Generar aleatorio (`openssl rand -hex 32`) | Backend `.env` / secretos del host | ambos |

Ninguna de estas credenciales debe llegar nunca al frontend/navegador.

## Estado actual (verificado en esta sesión)

- `DATABASE_URL`: **configurado** contra Supabase Postgres (pooler de sesión, puerto 5432). Migraciones
  aplicadas y datos demo sembrados con éxito.
- `WOMPI_*`: **no configuradas aún**. El checkout/webhook fueron verificados con credenciales de prueba
  autogeneradas localmente (ver `scripts/smoke-webhook.ts`), no contra el Sandbox real de Wompi.
- `META_WHATSAPP_*`: **no configuradas aún** (proveedor activo: `WHATSAPP_PROVIDER=meta`, app Meta
  "Membrix" ya existe en modo desarrollo). El envío real de WhatsApp no se ha probado; el manejo de
  errores (mensaje "no configurado" registrado en `notifications.error_message`) sí quedó verificado en
  vivo. En modo desarrollo, Meta solo entrega mensajes a números agregados como "recipient de prueba" en
  el dashboard de la app — agregar ahí el número que se vaya a usar en la demo.
- `ADMIN_EMAIL` / `ADMIN_PASSWORD_HASH`: valores de desarrollo local generados para poder probar el
  dashboard (`admin@example.com`, ver `.env` local). **Cambiar antes de cualquier despliegue público.**

## Generar un hash de contraseña de admin

```bash
node -e "console.log(require('bcryptjs').hashSync('TU_PASSWORD_AQUI', 10))"
```
