import { DateTime } from "luxon";
import { prisma } from "../db/client";
import { config } from "../config";
import { businessToday, daysBetween, dateOnlyToLuxon, toDateOnly } from "../domain/dates";
import { reminderOffsetForToday } from "../domain/reminders";
import { sendReminderNotification } from "../services/notification-service";

/** Recalcula el status derivado (ACTIVE/EXPIRING/EXPIRED) de todas las membresias no canceladas. */
async function syncMembershipStatuses(today: DateTime) {
  const todayDate = toDateOnly(today);
  const maxWindow = config.reminderDays.length > 0 ? Math.max(...config.reminderDays) : 0;
  const windowEndDate = toDateOnly(today.plus({ days: maxWindow }));

  await prisma.membership.updateMany({
    where: { expirationDate: { lt: todayDate }, status: { notIn: ["EXPIRED", "CANCELLED"] } },
    data: { status: "EXPIRED" },
  });
  await prisma.membership.updateMany({
    where: {
      expirationDate: { gte: todayDate, lte: windowEndDate },
      status: { notIn: ["EXPIRING", "CANCELLED"] },
    },
    data: { status: "EXPIRING" },
  });
  await prisma.membership.updateMany({
    where: { expirationDate: { gt: windowEndDate }, status: { notIn: ["ACTIVE", "CANCELLED"] } },
    data: { status: "ACTIVE" },
  });
}

export interface SchedulerRunSummary {
  candidatesEvaluated: number;
  remindersSent: number;
  remindersFailed: number;
}

/**
 * Ejecuta el job diario de recordatorios (BOOT #10 / spec #8.4-8.6):
 * 1) sincroniza estados derivados, 2) evalua candidatos dentro de la ventana de recordatorio,
 * 3) para cada uno vuelve a comprobar la condicion de envio contra la membresia ACTUAL,
 * 4) envia y registra, sin detenerse si un envio individual falla.
 */
export async function runReminderScheduler(referenceDate: Date = new Date()): Promise<SchedulerRunSummary> {
  const timezone = config.business.timezone;
  const today = businessToday(timezone, referenceDate);

  let errorMessage: string | undefined;
  let summary: SchedulerRunSummary = { candidatesEvaluated: 0, remindersSent: 0, remindersFailed: 0 };

  try {
    await syncMembershipStatuses(today);

    const reminderDays = config.reminderDays;
    if (reminderDays.length === 0) {
      await prisma.schedulerRun.create({
        data: { candidatesEvaluated: 0, remindersSent: 0, remindersFailed: 0 },
      });
      return summary;
    }

    const minOffset = Math.min(...reminderDays);
    const maxOffset = Math.max(...reminderDays);
    const windowStart = toDateOnly(today.plus({ days: minOffset }));
    const windowEnd = toDateOnly(today.plus({ days: maxOffset }));

    const candidates = await prisma.membership.findMany({
      where: {
        expirationDate: { gte: windowStart, lte: windowEnd },
        status: { in: ["ACTIVE", "EXPIRING"] },
      },
      include: { customer: true, plan: true },
    });

    summary.candidatesEvaluated = candidates.length;

    for (const membership of candidates) {
      try {
        // Se vuelve a cargar el estado actual justo antes de decidir, por si cambio
        // durante la ejecucion (p.ej. un pago que renovo la membresia).
        const fresh = await prisma.membership.findUnique({ where: { id: membership.id } });
        if (!fresh || fresh.status === "CANCELLED") continue;

        const expirationLuxon = dateOnlyToLuxon(fresh.expirationDate, timezone);
        const daysUntil = daysBetween(today, expirationLuxon);
        const offset = reminderOffsetForToday(daysUntil, reminderDays);
        if (offset === null) continue;
        if (!membership.customer.active) continue;

        const result = await sendReminderNotification(
          { ...membership, expirationDate: fresh.expirationDate },
          membership.customer,
          membership.plan,
          offset,
          daysUntil
        );

        if (result.created) {
          if (result.notification.status === "SENT") summary.remindersSent++;
          else if (result.notification.status === "FAILED") summary.remindersFailed++;
        }
      } catch (err) {
        summary.remindersFailed++;
        console.error(`[scheduler] error procesando membership ${membership.id}`, err);
      }
    }
  } catch (err: any) {
    errorMessage = err?.message ?? "Error desconocido en el scheduler";
    console.error("[scheduler] error general", err);
  }

  await prisma.schedulerRun.create({
    data: {
      candidatesEvaluated: summary.candidatesEvaluated,
      remindersSent: summary.remindersSent,
      remindersFailed: summary.remindersFailed,
      errorMessage,
    },
  });

  return summary;
}
