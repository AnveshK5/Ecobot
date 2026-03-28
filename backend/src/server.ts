import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";
import { createWeeklyReports } from "./services/weekly-report.service.js";

const app = createApp();

const server = app.listen(env.PORT, env.HOST, async () => {
  console.log(`Backend listening on http://${env.HOST}:${env.PORT}`);
  await prisma.$connect();
  await createWeeklyReports();
});

const weeklyInterval = setInterval(() => {
  createWeeklyReports().catch((error) => {
    console.error("Weekly report job failed", error);
  });
}, 1000 * 60 * 60 * 24 * 7);

function shutdown() {
  clearInterval(weeklyInterval);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
