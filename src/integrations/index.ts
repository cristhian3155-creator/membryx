import { config } from "../config";
import type { PaymentProvider } from "./payments/payment-provider";
import { WompiProvider } from "./payments/wompi-provider";
import type { WhatsAppProvider } from "./whatsapp/whatsapp-provider";
import { TwilioWhatsAppSandboxProvider } from "./whatsapp/twilio-provider";
import { MetaWhatsAppCloudProvider } from "./whatsapp/meta-provider";

let paymentProviderInstance: PaymentProvider | null = null;
let whatsappProviderInstance: WhatsAppProvider | null = null;

export function getPaymentProvider(): PaymentProvider {
  if (!paymentProviderInstance) {
    if (config.paymentProvider !== "wompi") {
      throw new Error(`Proveedor de pago no soportado: ${config.paymentProvider}`);
    }
    paymentProviderInstance = new WompiProvider(config.wompi);
  }
  return paymentProviderInstance;
}

export function getWhatsAppProvider(): WhatsAppProvider {
  if (!whatsappProviderInstance) {
    if (config.whatsappProvider === "meta") {
      whatsappProviderInstance = new MetaWhatsAppCloudProvider(config.metaWhatsapp);
    } else if (config.whatsappProvider === "twilio") {
      whatsappProviderInstance = new TwilioWhatsAppSandboxProvider(config.twilio);
    } else {
      throw new Error(`Proveedor de WhatsApp no soportado: ${config.whatsappProvider}`);
    }
  }
  return whatsappProviderInstance;
}
