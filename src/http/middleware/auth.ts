import type { NextFunction, Request, Response } from "express";

declare module "express-session" {
  interface SessionData {
    isAdmin?: boolean;
    adminEmail?: string;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.session?.isAdmin) {
    return next();
  }
  return res.redirect("/login");
}
