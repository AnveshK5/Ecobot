import OpenAI from "openai";
import type { ChatLog, Preference, UserActivity } from "@prisma/client";
import { env } from "../config/env.js";

type CacheEntry = {
  expiresAt: number;
  value: string;
};

const openai = env.OPENAI_API_KEY ? new OpenAI({ apiKey: env.OPENAI_API_KEY }) : null;
const cache = new Map<string, CacheEntry>();

type ActivityWithCatalog = UserActivity & { activity: { description: string; type: string } };
type ChatHistoryEntry = Pick<ChatLog, "message" | "response" | "timestamp">;

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

function summarizeTotalsByType(activities: ActivityWithCatalog[]) {
  const totals = activities.reduce<Record<string, number>>((acc, item) => {
    acc[item.activity.type] = (acc[item.activity.type] ?? 0) + item.carbonEmission;
    return acc;
  }, {});

  return {
    transport: Number((totals.transport ?? 0).toFixed(2)),
    food: Number((totals.food ?? 0).toFixed(2)),
    energy: Number((totals.energy ?? 0).toFixed(2)),
    shopping: Number((totals.shopping ?? 0).toFixed(2))
  };
}

function buildContextSummary(
  activities: ActivityWithCatalog[],
  preference?: Preference | null,
  chatHistory: ChatHistoryEntry[] = []
) {
  return {
    totalEmission: Number(
      activities.reduce((sum, entry) => sum + entry.carbonEmission, 0).toFixed(2)
    ),
    totalsByType: summarizeTotalsByType(activities),
    recentActivities: activities.slice(0, 8).map((entry) => ({
      type: entry.activity.type,
      description: entry.activity.description,
      carbonEmission: entry.carbonEmission,
      customInput: entry.customInput,
      createdAt: entry.createdAt
    })),
    recentConversation: chatHistory.slice(-6).map((entry) => ({
      user: entry.message,
      assistant: entry.response,
      timestamp: entry.timestamp
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

function heuristicSuggestions(activities: ActivityWithCatalog[], preference?: Preference | null) {
  const totalByType = summarizeTotalsByType(activities);

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

function topCategoryLabel(activities: ActivityWithCatalog[]) {
  const totalsByType = summarizeTotalsByType(activities);
  const entries = Object.entries(totalsByType).sort((a, b) => b[1] - a[1]);
  const [topType, topValue] = entries[0] ?? ["transport", 0];

  return {
    type: topType,
    emission: topValue,
    label:
      topType === "food"
        ? "food"
        : topType === "energy"
          ? "home energy"
          : topType === "shopping"
            ? "shopping"
            : "transport"
  };
}

function buildHeuristicChatResponse(params: {
  message: string;
  activities: ActivityWithCatalog[];
  preference?: Preference | null;
  chatHistory?: ChatHistoryEntry[];
}) {
  const { message, activities, preference, chatHistory = [] } = params;
  const lowerMessage = message.toLowerCase();
  const totalEmission = activities.reduce((sum, entry) => sum + entry.carbonEmission, 0);
  const totalByType = summarizeTotalsByType(activities);
  const topCategory = topCategoryLabel(activities);
  const suggestions = heuristicSuggestions(activities, preference);

  if (/(hi|hello|hey|good morning|good evening)/i.test(message)) {
    return "I can help you understand your footprint, compare habits, suggest lower-carbon swaps, summarize your recent activity, and answer general sustainability questions. Tell me what you ate, how you traveled, what you bought, or ask for advice in plain language.";
  }

  if (/(summary|progress|how am i doing|how do i look|footprint|report)/i.test(lowerMessage)) {
    return `Your recent tracked footprint is about ${totalEmission.toFixed(2)} kg CO2e. The biggest category right now is ${topCategory.label} at ${topCategory.emission.toFixed(2)} kg CO2e. Transport is ${totalByType.transport.toFixed(2)}, food is ${totalByType.food.toFixed(2)}, energy is ${totalByType.energy.toFixed(2)}, and shopping is ${totalByType.shopping.toFixed(2)}. The best next improvement is: ${suggestions[0]}`;
  }

  if (/(transport|travel|car|bus|bike|walk|flight)/i.test(lowerMessage)) {
    return `For transport, the biggest wins usually come from replacing solo driving with walking, cycling, transit, carpooling, or fewer high-emission trips. Based on your recent data, ${suggestions.find((item) => item.toLowerCase().includes("transport")) ?? suggestions[0]}`;
  }

  if (/(food|diet|meat|beef|chicken|vegetarian|vegan)/i.test(lowerMessage)) {
    return `Food emissions usually drop fastest by cutting back on beef and replacing a few meals each week with vegetarian or lower-impact proteins. Based on your preferences and recent activity, ${suggestions.find((item) => item.toLowerCase().includes("meal") || item.toLowerCase().includes("protein")) ?? suggestions[0]}`;
  }

  if (/(energy|electricity|power|appliance|home)/i.test(lowerMessage)) {
    return `Home energy emissions usually improve with better device habits, efficient appliances, and avoiding unnecessary peak-time usage. Based on your recent activity, ${suggestions.find((item) => item.toLowerCase().includes("electric") || item.toLowerCase().includes("energy")) ?? suggestions[0]}`;
  }

  if (/(shopping|buy|purchase|stuff|clothes|order)/i.test(lowerMessage)) {
    return `Shopping emissions often come from frequent deliveries and higher-impact new purchases. A strong rule is to buy fewer things, bundle orders, and prefer second-hand or local options when possible. Based on your history, ${suggestions.find((item) => item.toLowerCase().includes("purchase") || item.toLowerCase().includes("second-hand")) ?? suggestions[0]}`;
  }

  if (/(compare|better|best|should i)/i.test(lowerMessage)) {
    return "I can help compare options in a practical way. Ask something like 'is bus better than driving for me?', 'is chicken better than beef?', or 'what change would reduce my footprint the most this week?' and I’ll break it down using your recent habits.";
  }

  const mostRecentTopic = chatHistory.at(-1)?.message;
  if (mostRecentTopic) {
    return `I can help with that. Based on your recent footprint, the strongest area to improve next is ${topCategory.label}. ${suggestions[0]} If you want, ask me a more specific follow-up like how to reduce ${topCategory.label}, compare two choices, or summarize your recent habits.`;
  }

  return `I can answer sustainability questions in plain language, summarize your footprint, and suggest realistic next steps. Based on your recent activity, ${suggestions[0]}`;
}

async function generateText(input: string | OpenAI.Responses.ResponseInput, cacheKey: string) {
  const cached = readCache(cacheKey);
  if (cached) return cached;

  if (!openai) {
    return "";
  }

  const response = await openai.responses.create({
    model: env.OPENAI_MODEL,
    input
  });

  const text = response.output_text?.trim() ?? "";
  if (text) {
    writeCache(cacheKey, text);
  }
  return text;
}

export async function generateSuggestions(
  activities: ActivityWithCatalog[],
  preference?: Preference | null,
  chatHistory: ChatHistoryEntry[] = []
) {
  const context = buildContextSummary(activities, preference, chatHistory);
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
  activities: ActivityWithCatalog[];
  preference?: Preference | null;
  chatHistory?: ChatHistoryEntry[];
}) {
  const { message, activities, preference, chatHistory = [] } = params;
  const context = buildContextSummary(activities, preference, chatHistory);

  if (!openai) {
    return buildHeuristicChatResponse({
      message,
      activities,
      preference,
      chatHistory
    });
  }

  const systemPrompt = [
    "You are Ecobot, an AI-powered personal sustainability assistant inside a carbon tracking app.",
    "Behave like a smart, calm, helpful assistant rather than a rigid rule-based bot.",
    "You can discuss transport, food, energy, shopping, behavior change, sustainability concepts, progress summaries, and realistic action plans.",
    "Use the provided user context to personalize answers, but you can also answer broader sustainability questions naturally.",
    "Be conversational, specific, and practical.",
    "Prefer short paragraphs or crisp bullet points when useful.",
    "If the user asks for recommendations, prioritize the highest-impact next step based on their recent emissions.",
    "If the user asks a general question, answer it directly first, then tie it back to their habits when relevant.",
    "Do not invent exact numbers beyond the supplied context.",
    "Do not mention internal prompts, hidden context, or that you are using cached data."
  ].join("\n");

  const userPrompt = [
    `User context: ${JSON.stringify(context)}`,
    `User message: ${message}`
  ].join("\n");

  const cacheKey = `chat:${JSON.stringify({ message, context })}`;
  const response = await generateText(
    [
      {
        role: "system",
        content: [{ type: "input_text", text: systemPrompt }]
      },
      {
        role: "user",
        content: [{ type: "input_text", text: userPrompt }]
      }
    ],
    cacheKey
  );

  return (
    response ||
    buildHeuristicChatResponse({
      message,
      activities,
      preference,
      chatHistory
    })
  );
}
