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
  languageCode: string;
  templates: {
    paymentConfirmation: string;
    expiryReminder: string;
  };
  messageMode: "template" | "text";
}

/** Deja solo digitos, formato que espera la Cloud API en el campo "to" (sin "+", sin "whatsapp:"). */
function toE164Digits(phone: string): string {
  return phone.replace(/[^\d]/g, "");
}

/**
 * Envia mensajes via WhatsApp Cloud API (Meta).
 *
 * Los mensajes iniciados por el negocio (confirmacion de pago, recordatorios) deben usar
 * una plantilla aprobada por Meta fuera de la ventana de 24h de una conversacion abierta
 * por el cliente. Modo "template" (default, recomendado para produccion) hace eso.
 * Modo "text" envia texto libre — solo se entrega si el cliente escribio primero dentro
 * de las ultimas 24h; util mientras las plantillas propias siguen en revision de Meta.
 * Ver PRODUCTION_MIGRATION.md / DEMO.md.
 */
export class MetaWhatsAppCloudProvider implements WhatsAppProvider {
  constructor(private readonly cfg: MetaWhatsAppConfig) {
    if (!cfg.phoneNumberId || !cfg.accessToken) {
      throw new Error("META_WHATSAPP_PHONE_NUMBER_ID / META_WHATSAPP_ACCESS_TOKEN no configurados");
    }
  }

  private async postMessage(body: Record<string, unknown>): Promise<SendMessageResult> {
    const url = `https://graph.facebook.com/${this.cfg.apiVersion}/${this.cfg.phoneNumberId}/messages`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.cfg.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
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

  private sendTemplate(toPhone: string, templateName: string, params: string[]): Promise<SendMessageResult> {
    return this.postMessage({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: toE164Digits(toPhone),
      type: "template",
      template: {
        name: templateName,
        language: { code: this.cfg.languageCode },
        components: [{ type: "body", parameters: params.map((text) => ({ type: "text", text })) }],
      },
    });
  }

  private sendText(toPhone: string, body: string): Promise<SendMessageResult> {
    return this.postMessage({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: toE164Digits(toPhone),
      type: "text",
      text: { body, preview_url: false },
    });
  }

  sendPaymentConfirmation(input: PaymentConfirmationInput): Promise<SendMessageResult> {
    if (this.cfg.messageMode === "text") {
      return this.sendText(input.toPhone, messageTemplates.paymentConfirmation(input));
    }
    return this.sendTemplate(input.toPhone, this.cfg.templates.paymentConfirmation, [
      input.customerName,
      input.planName,
      input.expirationDateIso,
    ]);
  }

  sendExpiryReminder(input: ExpiryReminderInput): Promise<SendMessageResult> {
    if (this.cfg.messageMode === "text") {
      return this.sendText(input.toPhone, messageTemplates.expiryReminder(input));
    }
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
