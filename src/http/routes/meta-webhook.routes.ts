import { Router } from "express";
import { prisma } from "../../db/client";
import { config } from "../../config";

export const metaWebhookRouter = Router();

/**
 * Handshake de verificacion de Meta (GET). Meta lo llama al registrar/editar la
 * suscripcion de webhooks con el token que configuramos en META_WHATSAPP_VERIFY_TOKEN.
 */
metaWebhookRouter.get("/meta", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === config.metaWhatsapp.verifyToken && config.metaWhatsapp.verifyToken) {
    return res.status(200).send(String(challenge ?? ""));
  }
  return res.sendStatus(403);
});

/**
 * Eventos entrantes de Meta (estados de entrega, mensajes inbound). No forma parte
 * del flujo critico del MVP (que es solo envio saliente); se registra para trazabilidad.
 */
metaWebhookRouter.post("/meta", async (req, res) => {
  try {
    await prisma.webhookEvent.create({
      data: {
        provider: "meta",
        eventType: "whatsapp_event",
        providerEventId: `meta-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        payload: req.body ?? {},
        signatureValid: true,
        processed: true,
        processedAt: new Date(),
      },
    });
  } catch (err) {
    console.error("[webhook:meta] error registrando evento", err);
  }
  res.sendStatus(200);
});
