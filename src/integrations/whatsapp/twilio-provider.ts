import twilio from "twilio";
import { messageTemplates } from "./message-templates";
import type {
  ExpiryReminderInput,
  PaymentConfirmationInput,
  SendMessageResult,
  WhatsAppProvider,
} from "./whatsapp-provider";

interface TwilioConfig {
  accountSid: string;
  authToken: string;
  whatsappFrom: string;
}

function toWhatsAppAddress(phone: string): string {
  return phone.startsWith("whatsapp:") ? phone : `whatsapp:${phone}`;
}

export class TwilioWhatsAppSandboxProvider implements WhatsAppProvider {
  private readonly client: twilio.Twilio;

  constructor(private readonly cfg: TwilioConfig) {
    if (!cfg.accountSid || !cfg.authToken) {
      throw new Error("TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN no configurados");
    }
    this.client = twilio(cfg.accountSid, cfg.authToken);
  }

  private async send(toPhone: string, body: string): Promise<SendMessageResult> {
    try {
      const message = await this.client.messages.create({
        from: toWhatsAppAddress(this.cfg.whatsappFrom),
        to: toWhatsAppAddress(toPhone),
        body,
      });
      return { success: true, providerMessageId: message.sid };
    } catch (err: any) {
      return { success: false, errorMessage: err?.message ?? "Error desconocido enviando WhatsApp" };
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
