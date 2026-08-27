/**
 * Prueba de humo end-to-end del flujo webhook -> pago -> membresia -> notificacion,
 * usando un evento Wompi simulado (firmado con WOMPI_EVENTS_SECRET del entorno actual).
 * No requiere credenciales reales de Wompi: solo que WOMPI_EVENTS_SECRET/PUBLIC_KEY/
 * INTEGRITY_SECRET tengan algun valor (de prueba) configurado al invocar este script.
 * Crea y luego elimina sus propios datos de prueba.
 */
import crypto from "node:crypto";
import { prisma } from "../src/db/client";
import { createCheckoutIntent } from "../src/services/checkout-service";
import { processWompiWebhookEvent } from "../src/services/webhook-service";
import { config } from "../src/config";

function buildSignedEvent(opts: { reference: string; status: string; amountCents: number; txId: string }) {
  const timestamp = Math.floor(Date.now() / 1000);
  const data = {
    transaction: {
      id: opts.txId,
      status: opts.status,
      reference: opts.reference,
      amount_in_cents: opts.amountCents,
      currency: config.business.currency,
      payment_method_type: "CARD",
    },
  };
  const properties = ["transaction.id", "transaction.status", "transaction.amount_in_cents"];
  const concatenated = properties.map((p) => String(p.split(".").reduce((acc: any, k) => acc[k], data))).join("");
  const toHash = `${concatenated}${timestamp}${config.wompi.eventsSecret}`;
  const checksum = crypto.createHash("sha256").update(toHash).digest("hex").toUpperCase();

  return {
    event: "transaction.updated",
    data,
    timestamp,
    signature: { properties, checksum },
  };
}

async function main() {
  console.log("[smoke] wompi configurado:", {
    publicKey: Boolean(config.wompi.publicKey),
    integritySecret: Boolean(config.wompi.integritySecret),
    eventsSecret: Boolean(config.wompi.eventsSecret),
  });

  const business = await prisma.business.findFirstOrThrow();
  const plan = await prisma.plan.findFirstOrThrow({ where: { businessId: business.id, code: "monthly" } });

  const customer = await prisma.customer.create({
    data: {
      businessId: business.id,
      externalId: `SMOKE-${Date.now()}`,
      fullName: "Smoke Test Cliente",
      phone: "+573009999999",
      demoRecord: true,
    },
  });

  const intent = await createCheckoutIntent(customer.id, "monthly");
  console.log("[smoke] intento de pago creado:", intent.reference);

  const txId = `smoke-tx-${Date.now()}`;
  const event = buildSignedEvent({
    reference: intent.reference,
    status: "APPROVED",
    amountCents: plan.priceCents,
    txId,
  });

  const first = await processWompiWebhookEvent(event);
  console.log("[smoke] primer envio del webhook:", first);

  const second = await processWompiWebhookEvent(event);
  console.log("[smoke] reenvio identico del webhook (debe ser duplicado):", second);

  const payment = await prisma.payment.findUnique({ where: { reference: intent.reference } });
  const membership = await prisma.membership.findFirst({ where: { customerId: customer.id } });
  const notifications = await prisma.notification.findMany({ where: { customerId: customer.id } });

  console.log("[smoke] pago final:", { status: payment?.status, providerTransactionId: payment?.providerTransactionId });
  console.log("[smoke] membresia final:", {
    startDate: membership?.startDate,
    expirationDate: membership?.expirationDate,
    status: membership?.status,
  });
  console.log("[smoke] notificaciones creadas:", notifications.length, notifications.map((n) => n.status));

  const declinedTxId = `smoke-tx-declined-${Date.now()}`;
  const declinedIntent = await createCheckoutIntent(customer.id, "monthly");
  const declinedEvent = buildSignedEvent({
    reference: declinedIntent.reference,
    status: "DECLINED",
    amountCents: plan.priceCents,
    txId: declinedTxId,
  });
  const declinedResult = await processWompiWebhookEvent(declinedEvent);
  const declinedPayment = await prisma.payment.findUnique({ where: { reference: declinedIntent.reference } });
  const membershipAfterDecline = await prisma.membership.findFirst({ where: { customerId: customer.id } });
  console.log("[smoke] webhook DECLINED:", declinedResult, "payment status:", declinedPayment?.status);
  console.log(
    "[smoke] membresia NO debe cambiar tras DECLINED. Expiracion sigue siendo:",
    membershipAfterDecline?.expirationDate,
    "igual a antes:",
    membershipAfterDecline?.expirationDate?.getTime() === membership?.expirationDate?.getTime()
  );

  const invalidEvent = buildSignedEvent({
    reference: intent.reference,
    status: "APPROVED",
    amountCents: plan.priceCents,
    txId: `smoke-tx-invalid-${Date.now()}`,
  });
  invalidEvent.signature.checksum = "0000INVALIDCHECKSUM0000";
  const invalidResult = await processWompiWebhookEvent(invalidEvent);
  console.log("[smoke] webhook con firma invalida (debe rechazarse con 400):", invalidResult);

  // limpieza
  await prisma.notification.deleteMany({ where: { customerId: customer.id } });
  await prisma.payment.deleteMany({ where: { customerId: customer.id } });
  await prisma.membership.deleteMany({ where: { customerId: customer.id } });
  await prisma.webhookEvent.deleteMany({ where: { providerEventId: { contains: "smoke-tx" } } });
  await prisma.customer.delete({ where: { id: customer.id } });
  console.log("[smoke] datos de prueba eliminados");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error("[smoke] error", err);
    await prisma.$disconnect();
    process.exit(1);
  });
