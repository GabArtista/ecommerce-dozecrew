import { defineMiddlewares } from "@medusajs/framework";

/**
 * Normalizes email to lowercase in request body.
 * Fixes case-sensitivity issue with emailpass auth provider.
 */
const normalizeEmail = (req: any, _res: any, next: any) => {
  if (req.body?.email && typeof req.body.email === "string") {
    req.body.email = req.body.email.toLowerCase();
  }
  next();
};

export default defineMiddlewares({
  routes: [
    {
      method: ["POST"],
      matcher: "/admin/auth/emailpass",
      middlewares: [normalizeEmail],
    },
    {
      method: ["POST"],
      matcher: "/store/auth/emailpass",
      middlewares: [normalizeEmail],
    },
  ],
});
