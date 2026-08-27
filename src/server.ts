import { createApp } from "./http/app";
import { config } from "./config";
import { startScheduler } from "./scheduler";

const app = createApp();

app.listen(config.port, () => {
  console.log(`[membryx] escuchando en puerto ${config.port} (entorno=${config.business.environment})`);
  startScheduler();
});
