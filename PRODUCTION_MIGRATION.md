# Migración DEMO → PRODUCCIÓN

## Checklist

1. **Base de datos**: crear un Postgres de producción separado (no reutilizar el de DEMO). Actualizar
   `DATABASE_URL` en los secretos del host de producción. Ejecutar `npm run prisma:migrate:deploy`.
2. **`ENVIRONMENT=production`** en las variables de entorno del host de producción.
3. **Wompi**: cambiar `WOMPI_PUBLIC_KEY` / `WOMPI_INTEGRITY_SECRET` / `WOMPI_EVENTS_SECRET` por las
   llaves de producción del comercio real. Registrar la URL de eventos de **producción** por separado de
   la de Sandbox en el dashboard de Wompi (nunca reutilizar la misma URL/credenciales entre entornos).
4. **WhatsApp**: reemplazar el Sandbox de Twilio por un número de WhatsApp Business real (Twilio o Meta
   directamente), aprobado con las plantillas de mensaje correspondientes (pago y recordatorios) según
   las reglas de Meta para mensajes fuera de la ventana de 24 horas. `TwilioWhatsAppSandboxProvider`
   puede renombrarse/ajustarse o sustituirse por otra implementación de `WhatsAppProvider` sin tocar
   `services/` ni `domain/`.
5. **Precios y duraciones reales** de los 4 planes: actualizar `*_PRICE_CENTS` / `*_DURATION_DAYS` y
   volver a correr el seed de planes (o actualizarlos manualmente — el dashboard no permite editarlos,
   por diseño).
6. **Base de clientes real**: usar el importador (`/dashboard/import`) con la plantilla oficial para
   reemplazar los datos demo. Los clientes demo tienen `demo_record=true`; pueden borrarse con:
   ```sql
   delete from customers where demo_record = true;
   ```
   (las membresías/pagos/notificaciones asociadas se deben borrar primero, o usar
   `scripts/reset-demo.ts` como referencia de orden de borrado — **no correrlo en producción**, tiene un
   guard que exige `ENVIRONMENT=demo`).
7. **Credenciales de admin**: generar un nuevo `ADMIN_PASSWORD_HASH` y `SESSION_SECRET` para producción,
   distintos a los usados en demo.
8. **HTTPS**: confirmar certificado válido en el dominio de producción.
9. **Confirmar que el proceso no duerme** (requisito del scheduler in-process, ver ARCHITECTURE.md).

## Pendiente de decisión (no bloquea el MVP, ver spec §18)

- Proveedor final de WhatsApp para producción.
- Número real del negocio.
- Configuración de Meta/WhatsApp Business Platform.
- Proveedor de pagos definitivo si cambia de Wompi.
- Precios y textos finales aprobados.
