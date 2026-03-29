import type { Request, Response, NextFunction } from "express";
import { getUserFromSession } from "../utils/auth.js";
import { ApiError } from "../utils/http.js";

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const sessionId = req.cookies?.ecobot_session;

  if (!sessionId) {
    return next(new ApiError(401, "Authentication required"));
  }

  const user = await getUserFromSession(sessionId);
  if (!user) {
    return next(new ApiError(401, "Invalid or expired session"));
  }

  req.user = user;
  next();
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.user?.isAdmin) {
    return next(new ApiError(403, "Admin access required"));
  }

  next();
}
