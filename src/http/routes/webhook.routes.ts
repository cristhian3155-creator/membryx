import { Router } from "express";
import { processWompiWebhookEvent } from "../../services/webhook-service";

export const webhookRouter = Router();

webhookRouter.post("/wompi", async (req, res) => {
  try {
    const result = await processWompiWebhookEvent(req.body);
    res.status(result.httpStatus).json(result.body);
  } catch (err: any) {
    console.error("[webhook:wompi] error procesando evento", err);
    res.status(500).json({ error: "Error interno procesando el evento" });
  }
});
