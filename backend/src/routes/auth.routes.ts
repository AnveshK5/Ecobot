import { type Response, Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { comparePassword, createSession, destroySession, hashPassword } from "../utils/auth.js";
import { ApiError, asyncHandler } from "../utils/http.js";

const router = Router();

const authSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  email: z.string().email(),
  password: z.string().min(8).max(128)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128)
});

function setSessionCookie(res: Response, sessionId: string, expiresAt: Date) {
  res.cookie("ecobot_session", sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    expires: expiresAt
  });
}

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const input = authSchema.extend({ name: z.string().min(2).max(120) }).parse(req.body);

    const existing = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() }
    });

    if (existing) {
      throw new ApiError(409, "Email already registered");
    }

    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email.toLowerCase(),
        passwordHash: await hashPassword(input.password),
        preferences: {
          create: {
            dietType: "balanced",
            transportMode: "mixed",
            energyUsageType: "grid",
            units: "metric"
          }
        }
      }
    });

    const safeUser = { id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin };
    const session = await createSession(safeUser);
    setSessionCookie(res, session.sessionId, session.expiresAt);

    res.status(201).json({
      user: safeUser
    });
  })
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const input = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() }
    });

    if (!user || !(await comparePassword(input.password, user.passwordHash))) {
      throw new ApiError(401, "Invalid email or password");
    }

    const safeUser = { id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin };
    const session = await createSession(safeUser);
    setSessionCookie(res, session.sessionId, session.expiresAt);

    res.json({
      user: safeUser
    });
  })
);

router.post(
  "/logout",
  asyncHandler(async (req, res) => {
    const sessionId = req.cookies?.ecobot_session;
    if (sessionId) {
      await destroySession(sessionId);
    }

    res.clearCookie("ecobot_session");
    res.json({ ok: true });
  })
);

export default router;
