import { prisma } from "../src/db/client";
import { config } from "../src/config";
import { seedDemo } from "./seed-demo";

async function resetDemo() {
  if (config.business.environment !== "demo") {
    throw new Error("reset-demo solo puede ejecutarse con ENVIRONMENT=demo, por seguridad.");
  }

  console.log("[reset-demo] borrando datos demo existentes...");
  await prisma.notification.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.membership.deleteMany({});
  await prisma.customer.deleteMany({ where: { demoRecord: true } });
  await prisma.webhookEvent.deleteMany({});
  await prisma.schedulerRun.deleteMany({});

  console.log("[reset-demo] regenerando base demo...");
  const { totalCustomers } = await seedDemo();
  console.log(`[reset-demo] listo. Total de clientes: ${totalCustomers}`);
}

resetDemo()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error("[reset-demo] error", err);
    await prisma.$disconnect();
    process.exit(1);
  });
