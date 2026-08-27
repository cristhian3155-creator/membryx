/**
 * Determina si corresponde enviar un recordatorio hoy, segun la configuracion REMINDER_DAYS.
 * No hardcodea D-3/D-2/D-1/D-0 como bloques independientes: lee la lista de offsets desde config.
 *
 * @param daysUntilExpiration dias calendario restantes hasta el vencimiento (puede ser negativo).
 * @param reminderDays lista configurada de offsets, p.ej. [3,2,1,0].
 * @returns el offset que corresponde enviar hoy, o null si ninguno aplica (incluye D+1 en adelante).
 */
export function reminderOffsetForToday(
  daysUntilExpiration: number,
  reminderDays: number[]
): number | null {
  return reminderDays.includes(daysUntilExpiration) ? daysUntilExpiration : null;
}
