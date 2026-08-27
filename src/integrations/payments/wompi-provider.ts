import crypto from "node:crypto";
import type {
  CheckoutLinkRequest,
  CheckoutLinkResult,
  NormalizedPaymentEvent,
  PaymentProvider,
  PaymentStatusValue,
  WebhookVerificationResult,
} from "./payment-provider";

interface WompiConfig {
  publicKey: string;
  integritySecret: string;
  eventsSecret: string;
}

const WOMPI_TO_INTERNAL_STATUS: Record<string, PaymentStatusValue> = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  DECLINED: "DECLINED",
  VOIDED: "VOIDED",
  ERROR: "ERROR",
};

/** Lee un valor anidado de un objeto usando un path tipo "transaction.id". */
function getByPath(obj: any, path: string): unknown {
  return path.split(".").reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

export class WompiProvider implements PaymentProvider {
  constructor(private readonly cfg: WompiConfig) {}

  buildCheckoutLink(req: CheckoutLinkRequest): CheckoutLinkResult {
    if (!this.cfg.publicKey || !this.cfg.integritySecret) {
      throw new Error("WOMPI_PUBLIC_KEY / WOMPI_INTEGRITY_SECRET no configurados");
    }

    const integrityPayload = `${req.reference}${req.amountCents}${req.currency}${this.cfg.integritySecret}`;
    const integritySignature = crypto.createHash("sha256").update(integrityPayload).digest("hex");

    const params = new URLSearchParams({
      "public-key": this.cfg.publicKey,
      currency: req.currency,
      "amount-in-cents": String(req.amountCents),
      reference: req.reference,
      "signature:integrity": integritySignature,
      "redirect-url": req.redirectUrl,
    });
    if (req.customerEmail) {
      params.set("customer-data:email", req.customerEmail);
    }

    return { checkoutUrl: `https://checkout.wompi.co/p/?${params.toString()}` };
  }

  /**
   * Valida el checksum del evento leyendo `signature.properties` dinamicamente
   * (no se asume una lista fija de campos), tal como documenta Wompi.
   */
  verifyWebhookSignature(rawBody: any): WebhookVerificationResult {
    if (!this.cfg.eventsSecret) {
      return { valid: false, reason: "WOMPI_EVENTS_SECRET no configurado" };
    }
    const signature = rawBody?.signature;
    const properties: string[] | undefined = signature?.properties;
    const providedChecksum: string | undefined = signature?.checksum;
    const timestamp = rawBody?.timestamp;

    if (!properties || !Array.isArray(properties) || properties.length === 0) {
      return { valid: false, reason: "Evento sin signature.properties" };
    }
    if (!providedChecksum || timestamp === undefined) {
      return { valid: false, reason: "Evento sin checksum o timestamp" };
    }

    const concatenatedValues = properties
      .map((prop) => String(getByPath(rawBody.data, prop) ?? ""))
      .join("");
    const toHash = `${concatenatedValues}${timestamp}${this.cfg.eventsSecret}`;
    const computed = crypto.createHash("sha256").update(toHash).digest("hex").toUpperCase();

    const valid = computed === String(providedChecksum).toUpperCase();
    return valid ? { valid: true } : { valid: false, reason: "Checksum no coincide" };
  }

  normalizeWebhookEvent(rawBody: any): NormalizedPaymentEvent {
    const tx = rawBody?.data?.transaction;
    if (!tx) {
      throw new Error("Evento sin data.transaction");
    }
    const status = WOMPI_TO_INTERNAL_STATUS[tx.status] ?? "ERROR";
    const providerEventId = `${tx.id}:${tx.status}:${rawBody.timestamp}`;

    return {
      providerEventId,
      providerTransactionId: String(tx.id),
      reference: String(tx.reference),
      status,
      amountCents: Number(tx.amount_in_cents),
      currency: String(tx.currency),
      paymentMethod: tx.payment_method_type ? String(tx.payment_method_type) : undefined,
      approvedAt: status === "APPROVED" ? new Date() : undefined,
    };
  }
}
