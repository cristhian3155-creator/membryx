export type PaymentStatusValue = "PENDING" | "APPROVED" | "DECLINED" | "VOIDED" | "ERROR";

export interface CheckoutLinkRequest {
  reference: string;
  amountCents: number;
  currency: string;
  customerEmail?: string;
  redirectUrl: string;
}

export interface CheckoutLinkResult {
  checkoutUrl: string;
}

/**
 * Evento de pago normalizado, ya extraido del payload especifico del proveedor.
 * El dominio (webhook handler) solo trabaja contra esta forma, nunca contra el payload crudo.
 */
export interface NormalizedPaymentEvent {
  providerEventId: string;
  providerTransactionId: string;
  reference: string;
  status: PaymentStatusValue;
  amountCents: number;
  currency: string;
  paymentMethod?: string;
  approvedAt?: Date;
}

export interface WebhookVerificationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Contrato que debe cumplir cualquier proveedor de pagos.
 * Permite sustituir Wompi por otro proveedor sin tocar reglas de negocio (webhook handler, renovacion).
 */
export interface PaymentProvider {
  buildCheckoutLink(req: CheckoutLinkRequest): CheckoutLinkResult;
  verifyWebhookSignature(rawBody: unknown): WebhookVerificationResult;
  normalizeWebhookEvent(rawBody: any): NormalizedPaymentEvent;
}
