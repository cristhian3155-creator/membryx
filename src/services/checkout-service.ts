import crypto from "node:crypto";
import { prisma } from "../db/client";
import { config } from "../config";
import { getPaymentProvider } from "../integrations";

export class CheckoutError extends Error {}

function generateReference(): string {
  return `mbx-${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;
}

/**
 * Crea una intencion de pago (referencia unica + registro PENDING) y devuelve
 * la URL de Wompi Web Checkout. La renovacion de membresia NUNCA ocurre aqui:
 * solo el webhook, tras un evento APPROVED valido, puede renovar (spec #5 fuente de verdad).
 */
export async function createCheckoutIntent(customerId: string, planCode: string) {
  const plan = await prisma.plan.findFirst({ where: { code: planCode as any, active: true } });
  if (!plan) throw new CheckoutError(`Plan invalido o inactivo: ${planCode}`);

  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) throw new CheckoutError(`Cliente no encontrado: ${customerId}`);

  let reference = generateReference();
  for (let attempt = 0; attempt < 3; attempt++) {
    const exists = await prisma.payment.findUnique({ where: { reference } });
    if (!exists) break;
    reference = generateReference();
  }

  // Construir el link ANTES de persistir: si el proveedor no esta configurado
  // (o cualquier otro fallo), no debe quedar un registro de pago huerfano.
  const provider = getPaymentProvider();
  const { checkoutUrl } = provider.buildCheckoutLink({
    reference,
    amountCents: plan.priceCents,
    currency: config.business.currency,
    customerEmail: customer.email ?? undefined,
    redirectUrl: `${config.business.baseUrl}/dashboard/customers/${customer.id}?payment=${reference}`,
  });

  const payment = await prisma.payment.create({
    data: {
      businessId: customer.businessId,
      customerId: customer.id,
      planId: plan.id,
      provider: "wompi",
      reference,
      amountCents: plan.priceCents,
      currency: config.business.currency,
      status: "PENDING",
    },
  });

  return { paymentId: payment.id, reference, checkoutUrl, planCode: plan.code };
}
