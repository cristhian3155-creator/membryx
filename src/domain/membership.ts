import { DateTime } from "luxon";

export interface RenewalInput {
  /** Fecha de inicio actual de la membresia, o null si el cliente no tiene una previa. */
  currentStartDate: DateTime | null;
  /** Fecha de expiracion actual, o null si el cliente no tiene membresia previa. */
  currentExpirationDate: DateTime | null;
  /** Fecha en la que se aprobo el pago (referencia para el calculo). */
  referenceDate: DateTime;
  durationDays: number;
}

export interface RenewalResult {
  startDate: DateTime;
  expirationDate: DateTime;
  /** true si la membresia estaba vigente al momento del pago (se sumaron dias sin perderlos). */
  wasActive: boolean;
}

/**
 * Regla critica de renovacion (BOOT #8 / Spec #8.1-8.3):
 * - Si el cliente esta vigente: nueva_expiracion = expiracion_actual + duration_days (no se pierden dias prepagados).
 * - Si el cliente esta vencido o no tiene membresia: nueva_expiracion = fecha_actual + duration_days,
 *   y la nueva vigencia inicia en fecha_actual.
 */
export function computeRenewal(input: RenewalInput): RenewalResult {
  const { currentStartDate, currentExpirationDate, referenceDate, durationDays } = input;

  const isActive =
    currentExpirationDate !== null && currentExpirationDate.startOf("day") >= referenceDate.startOf("day");

  if (isActive && currentExpirationDate) {
    return {
      startDate: currentStartDate ?? referenceDate,
      expirationDate: currentExpirationDate.plus({ days: durationDays }),
      wasActive: true,
    };
  }

  return {
    startDate: referenceDate,
    expirationDate: referenceDate.plus({ days: durationDays }),
    wasActive: false,
  };
}

export type DerivedMembershipStatus = "ACTIVE" | "EXPIRING" | "EXPIRED";

/**
 * Estado derivado de una membresia a partir de su fecha de expiracion.
 * EXPIRING cuando el numero de dias restantes cae dentro de la ventana de recordatorios configurada.
 */
export function deriveMembershipStatus(
  daysUntilExpiration: number,
  reminderDays: number[]
): DerivedMembershipStatus {
  if (daysUntilExpiration < 0) return "EXPIRED";
  const maxReminderWindow = reminderDays.length > 0 ? Math.max(...reminderDays) : 0;
  if (daysUntilExpiration <= maxReminderWindow) return "EXPIRING";
  return "ACTIVE";
}
