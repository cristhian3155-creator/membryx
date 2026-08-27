# Instalación y ejecución

## Requisitos

- Node.js 20+ (probado con v24)
- Una base de datos PostgreSQL accesible (Supabase, Railway, Render, Neon, o local)

## Pasos

```bash
npm install
cp .env.example .env
# completar .env: al menos DATABASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD_HASH, SESSION_SECRET
# (ver ENVIRONMENT.md para el resto de credenciales)

npm run prisma:migrate      # crea las tablas en DATABASE_URL
npm run db:seed:demo        # puebla ~500 clientes demo

npm run dev                 # http://localhost:3000
```

Login por defecto en desarrollo local (si usas el `.env` generado en esta sesión):
`admin@example.com` / `demo1234`. **Cambiar en cualquier entorno compartido.**

## Comandos útiles

```bash
npm run db:reset:demo       # borra y regenera la base demo desde cero
npm run scheduler:run       # ejecuta el job de recordatorios una vez (útil para el demo script)
npm test                    # pruebas unitarias de dominio
npx tsc --noEmit            # chequeo de tipos
npx tsx scripts/smoke-webhook.ts   # prueba end-to-end del webhook con credenciales de prueba
```

`smoke-webhook.ts` no requiere credenciales reales de Wompi: acepta cualquier valor no vacío para
`WOMPI_PUBLIC_KEY` / `WOMPI_INTEGRITY_SECRET` / `WOMPI_EVENTS_SECRET` pasado como variable de entorno al
invocarlo, y firma sus propios eventos simulados con ese secreto. Sirve para validar el pipeline completo
(checkout → webhook → renovación → notificación) sin depender de Wompi/Twilio reales.

## Build de producción

```bash
npm run build
npm start
```

## Despliegue

Cualquier host que corra un proceso Node persistente con HTTPS (Railway, Render, Fly.io) sirve. Pasos:

1. Crear el servicio apuntando a este repo, build command `npm run build`, start command `npm start`.
2. Configurar todas las variables de `ENVIRONMENT.md` como secretos del host.
3. Ejecutar `npm run prisma:migrate:deploy` contra la base del entorno (una vez, o como paso de deploy).
4. Confirmar que el proceso NO se duerme (necesario para que `node-cron` corra a diario) — usar un plan
   que mantenga el proceso vivo, no un tier "sleep on idle".
5. Una vez desplegado y con HTTPS público, registrar `https://<tu-dominio>/webhooks/wompi` como URL de
   eventos en el dashboard de Wompi (Sandbox primero).
