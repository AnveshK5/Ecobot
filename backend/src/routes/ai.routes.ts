import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { generateChatResponse, generateSuggestions } from "../services/ai.service.js";
import { asyncHandler } from "../utils/http.js";

const router = Router();

router.use(requireAuth);

router.post(
  "/suggestions",
  asyncHandler(async (req, res) => {
    const userContext = await prisma.user.findUniqueOrThrow({
      where: { id: req.user!.id },
      include: {
        preferences: true,
        chatLogs: {
          orderBy: { timestamp: "desc" },
          take: 6
        },
        activities: {
          include: { activity: true },
          orderBy: { createdAt: "desc" },
          take: 20
        }
      }
    });

    const result = await generateSuggestions(
      userContext.activities,
      userContext.preferences,
      userContext.chatLogs
    );
    res.json(result);
  })
);

router.post(
  "/chat",
  asyncHandler(async (req, res) => {
    const input = z.object({ message: z.string().min(1).max(1000) }).parse(req.body);

    const userContext = await prisma.user.findUniqueOrThrow({
      where: { id: req.user!.id },
      include: {
        preferences: true,
        chatLogs: {
          orderBy: { timestamp: "asc" },
          take: 8
        },
        activities: {
          include: { activity: true },
          orderBy: { createdAt: "desc" },
          take: 20
        }
      }
    });

    const response = await generateChatResponse({
      message: input.message,
      activities: userContext.activities,
      preference: userContext.preferences,
      chatHistory: userContext.chatLogs
    });

    await prisma.chatLog.create({
      data: {
        userId: req.user!.id,
        message: input.message,
        response
      }
    });

    res.json({ response });
  })
);

router.get(
  "/history",
  asyncHandler(async (req, res) => {
    const chats = await prisma.chatLog.findMany({
      where: { userId: req.user!.id },
      orderBy: { timestamp: "asc" }
    });

    res.json({ chats });
  })
);

export default router;
