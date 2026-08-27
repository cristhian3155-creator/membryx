import { DateTime } from "luxon";
import { prisma } from "../db/client";
import { config } from "../config";
import { computeRenewal, deriveMembershipStatus } from "../domain/membership";
import { businessToday, daysBetween, dateOnlyToLuxon, toDateOnly } from "../domain/dates";
import type { Payment } from "@prisma/client";

/**
 * Aplica un pago APROBADO a la membresia del cliente (regla critica de renovacion).
 * Debe llamarse solo una vez por pago aprobado: la idempotencia la garantiza el
 * llamador (webhook-service) verificando que el pago no estuviera ya APPROVED antes.
 */
export async function applyApprovedPayment(payment: Payment, referenceDate: Date = new Date()) {
  if (!payment.planId) {
    throw new Error(`El pago ${payment.id} no tiene plan asociado, no se puede renovar membresia`);
  }

  const [customer, plan] = await Promise.all([
    prisma.customer.findUniqueOrThrow({ where: { id: payment.customerId } }),
    prisma.plan.findUniqueOrThrow({ where: { id: payment.planId } }),
  ]);

  const currentMembership = await prisma.membership.findFirst({
    where: { customerId: customer.id, businessId: payment.businessId },
    orderBy: { expirationDate: "desc" },
  });

  const timezone = config.business.timezone;
  const refLuxon = DateTime.fromJSDate(referenceDate, { zone: timezone }).startOf("day");

  const renewal = computeRenewal({
    currentStartDate: currentMembership ? dateOnlyToLuxon(currentMembership.startDate, timezone) : null,
    currentExpirationDate: currentMembership
      ? dateOnlyToLuxon(currentMembership.expirationDate, timezone)
      : null,
    referenceDate: refLuxon,
    durationDays: plan.durationDays,
  });

  const today = businessToday(timezone);
  const daysUntilExpiration = daysBetween(today, renewal.expirationDate);
  const status = deriveMembershipStatus(daysUntilExpiration, config.reminderDays);

  const membership = currentMembership
    ? await prisma.membership.update({
        where: { id: currentMembership.id },
        data: {
          planId: plan.id,
          startDate: toDateOnly(renewal.startDate),
          expirationDate: toDateOnly(renewal.expirationDate),
          status,
        },
      })
    : await prisma.membership.create({
        data: {
          businessId: payment.businessId,
          customerId: customer.id,
          planId: plan.id,
          startDate: toDateOnly(renewal.startDate),
          expirationDate: toDateOnly(renewal.expirationDate),
          status,
        },
      });

  await prisma.payment.update({
    where: { id: payment.id },
    data: { membershipId: membership.id },
  });

  return { membership, customer, plan };
}
