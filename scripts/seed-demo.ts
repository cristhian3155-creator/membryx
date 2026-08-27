import crypto from "node:crypto";
import { DateTime } from "luxon";
import { prisma } from "../src/db/client";
import { config, PLAN_DEFINITIONS, type PlanCode } from "../src/config";
import { businessToday, toDateOnly } from "../src/domain/dates";
import { deriveMembershipStatus } from "../src/domain/membership";

/** PRNG determinista (mulberry32) para que la base demo sea reproducible entre corridas. */
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST_NAMES = [
  "Juan", "Maria", "Carlos", "Ana", "Luis", "Laura", "Andres", "Camila", "Diego", "Valentina",
  "Jorge", "Sofia", "Miguel", "Daniela", "Santiago", "Isabella", "David", "Mariana", "Felipe", "Paula",
  "Alejandro", "Natalia", "Ricardo", "Carolina", "Sebastian", "Juliana", "Oscar", "Catalina", "Fernando", "Gabriela",
];
const LAST_NAMES = [
  "Gomez", "Rodriguez", "Martinez", "Lopez", "Garcia", "Perez", "Sanchez", "Ramirez", "Torres", "Diaz",
  "Vargas", "Castro", "Ruiz", "Alvarez", "Romero", "Suarez", "Rojas", "Moreno", "Munoz", "Jimenez",
];

function randomName(rand: () => number) {
  const first = FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)];
  const last = LAST_NAMES[Math.floor(rand() * LAST_NAMES.length)];
  return `${first} ${last}`;
}

function randomPhone(rand: () => number, idx: number) {
  const suffix = String(3000000000 + Math.floor(rand() * 900000000) + idx).slice(0, 10);
  return `+57${suffix}`;
}

const PLAN_CODES: PlanCode[] = ["monthly", "quarterly", "semester", "annual"];

export async function seedDemo() {
  const rand = mulberry32(42);
  const timezone = config.business.timezone;
  const today = businessToday(timezone);

  const business =
    (await prisma.business.findFirst()) ??
    (await prisma.business.create({
      data: {
        name: config.business.name,
        timezone,
        currency: config.business.currency,
        environment: "demo",
      },
    }));

  const plans = new Map<PlanCode, { id: string; durationDays: number }>();
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
    plans.set(code, { id: plan.id, durationDays: plan.durationDays });
  }

  let phoneCounter = 0;
  const nextPhone = () => randomPhone(rand, phoneCounter++);

  async function createCustomerWithMembership(opts: {
    name: string;
    externalId: string;
    planCode: PlanCode;
    expirationOffsetDays: number;
    demoRecord?: boolean;
  }) {
    const plan = plans.get(opts.planCode)!;
    const expirationDate = today.plus({ days: opts.expirationOffsetDays });
    const startDate = expirationDate.minus({ days: plan.durationDays });
    const status = deriveMembershipStatus(opts.expirationOffsetDays, config.reminderDays);

    const customer = await prisma.customer.create({
      data: {
        businessId: business.id,
        externalId: opts.externalId,
        fullName: opts.name,
        phone: nextPhone(),
        email: null,
        active: true,
        demoRecord: opts.demoRecord ?? true,
      },
    });

    const membership = await prisma.membership.create({
      data: {
        businessId: business.id,
        customerId: customer.id,
        planId: plan.id,
        startDate: toDateOnly(startDate),
        expirationDate: toDateOnly(expirationDate),
        status,
      },
    });

    return { customer, membership };
  }

  // --- Escenarios deterministas explicitos (spec #11 / #13) ---
  await createCustomerWithMembership({
    name: "Demo Cliente Activo",
    externalId: "DEMO-ACTIVE",
    planCode: "monthly",
    expirationOffsetDays: 20,
  });
  await createCustomerWithMembership({
    name: "Demo Cliente D-3",
    externalId: "DEMO-D3",
    planCode: "monthly",
    expirationOffsetDays: 3,
  });
  await createCustomerWithMembership({
    name: "Demo Cliente D-2",
    externalId: "DEMO-D2",
    planCode: "monthly",
    expirationOffsetDays: 2,
  });
  await createCustomerWithMembership({
    name: "Demo Cliente D-1",
    externalId: "DEMO-D1",
    planCode: "monthly",
    expirationOffsetDays: 1,
  });
  await createCustomerWithMembership({
    name: "Demo Cliente D-0",
    externalId: "DEMO-D0",
    planCode: "monthly",
    expirationOffsetDays: 0,
  });
  await createCustomerWithMembership({
    name: "Demo Cliente Vencido",
    externalId: "DEMO-EXPIRED",
    planCode: "monthly",
    expirationOffsetDays: -10,
  });

  {
    const customer = await prisma.customer.create({
      data: {
        businessId: business.id,
        externalId: "DEMO-NO-MEMBERSHIP",
        fullName: "Demo Cliente Sin Membresia",
        phone: nextPhone(),
        active: true,
        demoRecord: true,
      },
    });
    void customer;
  }

  // Cliente con pago rechazado (para el caso de prueba DECLINED no renueva)
  {
    const { customer } = await createCustomerWithMembership({
      name: "Demo Cliente Pago Rechazado",
      externalId: "DEMO-DECLINED",
      planCode: "monthly",
      expirationOffsetDays: -5,
    });
    await prisma.payment.create({
      data: {
        businessId: business.id,
        customerId: customer.id,
        planId: plans.get("monthly")!.id,
        provider: "wompi",
        reference: `mbx-demo-declined-${customer.id.slice(0, 8)}`,
        amountCents: PLAN_DEFINITIONS.monthly.priceCents,
        currency: config.business.currency,
        status: "DECLINED",
        providerPayload: { demo: true },
      },
    });
  }

  // --- Volumen restante hasta ~500, distribuido en buckets no deterministas por dia exacto ---
  const namedSoFar = 8;
  const target = 500;
  const remaining = target - namedSoFar;

  const bucketCounts = {
    active: 254,
    expiringD3: 10,
    expiringD2: 10,
    expiringD1: 10,
    expiringD0: 10,
    expired: 100,
    noMembership: remaining - (254 + 40 + 100),
  };

  let seq = 0;
  const bulkCustomers: { id: string; externalId: string; phone: string; fullName: string }[] = [];

  async function addBulkCustomer(demoRecord = true) {
    const id = crypto.randomUUID();
    seq++;
    const externalId = `DEMO-BULK-${String(seq).padStart(4, "0")}`;
    const fullName = randomName(rand);
    const phone = nextPhone();
    bulkCustomers.push({ id, externalId, phone, fullName });
    await prisma.customer.create({
      data: {
        id,
        businessId: business.id,
        externalId,
        fullName,
        phone,
        active: true,
        demoRecord,
      },
    });
    return id;
  }

  for (let i = 0; i < bucketCounts.active; i++) {
    const id = await addBulkCustomer();
    const planCode = PLAN_CODES[Math.floor(rand() * PLAN_CODES.length)];
    const plan = plans.get(planCode)!;
    const offset = Math.floor(rand() * 150) + (Math.max(...config.reminderDays) + 1);
    const expirationDate = today.plus({ days: offset });
    await prisma.membership.create({
      data: {
        businessId: business.id,
        customerId: id,
        planId: plan.id,
        startDate: toDateOnly(expirationDate.minus({ days: plan.durationDays })),
        expirationDate: toDateOnly(expirationDate),
        status: "ACTIVE",
      },
    });
  }

  for (const [offset, count] of [
    [3, bucketCounts.expiringD3],
    [2, bucketCounts.expiringD2],
    [1, bucketCounts.expiringD1],
    [0, bucketCounts.expiringD0],
  ] as const) {
    for (let i = 0; i < count; i++) {
      const id = await addBulkCustomer();
      const plan = plans.get("monthly")!;
      const expirationDate = today.plus({ days: offset });
      await prisma.membership.create({
        data: {
          businessId: business.id,
          customerId: id,
          planId: plan.id,
          startDate: toDateOnly(expirationDate.minus({ days: plan.durationDays })),
          expirationDate: toDateOnly(expirationDate),
          status: "EXPIRING",
        },
      });
    }
  }

  for (let i = 0; i < bucketCounts.expired; i++) {
    const id = await addBulkCustomer();
    const planCode = PLAN_CODES[Math.floor(rand() * PLAN_CODES.length)];
    const plan = plans.get(planCode)!;
    const offset = -(Math.floor(rand() * 120) + 1);
    const expirationDate = today.plus({ days: offset });
    await prisma.membership.create({
      data: {
        businessId: business.id,
        customerId: id,
        planId: plan.id,
        startDate: toDateOnly(expirationDate.minus({ days: plan.durationDays })),
        expirationDate: toDateOnly(expirationDate),
        status: "EXPIRED",
      },
    });
  }

  for (let i = 0; i < bucketCounts.noMembership; i++) {
    await addBulkCustomer();
  }

  const totalCustomers = await prisma.customer.count({ where: { businessId: business.id } });
  return { business, totalCustomers };
}

if (require.main === module) {
  seedDemo()
    .then(({ totalCustomers }) => {
      console.log(`[seed-demo] listo. Total de clientes: ${totalCustomers}`);
      return prisma.$disconnect();
    })
    .catch(async (err) => {
      console.error("[seed-demo] error", err);
      await prisma.$disconnect();
      process.exit(1);
    });
}
