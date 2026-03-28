import { prisma } from "../lib/prisma.js";
import { addDays, startOfDay, startOfMonth, startOfWeek } from "../utils/date.js";

export async function getCarbonSummary(userId: string) {
  const now = new Date();
  const dayStart = startOfDay(now);
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);

  const [dailyTotal, weeklyTotal, monthlyTotal, recentActivities] = await Promise.all([
    prisma.userActivity.aggregate({
      _sum: { carbonEmission: true },
      where: { userId, createdAt: { gte: dayStart } }
    }),
    prisma.userActivity.aggregate({
      _sum: { carbonEmission: true },
      where: { userId, createdAt: { gte: weekStart } }
    }),
    prisma.userActivity.aggregate({
      _sum: { carbonEmission: true },
      where: { userId, createdAt: { gte: monthStart } }
    }),
    prisma.userActivity.findMany({
      where: { userId, createdAt: { gte: addDays(dayStart, -6) } },
      select: {
        carbonEmission: true,
        createdAt: true
      }
    })
  ]);

  const timeline = Array.from({ length: 7 }, (_, index) => {
    const current = addDays(dayStart, index - 6);
    const dayKey = current.toISOString().slice(0, 10);
    const total = recentActivities
      .filter((item) => item.createdAt.toISOString().slice(0, 10) === dayKey)
      .reduce((sum, item) => sum + item.carbonEmission, 0);

    return {
      date: dayKey,
      carbonEmission: Number(total.toFixed(2))
    };
  });

  return {
    daily: Number((dailyTotal._sum.carbonEmission ?? 0).toFixed(2)),
    weekly: Number((weeklyTotal._sum.carbonEmission ?? 0).toFixed(2)),
    monthly: Number((monthlyTotal._sum.carbonEmission ?? 0).toFixed(2)),
    timeline
  };
}
