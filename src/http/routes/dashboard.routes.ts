import { Router } from "express";
import { prisma } from "../../db/client";
import { config } from "../../config";
import { requireAuth } from "../middleware/auth";
import { businessToday } from "../../domain/dates";

export const dashboardRouter = Router();
dashboardRouter.use(requireAuth);

dashboardRouter.get("/", async (req, res) => {
  const today = businessToday(config.business.timezone).toJSDate();
  const monthStart = businessToday(config.business.timezone).startOf("month").toJSDate();

  const [activeCount, expiringCount, expiredCount, paymentsThisMonth, lastSchedulerRun, latestWebhook] =
    await Promise.all([
      prisma.membership.count({ where: { status: "ACTIVE" } }),
      prisma.membership.count({ where: { status: "EXPIRING" } }),
      prisma.membership.count({ where: { status: "EXPIRED" } }),
      prisma.payment.findMany({
        where: { status: "APPROVED", approvedAt: { gte: monthStart } },
        select: { amountCents: true },
      }),
      prisma.schedulerRun.findFirst({ orderBy: { ranAt: "desc" } }),
      prisma.webhookEvent.findFirst({ orderBy: { createdAt: "desc" } }),
    ]);

  const revenueThisMonthCents = paymentsThisMonth.reduce((sum, p) => sum + p.amountCents, 0);

  res.render("dashboard/summary", {
    business: config.business,
    today,
    activeCount,
    expiringCount,
    expiredCount,
    paymentsThisMonthCount: paymentsThisMonth.length,
    revenueThisMonthCents,
    lastSchedulerRun,
    latestWebhook,
    wompiConfigured: Boolean(config.wompi.publicKey && config.wompi.integritySecret && config.wompi.eventsSecret),
    whatsappProviderName: config.whatsappProvider,
    twilioConfigured:
      config.whatsappProvider === "meta"
        ? Boolean(config.metaWhatsapp.phoneNumberId && config.metaWhatsapp.accessToken)
        : Boolean(config.twilio.accountSid && config.twilio.authToken),
  });
});

dashboardRouter.get("/customers", async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = 50;
  const search = String(req.query.q ?? "").trim();

  const where = search
    ? {
        OR: [
          { fullName: { contains: search, mode: "insensitive" as const } },
          { phone: { contains: search } },
        ],
      }
    : {};

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      include: { memberships: { orderBy: { expirationDate: "desc" as const }, take: 1, include: { plan: true } } },
      orderBy: { fullName: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.customer.count({ where }),
  ]);

  res.render("dashboard/customers", {
    business: config.business,
    customers,
    page,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    search,
  });
});

dashboardRouter.get("/customers/:id", async (req, res) => {
  const customer = await prisma.customer.findUnique({
    where: { id: req.params.id },
    include: {
      memberships: { orderBy: { expirationDate: "desc" }, include: { plan: true } },
      payments: { orderBy: { createdAt: "desc" } },
      notifications: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!customer) return res.status(404).render("not-found", { business: config.business });

  const plans = await prisma.plan.findMany({ where: { businessId: customer.businessId, active: true } });

  res.render("dashboard/customer-detail", {
    business: config.business,
    customer,
    plans,
    paymentNotice: req.query.payment ?? null,
  });
});

dashboardRouter.get("/payments", async (req, res) => {
  const payments = await prisma.payment.findMany({
    include: { customer: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  res.render("dashboard/payments", { business: config.business, payments });
});

dashboardRouter.get("/notifications", async (req, res) => {
  const notifications = await prisma.notification.findMany({
    include: { customer: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  res.render("dashboard/notifications", { business: config.business, notifications });
});
