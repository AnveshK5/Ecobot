import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { ApiError } from "../utils/http.js";

export function notFoundHandler(_req: Request, _res: Response, next: NextFunction) {
  next(new ApiError(404, "Route not found"));
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (error instanceof ZodError) {
    return res.status(400).json({
      error: "Validation failed",
      details: error.flatten()
    });
  }

  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({ error: error.message });
  }

  console.error(error);

  return res.status(500).json({
    error: "Internal server error"
  });
}
