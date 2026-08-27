import type { ExpiryReminderInput, PaymentConfirmationInput } from "./whatsapp-provider";

/**
 * Textos de los mensajes, centralizados para no dispersar copy por el codigo (spec #6).
 * Para produccion con WhatsApp Business fuera del Sandbox, estos textos deben migrarse
 * a plantillas aprobadas por Meta (ver PRODUCTION_MIGRATION.md).
 */
export const messageTemplates = {
  paymentConfirmation(input: PaymentConfirmationInput): string {
    return (
      `Hola ${input.customerName}! Confirmamos tu pago del plan ${input.planName}. ` +
      `Tu membresia esta activa hasta el ${input.expirationDateIso}. Gracias por tu pago.`
    );
  },
  expiryReminder(input: ExpiryReminderInput): string {
    if (input.daysUntilExpiration === 0) {
      return (
        `Hola ${input.customerName}, tu membresia (${input.planName}) vence HOY ${input.expirationDateIso}. ` +
        `Renueva hoy para no perder tu acceso.`
      );
    }
    return (
      `Hola ${input.customerName}, tu membresia (${input.planName}) vence en ${input.daysUntilExpiration} dia(s), ` +
      `el ${input.expirationDateIso}. Renueva pronto para no perder tu acceso.`
    );
  },
};
