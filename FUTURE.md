# Fuera de alcance / mejoras futuras

Documentado y **no implementado**, según la política de alcance del BOOT §22.

- **Reintento automático programado de notificaciones fallidas.** Hoy una notificación `FAILED` se
  reintenta solo en la siguiente corrida del scheduler que vuelva a evaluar esa membresía/offset (o al
  reenviar manualmente el pago). No hay una cola de reintentos con backoff.
- **Matching de duplicados en importación por teléfono.** El importador solo deduplica/actualiza por
  `external_id`; si una fila no trae `external_id`, siempre crea un cliente nuevo aunque el teléfono ya
  exista. Mejora futura: heurística de matching por teléfono con confirmación manual.
- **Multi-negocio / roles de usuario en el dashboard.** El MVP asume un solo negocio y un solo usuario
  admin. Multiempresa visible como SaaS está explícitamente fuera de alcance (spec §2).
- **Cobro recurrente automático con tarjeta.** Fuera de alcance por diseño; cada ciclo requiere que el
  cliente vuelva a pagar por Wompi Web Checkout.
- **Reportería avanzada / analítica.** El dashboard cubre solo las vistas mínimas del spec §12.
- **Transacciones atómicas de extremo a extremo en el webhook.** La actualización del pago y la
  renovación de membresía no están envueltas en una única transacción de base de datos (ver
  ARCHITECTURE.md); el guard `payment.status !== 'APPROVED'` mitiga el caso práctico de doble
  procesamiento, pero una carrera de dos webhooks concurrentes para el mismo pago en la ventana exacta
  entre lectura y escritura no está 100% cerrada. Volumen esperado de un gimnasio la hace un riesgo bajo
  para el MVP.
- **Cola de trabajo para el scheduler.** Corre in-process con `node-cron`; para volúmenes mucho mayores
  de clientes convendría moverlo a un job runner dedicado.
