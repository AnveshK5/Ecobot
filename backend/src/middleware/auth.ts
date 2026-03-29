import type { Request, Response, NextFunction } from "express";
import { UserRole } from "@prisma/client";
import { getUserFromSession, isSuperuser } from "../utils/auth.js";
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
  if (!req.user || !isSuperuser(req.user)) {
    return next(new ApiError(403, "Admin access required"));
  }

  next();
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, "Authentication required"));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, "Insufficient role permissions"));
    }

    next();
  };
}
