import type {
  ExpiryReminderInput,
  PaymentConfirmationInput,
  SendMessageResult,
  WhatsAppProvider,
} from "./whatsapp-provider";

interface MetaWhatsAppConfig {
  phoneNumberId: string;
  accessToken: string;
  apiVersion: string;
  languageCode: string;
  templates: {
    paymentConfirmation: string;
    expiryReminder: string;
  };
}

/** Deja solo digitos, formato que espera la Cloud API en el campo "to" (sin "+", sin "whatsapp:"). */
function toE164Digits(phone: string): string {
  return phone.replace(/[^\d]/g, "");
}

/**
 * Envia mensajes via WhatsApp Cloud API (Meta) usando plantillas aprobadas.
 *
 * Nota importante: los mensajes iniciados por el negocio (confirmacion de pago,
 * recordatorios) DEBEN usar una plantilla aprobada por Meta — el texto libre
 * ("type": "text") solo se entrega dentro de una ventana de 24h abierta por un
 * mensaje previo del cliente. Por eso esta implementacion no manda texto libre.
 * Ver PRODUCTION_MIGRATION.md / DEMO.md para el estado de aprobacion de las plantillas.
 */
export class MetaWhatsAppCloudProvider implements WhatsAppProvider {
  constructor(private readonly cfg: MetaWhatsAppConfig) {
    if (!cfg.phoneNumberId || !cfg.accessToken) {
      throw new Error("META_WHATSAPP_PHONE_NUMBER_ID / META_WHATSAPP_ACCESS_TOKEN no configurados");
    }
  }

  private async sendTemplate(toPhone: string, templateName: string, params: string[]): Promise<SendMessageResult> {
    const url = `https://graph.facebook.com/${this.cfg.apiVersion}/${this.cfg.phoneNumberId}/messages`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.cfg.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: toE164Digits(toPhone),
          type: "template",
          template: {
            name: templateName,
            language: { code: this.cfg.languageCode },
            components: [
              {
                type: "body",
                parameters: params.map((text) => ({ type: "text", text })),
              },
            ],
          },
        }),
      });

      const json: any = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorMessage = json?.error?.error_user_msg || json?.error?.message || `HTTP ${res.status}`;
        return { success: false, errorMessage };
      }

      const providerMessageId = json?.messages?.[0]?.id;
      return { success: true, providerMessageId };
    } catch (err: any) {
      return { success: false, errorMessage: err?.message ?? "Error desconocido enviando WhatsApp (Meta)" };
    }
  }

  sendPaymentConfirmation(input: PaymentConfirmationInput): Promise<SendMessageResult> {
    return this.sendTemplate(input.toPhone, this.cfg.templates.paymentConfirmation, [
      input.customerName,
      input.planName,
      input.expirationDateIso,
    ]);
  }

  sendExpiryReminder(input: ExpiryReminderInput): Promise<SendMessageResult> {
    return this.sendTemplate(input.toPhone, this.cfg.templates.expiryReminder, [
      input.customerName,
      input.planName,
      input.expirationDateIso,
    ]);
  }

  sendExpiryNotice(input: ExpiryReminderInput): Promise<SendMessageResult> {
    return this.sendExpiryReminder(input);
  }
}
