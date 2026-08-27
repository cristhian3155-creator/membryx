import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { CheckoutError, createCheckoutIntent } from "../../services/checkout-service";

export const checkoutRouter = Router();

const bodySchema = z.object({
  customerId: z.string().uuid(),
  planCode: z.enum(["monthly", "quarterly", "semester", "annual"]),
});

checkoutRouter.post("/", requireAuth, async (req, res) => {
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  try {
    const intent = await createCheckoutIntent(parsed.data.customerId, parsed.data.planCode);
    res.json(intent);
  } catch (err) {
    console.error("[checkout] error creando intento de pago", err);
    if (err instanceof CheckoutError) {
      return res.status(400).json({ error: err.message });
    }
    // Errores de configuracion del proveedor (credenciales faltantes, etc.) son
    // accionables por el administrador: se muestran tal cual en lugar de un 500 opaco.
    const message = err instanceof Error ? err.message : "Error interno creando el pago";
    res.status(400).json({ error: message });
  }
});
