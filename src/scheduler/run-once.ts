import { runReminderScheduler } from "./reminder-scheduler";

runReminderScheduler()
  .then((summary) => {
    console.log("[scheduler:run-once] resumen", summary);
    process.exit(0);
  })
  .catch((err) => {
    console.error("[scheduler:run-once] error", err);
    process.exit(1);
  });
