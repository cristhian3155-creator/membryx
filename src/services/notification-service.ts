import { prisma } from "../db/client";
import { getWhatsAppProvider } from "../integrations";
import { createCheckoutIntent } from "./checkout-service";
import type { Customer, Membership, Payment, Plan } from "@prisma/client";

/**
 * Registra y envia la confirmacion de pago. Un fallo del proveedor de WhatsApp
 * no debe romper la transaccion de pago/membresia (ya confirmada previamente).
 */
export async function sendPaymentConfirmationNotification(
  payment: Payment,
  membership: Membership,
  customer: Customer,
  plan: Plan
) {
  const existing = await prisma.notification.findFirst({
    where: { paymentId: payment.id, type: "PAYMENT_CONFIRMATION" },
  });
  // Ya enviada exitosamente: no reenviar (idempotencia real). Si fallo o quedo pendiente, reintentar.
  if (existing && existing.status === "SENT") return existing;

  const notification = existing
    ? await prisma.notification.update({ where: { id: existing.id }, data: { status: "PENDING", errorMessage: null } })
    : await prisma.notification.create({
        data: {
          businessId: payment.businessId,
          customerId: customer.id,
          membershipId: membership.id,
          paymentId: payment.id,
          type: "PAYMENT_CONFIRMATION",
          scheduledFor: new Date(),
          status: "PENDING",
        },
      });

  try {
    const provider = getWhatsAppProvider();
    const result = await provider.sendPaymentConfirmation({
      toPhone: customer.phone,
      customerName: customer.fullName,
      planName: plan.name,
      expirationDateIso: membership.expirationDate.toISOString().slice(0, 10),
    });

    return prisma.notification.update({
      where: { id: notification.id },
      data: result.success
        ? { status: "SENT", sentAt: new Date(), providerMessageId: result.providerMessageId }
        : { status: "FAILED", errorMessage: result.errorMessage },
    });
  } catch (err: any) {
    return prisma.notification.update({
      where: { id: notification.id },
      data: { status: "FAILED", errorMessage: err?.message ?? "Error desconocido" },
    });
  }
}

/**
 * Registra y envia un recordatorio de vencimiento para un offset especifico (D-3..D-0).
 * Idempotente por (membershipId, type, offsetDays, scheduledFor): si ya existe, no reenvia.
 */
export async function sendReminderNotification(
  membership: Membership,
  customer: Customer,
  plan: Plan,
  offsetDays: number,
  daysUntilExpiration: number
) {
  const existing = await prisma.notification.findUnique({
    where: {
      membershipId_type_offsetDays_scheduledFor: {
        membershipId: membership.id,
        type: "REMINDER",
        offsetDays,
        scheduledFor: membership.expirationDate,
      },
    },
  });
  // Ya enviado exitosamente: no reenviar (idempotencia real). Si fallo o quedo pendiente, reintentar.
  if (existing && existing.status === "SENT") return { created: false, notification: existing };

  const notification = existing
    ? await prisma.notification.update({ where: { id: existing.id }, data: { status: "PENDING", errorMessage: null } })
    : await prisma.notification.create({
        data: {
          businessId: membership.businessId,
          customerId: customer.id,
          membershipId: membership.id,
          type: "REMINDER",
          offsetDays,
          scheduledFor: membership.expirationDate,
          status: "PENDING",
        },
      });

  try {
    const provider = getWhatsAppProvider();

    // Se genera un link de pago real para que el cliente pueda renovar directo desde el
    // mensaje. Si falla (ej. proveedor de pago no configurado), el recordatorio se envia
    // igual, solo que sin el link -- un fallo aqui no debe bloquear el aviso.
    let checkoutUrl: string | undefined;
    try {
      const intent = await createCheckoutIntent(customer.id, plan.code);
      checkoutUrl = intent.checkoutUrl;
    } catch (err) {
      console.error(`[notification] no se pudo generar link de pago para recordatorio (${customer.id})`, err);
    }

    const input = {
      toPhone: customer.phone,
      customerName: customer.fullName,
      planName: plan.name,
      expirationDateIso: membership.expirationDate.toISOString().slice(0, 10),
      daysUntilExpiration,
      checkoutUrl,
    };
    // Llamadas como metodo (no una referencia suelta) para no perder el `this` del proveedor.
    const result =
      offsetDays === 0 ? await provider.sendExpiryNotice(input) : await provider.sendExpiryReminder(input);

    const updated = await prisma.notification.update({
      where: { id: notification.id },
      data: result.success
        ? { status: "SENT", sentAt: new Date(), providerMessageId: result.providerMessageId }
        : { status: "FAILED", errorMessage: result.errorMessage },
    });
    return { created: true, notification: updated };
  } catch (err: any) {
    const updated = await prisma.notification.update({
      where: { id: notification.id },
      data: { status: "FAILED", errorMessage: err?.message ?? "Error desconocido" },
    });
    return { created: true, notification: updated };
  }
}
