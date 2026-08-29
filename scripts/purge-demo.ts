import { prisma } from "../src/db/client";
import { config } from "../src/config";

/**
 * Borra TODOS los datos de prueba de la instancia de producción:
 *  - clientes con demo_record=true y sus membresías / pagos / notificaciones
 *  - webhook_events (eventos de Sandbox ya procesados) y scheduler_runs (traza de estado)
 *
 * NO toca clientes reales (demo_record=false), ni el Business ni los Plans.
 *
 * Guardas: requiere ENVIRONMENT=production y confirmación explícita:
 *   npx tsx scripts/purge-demo.ts --confirm
 *   (o PURGE_DEMO_CONFIRM=yes npx tsx scripts/purge-demo.ts)
 */

async function purge() {
  if (config.business.environment !== "production") {
    throw new Error(
      "purge-demo solo corre con ENVIRONMENT=production (para no borrar la base demo por error). Actual: " +
        config.business.environment
    );
  }

  const confirmed =
    process.argv.includes("--confirm") || process.env.PURGE_DEMO_CONFIRM === "yes";
  if (!confirmed) {
    throw new Error(
      "Falta confirmación. Reejecutá con --confirm (o PURGE_DEMO_CONFIRM=yes) si de verdad querés borrar los datos demo."
    );
  }

  const demoCustomers = await prisma.customer.findMany({
    where: { demoRecord: true },
    select: { id: true },
  });
  const demoIds = demoCustomers.map((c) => c.id);
  const realCount = await prisma.customer.count({ where: { demoRecord: false } });

  console.log(
    `[purge-demo] clientes demo a borrar: ${demoIds.length} — clientes reales que se conservan: ${realCount}`
  );

  if (demoIds.length === 0) {
    console.log("[purge-demo] no hay clientes demo. Limpiando solo trazas...");
  }

  const notifications = await prisma.notification.deleteMany({
    where: { customerId: { in: demoIds } },
  });
  const payments = await prisma.payment.deleteMany({
    where: { customerId: { in: demoIds } },
  });
  const memberships = await prisma.membership.deleteMany({
    where: { customerId: { in: demoIds } },
  });
  const customers = await prisma.customer.deleteMany({
    where: { id: { in: demoIds } },
  });
  const webhookEvents = await prisma.webhookEvent.deleteMany({});
  const schedulerRuns = await prisma.schedulerRun.deleteMany({});

  console.log("[purge-demo] borrado:");
  console.log(`  notifications:   ${notifications.count}`);
  console.log(`  payments:        ${payments.count}`);
  console.log(`  memberships:     ${memberships.count}`);
  console.log(`  customers:       ${customers.count}`);
  console.log(`  webhook_events:  ${webhookEvents.count}`);
  console.log(`  scheduler_runs:  ${schedulerRuns.count}`);
  console.log("[purge-demo] listo.");
}

purge()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error("[purge-demo] error", err);
    await prisma.$disconnect();
    process.exit(1);
  });
