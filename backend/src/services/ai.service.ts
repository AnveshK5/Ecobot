import OpenAI from "openai";
import type { Preference, UserActivity } from "@prisma/client";
import { env } from "../config/env.js";

type CacheEntry = {
  expiresAt: number;
  value: string;
};

const openai = env.OPENAI_API_KEY ? new OpenAI({ apiKey: env.OPENAI_API_KEY }) : null;
const cache = new Map<string, CacheEntry>();

function readCache(key: string) {
  const cached = cache.get(key);
  if (!cached) return null;
  if (Date.now() > cached.expiresAt) {
    cache.delete(key);
    return null;
  }
  return cached.value;
}

function writeCache(key: string, value: string) {
  cache.set(key, {
    value,
    expiresAt: Date.now() + env.AI_CACHE_TTL_MS
  });
}

function buildContextSummary(
  activities: Array<UserActivity & { activity: { description: string; type: string } }>,
  preference?: Preference | null
) {
  return {
    recentActivities: activities.slice(0, 8).map((entry) => ({
      type: entry.activity.type,
      description: entry.activity.description,
      carbonEmission: entry.carbonEmission,
      customInput: entry.customInput,
      createdAt: entry.createdAt
    })),
    preferences: preference
      ? {
          dietType: preference.dietType,
          transportMode: preference.transportMode,
          energyUsageType: preference.energyUsageType
        }
      : null
  };
}

function heuristicSuggestions(
  activities: Array<UserActivity & { activity: { description: string; type: string } }>,
  preference?: Preference | null
) {
  const totalByType = activities.reduce<Record<string, number>>((acc, item) => {
    acc[item.activity.type] = (acc[item.activity.type] ?? 0) + item.carbonEmission;
    return acc;
  }, {});

  const suggestions: string[] = [];

  if ((totalByType.transport ?? 0) > 10) {
    suggestions.push("Use public transport, walking, or carpooling for part of your weekly travel to reduce transport emissions.");
  }
  if ((totalByType.food ?? 0) > 8 || preference?.dietType === "omnivore") {
    suggestions.push("Reduce high-emission meals like beef and replace a few with vegetarian or lower-impact protein options.");
  }
  if ((totalByType.energy ?? 0) > 8) {
    suggestions.push("Shift electricity usage away from peak hours, turn off unused devices, and check whether efficient appliances could lower your energy impact.");
  }
  if ((totalByType.shopping ?? 0) > 6) {
    suggestions.push("Bundle purchases, buy fewer high-impact items, and prioritize second-hand or local options when possible.");
  }
  if (suggestions.length === 0) {
    suggestions.push("You are already building good low-carbon habits. Keep tracking consistently and focus on the category with the highest weekly emissions.");
  }

  return suggestions;
}

async function generateText(prompt: string, cacheKey: string) {
  const cached = readCache(cacheKey);
  if (cached) return cached;

  if (!openai) {
    return "";
  }

  const response = await openai.responses.create({
    model: env.OPENAI_MODEL,
    input: prompt
  });

  const text = response.output_text?.trim() ?? "";
  if (text) {
    writeCache(cacheKey, text);
  }
  return text;
}

export async function generateSuggestions(
  activities: Array<UserActivity & { activity: { description: string; type: string } }>,
  preference?: Preference | null
) {
  const context = buildContextSummary(activities, preference);
  const fallback = heuristicSuggestions(activities, preference);

  if (!openai) {
    return {
      suggestions: fallback,
      source: "heuristic" as const
    };
  }

  const prompt = [
    "You are an AI Sustainable Lifestyle Assistant.",
    "Return exactly 3 concise, personalized suggestions as a JSON array of strings.",
    "Focus on practical actions that reduce carbon footprint.",
    `User context: ${JSON.stringify(context)}`
  ].join("\n");

  const text = await generateText(prompt, `suggestions:${JSON.stringify(context)}`);

  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed) && parsed.every((item) => typeof item === "string")) {
      return {
        suggestions: parsed.slice(0, 3),
        source: "openai" as const
      };
    }
  } catch {
    // Fall through to heuristics if the model does not return valid JSON.
  }

  return {
    suggestions: fallback,
    source: "heuristic" as const
  };
}

export async function generateChatResponse(params: {
  message: string;
  activities: Array<UserActivity & { activity: { description: string; type: string } }>;
  preference?: Preference | null;
}) {
  const { message, activities, preference } = params;
  const context = buildContextSummary(activities, preference);

  if (!openai) {
    const suggestions = heuristicSuggestions(activities, preference);
    return `Here is a practical sustainability tip based on your recent habits: ${suggestions[0]} You can also ask me about transport, food, energy use, or shopping choices.`;
  }

  const prompt = [
    "You are a sustainability coach for a carbon footprint tracking app.",
    "Be concise, practical, and personalized.",
    `User context: ${JSON.stringify(context)}`,
    `User question: ${message}`
  ].join("\n");

  const cacheKey = `chat:${JSON.stringify({ message, context })}`;
  const response = await generateText(prompt, cacheKey);

  return response || "I can help with transport, food, energy, shopping, and practical ways to reduce your carbon footprint.";
}
