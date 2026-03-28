import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-4.1-mini"),
  FRONTEND_URL: z.string().default("http://localhost:8080"),
  DEMO_USER_EMAIL: z.string().email().default("demo@ecobot.app"),
  DEMO_USER_PASSWORD: z.string().min(8).default("DemoPass123!"),
  AI_CACHE_TTL_MS: z.coerce.number().default(1000 * 60 * 60 * 6)
});

export const env = envSchema.parse(process.env);
