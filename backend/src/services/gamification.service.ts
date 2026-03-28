import { prisma } from "../lib/prisma.js";

const BADGES = {
  first_log: {
    name: "First Step",
    description: "Logged your first sustainability activity."
  },
  low_carbon_day: {
    name: "Low Carbon Day",
    description: "Stayed under 5 kg CO2 in a single day."
  },
  activity_starter: {
    name: "Habit Builder",
    description: "Logged five or more sustainability activities."
  }
} as const;

export async function ensureBadgeCatalog() {
  await Promise.all(
    Object.entries(BADGES).map(([key, badge]) =>
      prisma.badge.upsert({
        where: { key },
        update: badge,
        create: { key, ...badge }
      })
    )
  );
}

export async function awardBadgesForUser(userId: string) {
  await ensureBadgeCatalog();

  const [activityCount, todayActivities] = await Promise.all([
    prisma.userActivity.count({ where: { userId } }),
    prisma.userActivity.findMany({
      where: {
        userId,
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      },
      select: { carbonEmission: true }
    })
  ]);

  const earnedKeys = new Set<string>();

  if (activityCount >= 1) earnedKeys.add("first_log");
  if (activityCount >= 5) earnedKeys.add("activity_starter");

  const todayTotal = todayActivities.reduce((sum, item) => sum + item.carbonEmission, 0);
  if (todayActivities.length > 0 && todayTotal <= 5) {
    earnedKeys.add("low_carbon_day");
  }

  for (const key of earnedKeys) {
    const badge = await prisma.badge.findUnique({ where: { key } });
    if (!badge) continue;

    await prisma.userBadge.upsert({
      where: { userId_badgeId: { userId, badgeId: badge.id } },
      update: {},
      create: { userId, badgeId: badge.id }
    });
  }
}

export async function getLeaderboard(limit = 10) {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      activities: {
        select: { carbonEmission: true }
      },
      badges: {
        include: { badge: true }
      }
    }
  });

  return users
    .map((user) => {
      const total = user.activities.reduce((sum, item) => sum + item.carbonEmission, 0);
      const average = user.activities.length ? total / user.activities.length : total;
      return {
        userId: user.id,
        name: user.name,
        averageEmission: Number(average.toFixed(2)),
        badgeCount: user.badges.length
      };
    })
    .sort((a, b) => a.averageEmission - b.averageEmission)
    .slice(0, limit);
}
