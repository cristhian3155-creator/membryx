import { Router } from "express";
import bcrypt from "bcryptjs";
import { config } from "../../config";

export const authRouter = Router();

authRouter.get("/login", (req, res) => {
  res.render("login", { error: null, business: config.business });
});

authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  const emailOk = email?.trim().toLowerCase() === config.admin.email.toLowerCase();
  const passwordOk = emailOk && password ? await bcrypt.compare(password, config.admin.passwordHash) : false;

  if (!emailOk || !passwordOk) {
    return res.status(401).render("login", { error: "Credenciales invalidas", business: config.business });
  }

  req.session.isAdmin = true;
  req.session.adminEmail = config.admin.email;
  res.redirect("/dashboard");
});

authRouter.post("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login"));
});
