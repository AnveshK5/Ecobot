import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { prisma } from "../lib/prisma.js";

export type SafeUser = {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(user: SafeUser) {
  const sessionId = randomUUID();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

  await prisma.session.create({
    data: {
      id: sessionId,
      userId: user.id,
      expiresAt
    }
  });

  return { sessionId, expiresAt };
}

export async function getUserFromSession(sessionId: string) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: true }
  });

  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.session.delete({ where: { id: sessionId } }).catch(() => null);
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    isAdmin: session.user.isAdmin
  } satisfies SafeUser;
}

export async function destroySession(sessionId: string) {
  await prisma.session.delete({ where: { id: sessionId } }).catch(() => null);
}
