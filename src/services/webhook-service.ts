import crypto from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "../db/client";
import { getPaymentProvider } from "../integrations";
import { applyApprovedPayment } from "./membership-service";
import { sendPaymentConfirmationNotification } from "./notification-service";

export interface WebhookProcessResult {
  httpStatus: number;
  body: Record<string, unknown>;
}

function fallbackEventId(rawBody: unknown): string {
  return crypto.createHash("sha256").update(JSON.stringify(rawBody ?? {})).digest("hex");
}

/**
 * Procesa un evento entrante de Wompi de extremo a extremo:
 * validar firma -> deduplicar -> registrar -> (si APPROVED) renovar membresia + notificar.
 * Idempotente: un mismo evento reenviado, o un mismo pago aprobado reportado dos veces,
 * no produce doble renovacion ni doble mensaje (spec #3.4, BOOT #6).
 */
export async function processWompiWebhookEvent(rawBody: any): Promise<WebhookProcessResult> {
  const provider = getPaymentProvider();
  const verification = provider.verifyWebhookSignature(rawBody);

  let providerEventId: string;
  let normalized: ReturnType<typeof provider.normalizeWebhookEvent> | null = null;
  try {
    normalized = provider.normalizeWebhookEvent(rawBody);
    providerEventId = normalized.providerEventId;
  } catch {
    providerEventId = fallbackEventId(rawBody);
  }

  let webhookEventId: string;
  try {
    const created = await prisma.webhookEvent.create({
      data: {
        provider: "wompi",
        eventType: String(rawBody?.event ?? "unknown"),
        providerEventId,
        payload: rawBody ?? {},
        signatureValid: verification.valid,
        processed: false,
      },
    });
    webhookEventId = created.id;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      // Mismo evento ya recibido antes (misma transaccion + estado + timestamp): no reprocesar.
      return { httpStatus: 200, body: { duplicate: true } };
    }
    throw err;
  }

  if (!verification.valid) {
    return { httpStatus: 400, body: { error: verification.reason ?? "Firma invalida" } };
  }
  if (!normalized) {
    return { httpStatus: 400, body: { error: "Payload de evento invalido" } };
  }
  if (String(rawBody?.event) !== "transaction.updated") {
    await prisma.webhookEvent.update({
      where: { id: webhookEventId },
      data: { processed: true, processedAt: new Date() },
    });
    return { httpStatus: 200, body: { ignored: true } };
  }

  const payment = await prisma.payment.findUnique({ where: { reference: normalized.reference } });
  if (!payment) {
    await prisma.webhookEvent.update({
      where: { id: webhookEventId },
      data: { processed: true, processedAt: new Date() },
    });
    return { httpStatus: 200, body: { warning: "No existe pago con esa referencia" } };
  }

  const wasAlreadyApproved = payment.status === "APPROVED";

  const updatedPayment = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      providerTransactionId: normalized.providerTransactionId,
      status: normalized.status,
      paymentMethod: normalized.paymentMethod,
      providerPayload: rawBody ?? {},
      approvedAt: normalized.status === "APPROVED" ? normalized.approvedAt ?? new Date() : payment.approvedAt,
    },
  });

  if (normalized.status === "APPROVED" && !wasAlreadyApproved) {
    const { membership, customer, plan } = await applyApprovedPayment(updatedPayment);
    await sendPaymentConfirmationNotification(updatedPayment, membership, customer, plan);
  }

  await prisma.webhookEvent.update({
    where: { id: webhookEventId },
    data: { processed: true, processedAt: new Date() },
  });

  return { httpStatus: 200, body: { ok: true } };
}
