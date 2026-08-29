import { prisma } from "../src/db/client";
import { config, PLAN_DEFINITIONS, type PlanCode } from "../src/config";

/**
 * Promueve la instancia a producción:
 *  - marca el Business como environment=production y sincroniza nombre/zona/moneda con la config
 *  - re-sincroniza los 4 planes (precio/duración/nombre) desde las variables de entorno
 *
 * NO toca clientes, membresías, pagos ni notificaciones. Idempotente.
 * Para borrar los datos demo usar `scripts/purge-demo.ts` por separado.
 */

const PLAN_CODES: PlanCode[] = ["monthly", "quarterly", "semester", "annual"];

async function promote() {
  if (config.business.environment !== "production") {
    throw new Error(
      "promote-to-production requiere ENVIRONMENT=production. Actual: " + config.business.environment
    );
  }

  const business = await prisma.business.findFirst();
  if (!business) {
    throw new Error("No hay ningún Business en la base. Corré las migraciones/seed primero.");
  }

  const updatedBusiness = await prisma.business.update({
    where: { id: business.id },
    data: {
      name: config.business.name,
      timezone: config.business.timezone,
      currency: config.business.currency,
      environment: "production",
    },
  });
  console.log(
    `[promote] Business "${updatedBusiness.name}" -> environment=${updatedBusiness.environment} ` +
      `tz=${updatedBusiness.timezone} moneda=${updatedBusiness.currency}`
  );

  for (const code of PLAN_CODES) {
    const def = PLAN_DEFINITIONS[code];
    const plan = await prisma.plan.upsert({
      where: { businessId_code: { businessId: business.id, code } },
      update: { name: def.name, durationDays: def.durationDays, priceCents: def.priceCents, active: true },
      create: {
        businessId: business.id,
        code,
        name: def.name,
        durationDays: def.durationDays,
        priceCents: def.priceCents,
        active: true,
      },
    });
    console.log(
      `[promote] Plan ${code}: ${plan.name} — ${plan.priceCents} centavos / ${plan.durationDays} días`
    );
  }

  console.log("[promote] listo.");
}

promote()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error("[promote] error", err);
    await prisma.$disconnect();
    process.exit(1);
  });
