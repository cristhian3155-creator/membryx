import { DateTime } from "luxon";

/** Fecha de "hoy" en la zona horaria del negocio, a medianoche (solo fecha, sin hora). */
export function businessToday(timezone: string, now: Date = new Date()): DateTime {
  return DateTime.fromJSDate(now, { zone: timezone }).startOf("day");
}

/** Convierte un DateTime a un objeto Date UTC a medianoche, apto para columnas `@db.Date`. */
export function toDateOnly(dt: DateTime): Date {
  return new Date(Date.UTC(dt.year, dt.month - 1, dt.day));
}

export function dateOnlyToLuxon(date: Date, timezone: string): DateTime {
  return DateTime.fromObject(
    { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() },
    { zone: timezone }
  ).startOf("day");
}

/** Diferencia en dias calendario completos entre dos fechas (target - from). */
export function daysBetween(from: DateTime, target: DateTime): number {
  return Math.round(target.startOf("day").diff(from.startOf("day"), "days").days);
}
