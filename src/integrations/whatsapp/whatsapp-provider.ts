export interface SendMessageResult {
  success: boolean;
  providerMessageId?: string;
  errorMessage?: string;
}

export interface PaymentConfirmationInput {
  toPhone: string;
  customerName: string;
  planName: string;
  expirationDateIso: string;
}

export interface ExpiryReminderInput {
  toPhone: string;
  customerName: string;
  planName: string;
  expirationDateIso: string;
  daysUntilExpiration: number;
}

/**
 * Contrato de mensajeria WhatsApp. La logica de membresias/recordatorios depende
 * solo de esta interfaz, nunca del SDK de Twilio directamente.
 */
export interface WhatsAppProvider {
  sendPaymentConfirmation(input: PaymentConfirmationInput): Promise<SendMessageResult>;
  sendExpiryReminder(input: ExpiryReminderInput): Promise<SendMessageResult>;
  sendExpiryNotice(input: ExpiryReminderInput): Promise<SendMessageResult>;
}
