import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/auth.js";
import { ApiError } from "../utils/http.js";

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return next(new ApiError(401, "Authentication required"));
  }

  const token = authHeader.slice("Bearer ".length);

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    next(new ApiError(401, "Invalid or expired token"));
  }
}
