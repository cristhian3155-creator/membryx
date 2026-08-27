import cron from "node-cron";
import { config } from "../config";
import { runReminderScheduler } from "./reminder-scheduler";

/** Corre todos los dias a las 08:00 en la zona horaria del negocio. */
export function startScheduler() {
  cron.schedule(
    "0 8 * * *",
    async () => {
      console.log("[scheduler] ejecutando job diario de recordatorios");
      const summary = await runReminderScheduler();
      console.log("[scheduler] resumen", summary);
    },
    { timezone: config.business.timezone }
  );
  console.log(`[scheduler] programado diariamente a las 08:00 (${config.business.timezone})`);
}
