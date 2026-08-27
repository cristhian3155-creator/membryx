import { messageTemplates } from "./message-templates";
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
}

/** Deja solo digitos, formato que espera la Cloud API en el campo "to" (sin "+", sin "whatsapp:"). */
function toE164Digits(phone: string): string {
  return phone.replace(/[^\d]/g, "");
}

/**
 * Envia mensajes de texto libre via WhatsApp Cloud API (Meta).
 * Nota operativa: en modo desarrollo, la Cloud API solo entrega mensajes a numeros
 * agregados como "recipient de prueba" en el dashboard de la app (WhatsApp > Configuracion
 * de la API), o dentro de la ventana de 24h de una conversacion ya iniciada por el cliente.
 * Ver DEMO.md para el detalle.
 */
export class MetaWhatsAppCloudProvider implements WhatsAppProvider {
  constructor(private readonly cfg: MetaWhatsAppConfig) {
    if (!cfg.phoneNumberId || !cfg.accessToken) {
      throw new Error("META_WHATSAPP_PHONE_NUMBER_ID / META_WHATSAPP_ACCESS_TOKEN no configurados");
    }
  }

  private async send(toPhone: string, body: string): Promise<SendMessageResult> {
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
          type: "text",
          text: { body, preview_url: false },
        }),
      });

      const json: any = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorMessage = json?.error?.message ?? `HTTP ${res.status}`;
        return { success: false, errorMessage };
      }

      const providerMessageId = json?.messages?.[0]?.id;
      return { success: true, providerMessageId };
    } catch (err: any) {
      return { success: false, errorMessage: err?.message ?? "Error desconocido enviando WhatsApp (Meta)" };
    }
  }

  sendPaymentConfirmation(input: PaymentConfirmationInput): Promise<SendMessageResult> {
    return this.send(input.toPhone, messageTemplates.paymentConfirmation(input));
  }

  sendExpiryReminder(input: ExpiryReminderInput): Promise<SendMessageResult> {
    return this.send(input.toPhone, messageTemplates.expiryReminder(input));
  }

  sendExpiryNotice(input: ExpiryReminderInput): Promise<SendMessageResult> {
    return this.send(input.toPhone, messageTemplates.expiryReminder(input));
  }
}
