import "dotenv/config";
import { z } from "zod";

const intFromString = (name: string) =>
  z
    .string({ required_error: `Falta la variable de entorno ${name}` })
    .regex(/^\d+$/, `${name} debe ser un entero`)
    .transform(Number);

/** Color hex (#rgb o #rrggbb) para la identidad visual del panel por negocio. */
const hexColor = (name: string, fallback: string) =>
  z
    .string()
    .trim()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, `${name} debe ser un color hex, ej. #4F46E5`)
    .default(fallback);

/** URL http(s) opcional; variable ausente o cadena vacia -> undefined. */
const optionalUrl = z
  .string()
  .trim()
  .default("")
  .transform((v) => (v.length === 0 ? undefined : v))
  .pipe(z.string().url().optional());

const csvIntArray = (name: string) =>
  z
    .string({ required_error: `Falta la variable de entorno ${name}` })
    .transform((raw) =>
      raw
        .split(",")
        .map((part) => part.trim())
        .filter((part) => part.length > 0)
        .map((part) => {
          const n = Number(part);
          if (!Number.isInteger(n)) {
            throw new Error(`Valor invalido en ${name}: "${part}"`);
          }
          return n;
        })
    );

const envSchema = z.object({
  BUSINESS_NAME: z.string().min(1),
  BUSINESS_TIMEZONE: z.string().min(1),
  CURRENCY: z.string().min(1),
  ENVIRONMENT: z.enum(["demo", "production"]),
  APP_BASE_URL: z.string().url(),

  // Identidad visual del panel (opcional; por negocio). Sin estas variables el panel
  // usa la marca Membryx por defecto.
  BRAND_NAME: z.string().trim().default(""),
  BRAND_PRIMARY: hexColor("BRAND_PRIMARY", "#4F46E5"),
  BRAND_PRIMARY_DARK: hexColor("BRAND_PRIMARY_DARK", "#4338CA"),
  BRAND_ACCENT: hexColor("BRAND_ACCENT", "#06B6D4"),
  BRAND_LOGO_URL: optionalUrl,
  BRAND_FAVICON_URL: optionalUrl,

  REMINDER_DAYS: csvIntArray("REMINDER_DAYS"),

  MONTHLY_DURATION_DAYS: intFromString("MONTHLY_DURATION_DAYS"),
  QUARTERLY_DURATION_DAYS: intFromString("QUARTERLY_DURATION_DAYS"),
  SEMESTER_DURATION_DAYS: intFromString("SEMESTER_DURATION_DAYS"),
  ANNUAL_DURATION_DAYS: intFromString("ANNUAL_DURATION_DAYS"),

  MONTHLY_PRICE_CENTS: intFromString("MONTHLY_PRICE_CENTS"),
  QUARTERLY_PRICE_CENTS: intFromString("QUARTERLY_PRICE_CENTS"),
  SEMESTER_PRICE_CENTS: intFromString("SEMESTER_PRICE_CENTS"),
  ANNUAL_PRICE_CENTS: intFromString("ANNUAL_PRICE_CENTS"),

  PAYMENT_PROVIDER: z.literal("wompi"),
  WHATSAPP_PROVIDER: z.enum(["twilio", "meta"]),

  DATABASE_URL: z.string().min(1),

  WOMPI_PUBLIC_KEY: z.string().default(""),
  WOMPI_INTEGRITY_SECRET: z.string().default(""),
  WOMPI_EVENTS_SECRET: z.string().default(""),

  TWILIO_ACCOUNT_SID: z.string().default(""),
  TWILIO_AUTH_TOKEN: z.string().default(""),
  TWILIO_WHATSAPP_FROM: z.string().default(""),

  META_WHATSAPP_PHONE_NUMBER_ID: z.string().default(""),
  META_WHATSAPP_ACCESS_TOKEN: z.string().default(""),
  META_WHATSAPP_BUSINESS_ACCOUNT_ID: z.string().default(""),
  META_WHATSAPP_VERIFY_TOKEN: z.string().default(""),
  META_WHATSAPP_API_VERSION: z.string().default("v21.0"),
  META_WHATSAPP_LANGUAGE_CODE: z.string().default("es"),
  META_WHATSAPP_TEMPLATE_PAYMENT_CONFIRMATION: z.string().default("payment_confirmation_v2"),
  META_WHATSAPP_TEMPLATE_EXPIRY_REMINDER: z.string().default("expiry_reminder_v2"),
  // "template": mensaje de negocio vía plantilla aprobada (requisito real de WhatsApp
  // Business Platform fuera de la ventana de 24h). "text": texto libre, solo entregable
  // dentro de la ventana de 24h abierta por un mensaje previo del cliente — util mientras
  // las plantillas propias siguen en revision de Meta.
  META_WHATSAPP_MESSAGE_MODE: z.enum(["template", "text"]).default("template"),

  ADMIN_EMAIL: z.string().email(),
  ADMIN_PASSWORD_HASH: z.string().min(1),
  SESSION_SECRET: z.string().min(1),

  PORT: intFromString("PORT").default(3000 as unknown as never).optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  throw new Error(`Configuracion invalida.\n${issues}`);
}

const env = parsed.data;

export type PlanCode = "monthly" | "quarterly" | "semester" | "annual";

export const PLAN_DEFINITIONS: Record<
  PlanCode,
  { name: string; durationDays: number; priceCents: number }
> = {
  monthly: {
    name: "Mensual",
    durationDays: env.MONTHLY_DURATION_DAYS,
    priceCents: env.MONTHLY_PRICE_CENTS,
  },
  quarterly: {
    name: "Trimestral",
    durationDays: env.QUARTERLY_DURATION_DAYS,
    priceCents: env.QUARTERLY_PRICE_CENTS,
  },
  semester: {
    name: "Semestral",
    durationDays: env.SEMESTER_DURATION_DAYS,
    priceCents: env.SEMESTER_PRICE_CENTS,
  },
  annual: {
    name: "Anual",
    durationDays: env.ANNUAL_DURATION_DAYS,
    priceCents: env.ANNUAL_PRICE_CENTS,
  },
};

export const config = {
  business: {
    name: env.BUSINESS_NAME,
    timezone: env.BUSINESS_TIMEZONE,
    currency: env.CURRENCY,
    environment: env.ENVIRONMENT,
    baseUrl: env.APP_BASE_URL,
  },
  brand: {
    name: env.BRAND_NAME || env.BUSINESS_NAME,
    primary: env.BRAND_PRIMARY,
    primaryDark: env.BRAND_PRIMARY_DARK,
    accent: env.BRAND_ACCENT,
    logoUrl: env.BRAND_LOGO_URL,
    faviconUrl: env.BRAND_FAVICON_URL,
  },
  reminderDays: env.REMINDER_DAYS as number[],
  plans: PLAN_DEFINITIONS,
  paymentProvider: env.PAYMENT_PROVIDER,
  whatsappProvider: env.WHATSAPP_PROVIDER,
  database: {
    url: env.DATABASE_URL,
  },
  wompi: {
    publicKey: env.WOMPI_PUBLIC_KEY,
    integritySecret: env.WOMPI_INTEGRITY_SECRET,
    eventsSecret: env.WOMPI_EVENTS_SECRET,
  },
  twilio: {
    accountSid: env.TWILIO_ACCOUNT_SID,
    authToken: env.TWILIO_AUTH_TOKEN,
    whatsappFrom: env.TWILIO_WHATSAPP_FROM,
  },
  metaWhatsapp: {
    phoneNumberId: env.META_WHATSAPP_PHONE_NUMBER_ID,
    accessToken: env.META_WHATSAPP_ACCESS_TOKEN,
    businessAccountId: env.META_WHATSAPP_BUSINESS_ACCOUNT_ID,
    verifyToken: env.META_WHATSAPP_VERIFY_TOKEN,
    apiVersion: env.META_WHATSAPP_API_VERSION,
    languageCode: env.META_WHATSAPP_LANGUAGE_CODE,
    templates: {
      paymentConfirmation: env.META_WHATSAPP_TEMPLATE_PAYMENT_CONFIRMATION,
      expiryReminder: env.META_WHATSAPP_TEMPLATE_EXPIRY_REMINDER,
    },
    messageMode: env.META_WHATSAPP_MESSAGE_MODE,
  },
  admin: {
    email: env.ADMIN_EMAIL,
    passwordHash: env.ADMIN_PASSWORD_HASH,
  },
  sessionSecret: env.SESSION_SECRET,
  port: env.PORT ?? 3000,
} as const;

export const isDemo = config.business.environment === "demo";
