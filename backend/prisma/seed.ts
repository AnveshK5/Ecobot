import "dotenv/config";
import { PrismaClient, ActivityType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const activities = [
  { type: ActivityType.transport, description: "Driving a gasoline car", carbonValue: 0.41 },
  { type: ActivityType.transport, description: "Bus ride", carbonValue: 0.09 },
  { type: ActivityType.transport, description: "Flight travel", carbonValue: 0.25 },
  { type: ActivityType.transport, description: "Walking", carbonValue: 0 },
  { type: ActivityType.transport, description: "Cycling", carbonValue: 0 },
  { type: ActivityType.food, description: "Beef-based meal", carbonValue: 7.5 },
  { type: ActivityType.food, description: "Chicken-based meal", carbonValue: 3.2 },
  { type: ActivityType.food, description: "Vegetarian meal", carbonValue: 1.6 },
  { type: ActivityType.energy, description: "Electricity usage (per kWh)", carbonValue: 0.92 },
  { type: ActivityType.energy, description: "Natural gas usage (per therm)", carbonValue: 5.3 },
  { type: ActivityType.shopping, description: "Online shopping purchase", carbonValue: 4.5 },
  { type: ActivityType.shopping, description: "New clothing purchase", carbonValue: 8.0 }
];

async function main() {
  const passwordHash = await bcrypt.hash("DemoPass123!", 12);

  const demoUser = await prisma.user.upsert({
    where: { email: "demo@ecobot.app" },
    update: {
      name: "Demo User",
      passwordHash,
      isAdmin: false
    },
    create: {
      name: "Demo User",
      email: "demo@ecobot.app",
      passwordHash,
      isAdmin: false
    }
  });

  const rivalUser = await prisma.user.upsert({
    where: { email: "green@ecobot.app" },
    update: {
      name: "Green Commuter",
      passwordHash
    },
    create: {
      name: "Green Commuter",
      email: "green@ecobot.app",
      passwordHash
    }
  });

  await prisma.preference.upsert({
    where: { userId: demoUser.id },
    update: {
      dietType: "flexitarian",
      transportMode: "car + transit",
      energyUsageType: "grid",
      units: "metric"
    },
    create: {
      userId: demoUser.id,
      dietType: "flexitarian",
      transportMode: "car + transit",
      energyUsageType: "grid",
      units: "metric"
    }
  });

  await prisma.preference.upsert({
    where: { userId: rivalUser.id },
    update: {
      dietType: "vegetarian",
      transportMode: "bike",
      energyUsageType: "solar",
      units: "metric"
    },
    create: {
      userId: rivalUser.id,
      dietType: "vegetarian",
      transportMode: "bike",
      energyUsageType: "solar",
      units: "metric"
    }
  });

  await prisma.user.upsert({
    where: { email: "superuser@ai.com" },
    update: {
      name: "Super User",
      passwordHash: await bcrypt.hash("root", 12),
      isAdmin: true
    },
    create: {
      name: "Super User",
      email: "superuser@ai.com",
      passwordHash: await bcrypt.hash("root", 12),
      isAdmin: true,
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

  for (const activity of activities) {
    await prisma.activity.upsert({
      where: {
        description: activity.description
      },
      update: activity,
      create: activity
    });
  }

  const catalog = await prisma.activity.findMany();
  const byDescription = Object.fromEntries(catalog.map((item) => [item.description, item]));

  await prisma.userActivity.deleteMany({
    where: {
      userId: { in: [demoUser.id, rivalUser.id] }
    }
  });

  const demoEntries = [
    ["Driving a gasoline car", 8, { unit: "miles" }, 3.28, -1],
    ["Beef-based meal", 1, { meal: "burger" }, 7.5, -1],
    ["Electricity usage (per kWh)", 6, { unit: "kWh" }, 5.52, -2],
    ["Bus ride", 10, { unit: "miles" }, 0.9, -3],
    ["Vegetarian meal", 2, { meal: "lunch+dinner" }, 3.2, -4],
    ["Online shopping purchase", 1, { items: 1 }, 4.5, -5],
    ["Walking", 4, { unit: "miles" }, 0, -6]
  ] as const;

  const rivalEntries = [
    ["Cycling", 5, { unit: "miles" }, 0, -1],
    ["Vegetarian meal", 2, { meal: "home cooked" }, 3.2, -1],
    ["Electricity usage (per kWh)", 3, { unit: "kWh" }, 2.76, -2]
  ] as const;

  for (const [description, quantity, customInput, carbonEmission, dayOffset] of demoEntries) {
    await prisma.userActivity.create({
      data: {
        userId: demoUser.id,
        activityId: byDescription[description].id,
        customInput: { ...customInput, quantity },
        carbonEmission,
        createdAt: new Date(Date.now() + dayOffset * 24 * 60 * 60 * 1000)
      }
    });
  }

  for (const [description, quantity, customInput, carbonEmission, dayOffset] of rivalEntries) {
    await prisma.userActivity.create({
      data: {
        userId: rivalUser.id,
        activityId: byDescription[description].id,
        customInput: { ...customInput, quantity },
        carbonEmission,
        createdAt: new Date(Date.now() + dayOffset * 24 * 60 * 60 * 1000)
      }
    });
  }

  await prisma.chatLog.deleteMany({
    where: {
      userId: demoUser.id
    }
  });

  await prisma.chatLog.createMany({
    data: [
      {
        userId: demoUser.id,
        message: "How can I reduce emissions from commuting?",
        response: "Try replacing one or two car trips each week with public transport, biking, or carpooling."
      },
      {
        userId: demoUser.id,
        message: "What food choice would help most?",
        response: "Swapping beef meals for vegetarian or chicken options usually cuts food emissions the fastest."
      }
    ]
  });

  console.log("Seeded demo data for AI Sustainable Lifestyle Assistant");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
