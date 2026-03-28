import { prisma } from "../lib/prisma.js";
import { startOfWeek } from "../utils/date.js";

export async function createWeeklyReports() {
  const now = new Date();
  const weekStart = startOfWeek(now);

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true }
  });

  for (const user of users) {
    const activities = await prisma.userActivity.findMany({
      where: { userId: user.id, createdAt: { gte: weekStart } },
      include: { activity: true }
    });

    const total = activities.reduce((sum, activity) => sum + activity.carbonEmission, 0);
    const summary = activities.length
      ? `${user.name} logged ${activities.length} activities this week for ${total.toFixed(2)} kg CO2.`
      : `${user.name} has no tracked activities for this week yet.`;

    await prisma.weeklyReport.upsert({
      where: {
        userId_weekStart: {
          userId: user.id,
          weekStart
        }
      },
      update: {
        totalEmission: total,
        summary
      },
      create: {
        userId: user.id,
        weekStart,
        totalEmission: total,
        summary
      }
    });
  }
}
