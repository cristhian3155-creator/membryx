import path from "node:path";
import express from "express";
import session from "express-session";
import { config } from "../config";
import { authRouter } from "./routes/auth.routes";
import { webhookRouter } from "./routes/webhook.routes";
import { checkoutRouter } from "./routes/checkout.routes";
import { dashboardRouter } from "./routes/dashboard.routes";
import { importRouter } from "./routes/import.routes";
import { metaWebhookRouter } from "./routes/meta-webhook.routes";

export function createApp() {
  const app = express();

  app.set("view engine", "ejs");
  app.set("views", path.join(__dirname, "..", "dashboard", "views"));

  app.get("/health", (req, res) => res.json({ ok: true, environment: config.business.environment }));

  app.use("/webhooks", express.json({ limit: "1mb" }), webhookRouter);
  app.use("/webhooks", express.json({ limit: "1mb" }), metaWebhookRouter);

  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use(
    session({
      secret: config.sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: { httpOnly: true, secure: config.business.environment === "production", maxAge: 8 * 60 * 60 * 1000 },
    })
  );

  app.use("/", authRouter);
  app.use("/checkout", checkoutRouter);
  app.use("/dashboard", dashboardRouter);
  app.use("/dashboard/import", importRouter);

  app.get("/", (req, res) => res.redirect("/dashboard"));

  return app;
}
