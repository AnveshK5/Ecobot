import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { comparePassword, hashPassword, signToken } from "../utils/auth.js";
import { ApiError, asyncHandler } from "../utils/http.js";

const router = Router();

const authSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  email: z.string().email(),
  password: z.string().min(8).max(128)
});

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
            energyUsageType: "grid"
          }
        }
      }
    });

    const safeUser = { id: user.id, name: user.name, email: user.email };
    res.status(201).json({
      token: signToken(safeUser),
      user: safeUser
    });
  })
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const input = authSchema.omit({ name: true }).parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() }
    });

    if (!user || !(await comparePassword(input.password, user.passwordHash))) {
      throw new ApiError(401, "Invalid email or password");
    }

    const safeUser = { id: user.id, name: user.name, email: user.email };
    res.json({
      token: signToken(safeUser),
      user: safeUser
    });
  })
);

export default router;
