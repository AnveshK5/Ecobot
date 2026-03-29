import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode
} from "react";
import { apiRequest } from "@/lib/api";
import { formatCarbon, formatDistance } from "@/lib/units";

type ActivityType = "transport" | "food" | "energy" | "shopping";
type UnitPreference = "metric" | "imperial";
type UserRole = "USER" | "SUPERUSER";
type BootstrapPayload = {
  activities: BackendActivity[];
  profile: BackendProfile;
  history: BackendUserActivity[];
  carbon: DashboardSummary;
  chats: BackendChat[];
  suggestions: string[];
  leaderboard: Array<{ userId: string; name: string; averageEmission: number; badgeCount: number }>;
};
type UiSettings = {
  lowBandwidthMode: boolean;
};
type BillingSnapshot = {
  hasSubscription: boolean;
  isTrialActive: boolean;
  trialStartsAt: string;
  trialEndsAt: string;
  subscription: {
    planMonths: number;
    priceUsd: number;
    status: "TRIAL" | "ACTIVE" | "EXPIRED" | "CANCELED";
    currentPeriodStart: string;
    currentPeriodEnd: string;
  } | null;
};
type ExtractedActivityEntry = {
  activity: Activity;
  quantity: number;
  notes: string;
};

export interface User {
  user_id: string;
  username: string;
  email: string;
  role: UserRole;
  is_admin: boolean;
  daily_goal_kgCO2: number;
  created_at: string;
}

export interface Activity {
  activity_id: string;
  name: string;
  category: string;
  unit: string;
  emission_factor: number;
}

export interface UserActivity {
  log_id: string;
  user_id: string;
  activity_id: string;
  quantity: number;
  timestamp: string;
  co2_emission: number;
  notes: string;
}

export interface ChatMessage {
  chat_id: string;
  user_id: string;
  message: string;
  sender: "user" | "AI";
  timestamp: string;
}

export interface Task {
  task_id: string;
  user_id: string;
  title: string;
  time: string;
  completed: boolean;
  created_at: string;
}

export interface Preferences {
  preference_id: string;
  user_id: string;
  diet_type: string;
  transport_mode: string;
  energy_usage_type: string;
  receive_tips: boolean;
  notification_time: string;
  units: UnitPreference;
}

type DashboardSummary = {
  daily: number;
  weekly: number;
  monthly: number;
  timeline: Array<{ date: string; carbonEmission: number }>;
};

type AdminUserSummary = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isAdmin: boolean;
  createdAt: string;
  preferences: {
    units?: UnitPreference | null;
    dietType?: string | null;
    transportMode?: string | null;
    energyUsageType?: string | null;
  } | null;
  counts: {
    activities: number;
    chatLogs: number;
    badges: number;
  };
};

type AdminUserDetails = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isAdmin: boolean;
  createdAt: string;
  preferences: {
    units?: UnitPreference | null;
    dietType?: string | null;
    transportMode?: string | null;
    energyUsageType?: string | null;
  } | null;
  activities: Array<{
    id: string;
    carbonEmission: number;
    createdAt: string;
    customInput: Record<string, unknown>;
    activity: {
      description: string;
      type: ActivityType;
      carbonValue: number;
    };
  }>;
  chatLogs: Array<{
    id: string;
    message: string;
    response: string;
    timestamp: string;
  }>;
  badges: Array<{
    awardedAt: string;
    badge: {
      id: string;
      key: string;
      name: string;
      description: string;
    };
  }>;
  weeklyReports: Array<{
    id: string;
    weekStart: string;
    totalEmission: number;
    summary: string;
  }>;
};

interface AppDataContextType {
  isAuthenticated: boolean;
  currentUser: User | null;
  activities: Activity[];
  userActivities: UserActivity[];
  chatLog: ChatMessage[];
  tasks: Task[];
  preferences: Preferences | null;
  billing: BillingSnapshot | null;
  loading: boolean;
  authLoading: boolean;
  authError: string | null;
  upgradePromptOpen: boolean;
  lowBandwidthMode: boolean;
  setLowBandwidthMode: (enabled: boolean) => void;
  dismissUpgradePrompt: () => void;
  isOffline: boolean;
  unitPreference: UnitPreference;
  adminUsers: AdminUserSummary[];
  adminUserDetails: AdminUserDetails | null;
  adminLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: { name: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  loadAdminUsers: () => Promise<void>;
  loadAdminUserDetails: (userId: string) => Promise<void>;
  addUserActivity: (activityId: string, quantity: number, notes: string) => Promise<void>;
  addChatMessage: (message: string, sender: "user" | "AI") => void;
  sendChatMessage: (message: string) => Promise<void>;
  updatePreferences: (updates: Partial<Preferences>) => Promise<void>;
  subscribeToPlan: (planMonths: 1 | 3 | 6 | 12) => Promise<void>;
  addTask: (title: string, time: string) => void;
  toggleTask: (taskId: string) => void;
  deleteTask: (taskId: string) => void;
  totalCO2Today: number;
  totalCO2All: number;
  weeklyData: { day: string; co2: number }[];
  ecoScore: number;
  streak: number;
  motivationalMessage: string;
  aiSuggestions: string[];
  leaderboard: Array<{ userId: string; name: string; averageEmission: number; badgeCount: number }>;
}

type BackendActivity = {
  id: string;
  type: ActivityType;
  description: string;
  carbonValue: number;
};

type BackendUserActivity = {
  id: string;
  userId: string;
  activityId: string;
  customInput: Record<string, unknown>;
  carbonEmission: number;
  createdAt: string;
  activity: BackendActivity;
};

type BackendChat = {
  id: string;
  userId: string;
  message: string;
  response: string;
  timestamp: string;
};

type BackendPreferences = {
  id: string;
  userId: string;
  dietType?: string | null;
  transportMode?: string | null;
  energyUsageType?: string | null;
  units?: UnitPreference | null;
};

type BackendProfile = {
  user: {
    id: string;
    name: string;
    email: string;
    createdAt: string;
    role: UserRole;
    isAdmin: boolean;
  };
  preferences: BackendPreferences | null;
  billing: BillingSnapshot;
  badges: Array<{
    id: string;
    key: string;
    name: string;
    description: string;
    awardedAt: string;
  }>;
};

const AppDataContext = createContext<AppDataContextType | null>(null);
const TASKS_KEY_PREFIX = "ecobot-tasks";
const CACHE_KEY_PREFIX = "ecobot-cache";
const UI_SETTINGS_KEY = "ecobot-ui-settings";

const quickTaskSeed: Task[] = [
  {
    task_id: "local-task-1",
    user_id: "demo",
    title: "Study for exam",
    time: new Date(new Date().setHours(18, 0, 0, 0)).toISOString(),
    completed: false,
    created_at: new Date().toISOString()
  },
  {
    task_id: "local-task-2",
    user_id: "demo",
    title: "Buy groceries",
    time: new Date(new Date().setHours(10, 0, 0, 0)).toISOString(),
    completed: false,
    created_at: new Date().toISOString()
  }
];

const categoryMap: Record<ActivityType, string> = {
  transport: "Travel",
  food: "Food",
  energy: "Energy",
  shopping: "Shopping"
};

const defaultUnits: Record<ActivityType, string> = {
  transport: "mile",
  food: "meal",
  energy: "kWh",
  shopping: "item"
};

const activityKeywords = [
  { match: /drive|drove|driving/i, type: "transport" as const, includes: "Driving" },
  { match: /bus/i, type: "transport" as const, includes: "Bus" },
  { match: /flight|fly|flew/i, type: "transport" as const, includes: "Flight" },
  { match: /walk|walked/i, type: "transport" as const, includes: "Walking" },
  { match: /bike|biked|cycled/i, type: "transport" as const, includes: "Cycling" },
  { match: /beef/i, type: "food" as const, includes: "Beef" },
  { match: /chicken/i, type: "food" as const, includes: "Chicken" },
  { match: /vegetarian|veggie/i, type: "food" as const, includes: "Vegetarian" },
  { match: /electricity|kwh/i, type: "energy" as const, includes: "Electricity" },
  { match: /gas|therm/i, type: "energy" as const, includes: "Natural gas" },
  { match: /shopping|ordered|purchase/i, type: "shopping" as const, includes: "shopping" }
];

const reminderPattern = /remind\s*(me)?\s*(to)?\s+(.+?)(?:\s+at\s+(.+))?$/i;

function getTasksStorageKey(userId: string) {
  return `${TASKS_KEY_PREFIX}:${userId}`;
}

function getCacheStorageKey(userId: string) {
  return `${CACHE_KEY_PREFIX}:${userId}`;
}

function loadUiSettings(): UiSettings {
  const raw = localStorage.getItem(UI_SETTINGS_KEY);
  if (!raw) {
    return { lowBandwidthMode: false };
  }

  try {
    return JSON.parse(raw) as UiSettings;
  } catch {
    return { lowBandwidthMode: false };
  }
}

function saveUiSettings(settings: UiSettings) {
  localStorage.setItem(UI_SETTINGS_KEY, JSON.stringify(settings));
}

function loadTasks(userId?: string | null) {
  if (!userId) return [];

  const raw = localStorage.getItem(getTasksStorageKey(userId));
  if (!raw) {
    return userId === "demo" ? quickTaskSeed : [];
  }

  try {
    return JSON.parse(raw) as Task[];
  } catch {
    return userId === "demo" ? quickTaskSeed : [];
  }
}

function saveTasks(userId: string | undefined, tasks: Task[]) {
  if (!userId) return;
  localStorage.setItem(getTasksStorageKey(userId), JSON.stringify(tasks));
}

function pruneTasks(tasks: Task[]) {
  const now = Date.now();

  return tasks.filter((task) => {
    const taskTime = new Date(task.time).getTime();
    const createdAt = new Date(task.created_at).getTime();

    if (task.completed && now - createdAt > 1000 * 60 * 60 * 24 * 7) {
      return false;
    }

    if (!task.completed && now - taskTime > 1000 * 60 * 60 * 24 * 14) {
      return false;
    }

    return true;
  });
}

function formatUnit(description: string, type: ActivityType) {
  const lower = description.toLowerCase();
  if (lower.includes("kwh")) return "kWh";
  if (lower.includes("therm")) return "therm";
  if (lower.includes("meal")) return "meal";
  if (
    lower.includes("ride") ||
    lower.includes("driving") ||
    lower.includes("walking") ||
    lower.includes("cycling") ||
    lower.includes("flight")
  ) {
    return "mile";
  }
  return defaultUnits[type];
}

function mapActivity(activity: BackendActivity): Activity {
  return {
    activity_id: activity.id,
    name: activity.description,
    category: categoryMap[activity.type],
    unit: formatUnit(activity.description, activity.type),
    emission_factor: activity.carbonValue
  };
}

function mapUserActivity(entry: BackendUserActivity): UserActivity {
  const quantity =
    typeof entry.customInput.quantity === "number"
      ? entry.customInput.quantity
      : entry.activity.carbonValue > 0
        ? Number((entry.carbonEmission / entry.activity.carbonValue).toFixed(2))
        : 1;

  return {
    log_id: entry.id,
    user_id: entry.userId,
    activity_id: entry.activityId,
    quantity,
    timestamp: entry.createdAt,
    co2_emission: entry.carbonEmission,
    notes: String(entry.customInput.description ?? entry.activity.description)
  };
}

function mapChats(chats: BackendChat[]): ChatMessage[] {
  return chats.flatMap((chat) => [
    {
      chat_id: `${chat.id}-user`,
      user_id: chat.userId,
      message: chat.message,
      sender: "user",
      timestamp: chat.timestamp
    },
    {
      chat_id: `${chat.id}-ai`,
      user_id: chat.userId,
      message: chat.response,
      sender: "AI",
      timestamp: chat.timestamp
    }
  ]);
}

function mapPreferences(preferences: BackendPreferences | null, userId: string): Preferences {
  return {
    preference_id: preferences?.id ?? "local-pref",
    user_id: userId,
    diet_type: preferences?.dietType ?? "balanced",
    transport_mode: preferences?.transportMode ?? "mixed",
    energy_usage_type: preferences?.energyUsageType ?? "grid",
    receive_tips: true,
    notification_time: "09:00",
    units: preferences?.units ?? "metric"
  };
}

function inferActivity(message: string, activities: Activity[]) {
  const quantityMatch = message.match(/(\d+(\.\d+)?)/);
  const quantity = quantityMatch ? Number(quantityMatch[1]) : 1;

  for (const keyword of activityKeywords) {
    if (!keyword.match.test(message)) continue;

    const match = activities.find(
      (activity) =>
        activity.category === categoryMap[keyword.type] &&
        activity.name.toLowerCase().includes(keyword.includes.toLowerCase())
    );

    if (match) {
      return { activity: match, quantity };
    }
  }

  return null;
}

function splitNarrative(message: string) {
  return message
    .split(/[\n.!?]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function findCatalogActivity(
  activities: Activity[],
  type: ActivityType,
  includes: string[]
) {
  return activities.find(
    (activity) =>
      activity.category === categoryMap[type] &&
      includes.some((token) => activity.name.toLowerCase().includes(token.toLowerCase()))
  );
}

function parseDistanceInMiles(text: string) {
  const matches = [...text.matchAll(/(\d+(?:\.\d+)?)\s*(km|kilometers?|mi|mile|miles)\b/gi)];
  if (!matches.length) return 0;

  return matches.reduce((sum, match) => {
    const value = Number(match[1]);
    const unit = match[2].toLowerCase();
    return sum + (unit.startsWith("k") ? value / 1.60934 : value);
  }, 0);
}

function parseHours(text: string) {
  const match = text.match(/(\d+(?:\.\d+)?)\s*(hours?|hrs?)/i);
  return match ? Number(match[1]) : 0;
}

function parseMinutes(text: string) {
  const match = text.match(/(\d+(?:\.\d+)?)\s*(minutes?|mins?)/i);
  return match ? Number(match[1]) : 0;
}

function inferActivitiesBatch(message: string, activities: Activity[]) {
  const sentences = splitNarrative(message);
  const extracted: ExtractedActivityEntry[] = [];

  const drivingActivity = findCatalogActivity(activities, "transport", ["driving"]);
  const cyclingActivity = findCatalogActivity(activities, "transport", ["cycling"]);
  const electricityActivity = findCatalogActivity(activities, "energy", ["electricity"]);
  const naturalGasActivity = findCatalogActivity(activities, "energy", ["natural gas"]);
  const vegetarianMealActivity = findCatalogActivity(activities, "food", ["vegetarian"]);
  const chickenMealActivity = findCatalogActivity(activities, "food", ["chicken"]);
  const shoppingActivity = findCatalogActivity(activities, "shopping", ["online shopping"]);

  for (const sentence of sentences) {
    const lower = sentence.toLowerCase();

    if (drivingActivity && /(drive|drove|driving|petrol car|gasoline car|car)/i.test(sentence)) {
      const distance = parseDistanceInMiles(sentence);
      if (distance > 0) {
        extracted.push({
          activity: drivingActivity,
          quantity: Number(distance.toFixed(2)),
          notes: sentence
        });
      }
    }

    if (cyclingActivity && /\bbike|biked|cycling|cycled\b/i.test(sentence) && !/motorbike/i.test(sentence)) {
      const distance = parseDistanceInMiles(sentence);
      extracted.push({
        activity: cyclingActivity,
        quantity: Number((distance || 1).toFixed(2)),
        notes: sentence
      });
    }

    if (naturalGasActivity && /hot water|shower/i.test(sentence)) {
      const minutes = parseMinutes(sentence);
      if (minutes > 0) {
        extracted.push({
          activity: naturalGasActivity,
          quantity: Number((minutes * 0.012).toFixed(2)),
          notes: `${sentence} (estimated hot water usage)`
        });
      }
    }

    if (electricityActivity) {
      const hours = parseHours(sentence);
      let estimatedKwh = 0;

      if (hours > 0) {
        if (/light|lights/i.test(sentence)) estimatedKwh += 0.12 * hours;
        if (/fan/i.test(sentence)) estimatedKwh += 0.075 * hours;
        if (/\bac\b|air conditioner/i.test(sentence)) estimatedKwh += 1.5 * hours;
        if (/laptop/i.test(sentence)) estimatedKwh += 0.06 * hours;
        if (/phone/i.test(sentence)) estimatedKwh += 0.015 * hours;
      }

      if (estimatedKwh > 0) {
        extracted.push({
          activity: electricityActivity,
          quantity: Number(estimatedKwh.toFixed(2)),
          notes: `${sentence} (estimated electricity usage)`
        });
      }
    }

    if (vegetarianMealActivity && /(breakfast|eggs|toast|coffee)/i.test(sentence) && !/(chicken|beef|non-veg)/i.test(sentence)) {
      extracted.push({
        activity: vegetarianMealActivity,
        quantity: 1,
        notes: sentence
      });
    }

    if (chickenMealActivity && /(chicken|biryani|non-veg|non veg)/i.test(sentence)) {
      extracted.push({
        activity: chickenMealActivity,
        quantity: 1,
        notes: sentence
      });
    }

    if (shoppingActivity && /(ordered online|online|plastic packaging|plastic bottle)/i.test(sentence)) {
      extracted.push({
        activity: shoppingActivity,
        quantity: 1,
        notes: sentence
      });
    }
  }

  return extracted;
}

function summarizeBatchEntries(entries: ExtractedActivityEntry[]) {
  const counts = entries.reduce<Record<string, number>>((acc, entry) => {
    acc[entry.activity.name] = (acc[entry.activity.name] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .map(([name, count]) => `${name}${count > 1 ? ` x${count}` : ""}`)
    .join(", ");
}

function getTimeframeStart(message: string) {
  const lower = message.toLowerCase();
  const now = new Date();

  if (/\btoday\b|\bdaily\b/.test(lower)) {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  if (/\bthis week\b|\bweekly\b/.test(lower)) {
    const day = now.getDay();
    const diff = day === 0 ? 6 : day - 1;
    const start = new Date(now);
    start.setDate(now.getDate() - diff);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  if (/\bthis month\b|\bmonthly\b/.test(lower)) {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  if (/\bthis year\b|\byearly\b|\bannual\b/.test(lower)) {
    return new Date(now.getFullYear(), 0, 1);
  }

  return null;
}

function getCategoryFromMessage(message: string) {
  const lower = message.toLowerCase();

  if (/(travel|transport|car|bus|bike|walk|flight|distance)/.test(lower)) return "Travel";
  if (/(food|diet|meal|beef|chicken|vegetarian|non-veg|non veg)/.test(lower)) return "Food";
  if (/(energy|electricity|power|ac|fan|laptop|phone|lights)/.test(lower)) return "Energy";
  if (/(shopping|purchase|order|plastic|packaging|bottle)/.test(lower)) return "Shopping";

  return null;
}

function buildStatsAwareResponse(params: {
  message: string;
  userActivities: UserActivity[];
  activities: Activity[];
  ecoScore: number;
  totalCO2Today: number;
  totalCO2All: number;
  unitPreference: UnitPreference;
}) {
  const { message, userActivities, activities, ecoScore, totalCO2Today, totalCO2All, unitPreference } = params;
  const lower = message.toLowerCase();

  const isStatsQuestion = /(score|distance|travel|footprint|carbon|co2|emission|summary|report|how much|how many|overall|total)/.test(lower);
  if (!isStatsQuestion) {
    return null;
  }

  const timeframeStart = getTimeframeStart(message);
  const scopedActivities = timeframeStart
    ? userActivities.filter((entry) => new Date(entry.timestamp) >= timeframeStart)
    : userActivities;
  const category = getCategoryFromMessage(message);
  const activitiesById = new Map(activities.map((activity) => [activity.activity_id, activity]));
  const filteredActivities = category
    ? scopedActivities.filter((entry) => activitiesById.get(entry.activity_id)?.category === category)
    : scopedActivities;

  const emissionTotal = filteredActivities.reduce((sum, entry) => sum + entry.co2_emission, 0);
  const travelDistanceMiles = filteredActivities
    .filter((entry) => activitiesById.get(entry.activity_id)?.category === "Travel")
    .reduce((sum, entry) => sum + entry.quantity, 0);
  const entryCount = filteredActivities.length;
  const scopeLabel = timeframeStart
    ? /\btoday\b|\bdaily\b/.test(lower)
      ? "today"
      : /\bthis week\b|\bweekly\b/.test(lower)
        ? "this week"
        : /\bthis month\b|\bmonthly\b/.test(lower)
          ? "this month"
          : "this year"
    : "overall";

  if (/(eco score|carbon score|overall score|my score)/.test(lower)) {
    return `Your current eco score is ${ecoScore}/100. ${ecoScore >= 85 ? "You are in a strong low-carbon zone." : ecoScore >= 65 ? "You are doing fairly well, with room to improve your biggest category." : "Your biggest opportunity is to reduce the highest-emission category in your recent activity."}`;
  }

  if (/(distance|travel|how far)/.test(lower)) {
    return `You have traveled ${formatDistance(travelDistanceMiles, unitPreference)} ${scopeLabel === "overall" ? "in total across your logged history" : scopeLabel}. ${travelDistanceMiles > 0 ? `The related footprint for those travel entries is ${formatCarbon(filteredActivities.filter((entry) => activitiesById.get(entry.activity_id)?.category === "Travel").reduce((sum, entry) => sum + entry.co2_emission, 0), unitPreference)}.` : "I do not see any travel logs in that time window yet."}`;
  }

  if (category) {
    return `${category} emissions ${scopeLabel === "overall" ? "across your full history" : scopeLabel} are ${formatCarbon(emissionTotal, unitPreference)} from ${entryCount} logged activit${entryCount === 1 ? "y" : "ies"}.`;
  }

  if (/\btoday\b/.test(lower)) {
    return `Today you have logged ${formatCarbon(totalCO2Today, unitPreference)} across ${filteredActivities.length} activit${filteredActivities.length === 1 ? "y" : "ies"}. Your travel distance today is ${formatDistance(travelDistanceMiles, unitPreference)}.`;
  }

  if (/\boverall\b|\btotal\b/.test(lower) || /(footprint|carbon|co2|emission)/.test(lower)) {
    return `Your ${scopeLabel === "overall" ? "overall" : scopeLabel} footprint is ${formatCarbon(scopeLabel === "overall" ? totalCO2All : emissionTotal, unitPreference)} from ${filteredActivities.length} logged activit${filteredActivities.length === 1 ? "y" : "ies"}.`;
  }

  return null;
}

function buildImprovementSuggestions(entries: ExtractedActivityEntry[]) {
  const suggestions: string[] = [];

  const hasDriving = entries.some((entry) => entry.activity.name.toLowerCase().includes("driving"));
  const hasChicken = entries.some((entry) => entry.activity.name.toLowerCase().includes("chicken"));
  const hasShopping = entries.some((entry) => entry.activity.category === "Shopping");
  const electricityEntry = entries.find((entry) => entry.activity.name.toLowerCase().includes("electricity"));
  const hotWaterEntry = entries.find((entry) => entry.activity.name.toLowerCase().includes("natural gas"));

  if (hasDriving) {
    suggestions.push("Swap one car trip for bus, cycling, or walking to cut your transport emissions first.");
  }

  if (electricityEntry) {
    suggestions.push("Reduce AC runtime or raise the temperature setting slightly to bring down your daily electricity footprint.");
  }

  if (hotWaterEntry) {
    suggestions.push("Shorter hot showers can lower both water-heating energy use and total daily emissions.");
  }

  if (hasChicken) {
    suggestions.push("Replacing one non-veg meal with a vegetarian option is an easy way to lower food emissions.");
  }

  if (hasShopping) {
    suggestions.push("Try reusable containers or fewer packaged orders to reduce shopping and delivery-related impact.");
  }

  if (!suggestions.length) {
    suggestions.push("Keep logging consistently so Ecobot can spot the highest-impact habit to improve next.");
  }

  return suggestions.slice(0, 3);
}

function dayLabel(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", { weekday: "short" });
}

function mapCurrentUser(profile: BackendProfile): User {
  return {
    user_id: profile.user.id,
    username: profile.user.name,
    email: profile.user.email,
    role: profile.user.role,
    is_admin: profile.user.isAdmin,
    daily_goal_kgCO2: 10,
    created_at: profile.user.createdAt
  };
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
  const [chatLog, setChatLog] = useState<ChatMessage[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [billing, setBilling] = useState<BillingSnapshot | null>(null);
  const [summary, setSummary] = useState<DashboardSummary>({
    daily: 0,
    weekly: 0,
    monthly: 0,
    timeline: []
  });
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [leaderboard, setLeaderboard] = useState<Array<{ userId: string; name: string; averageEmission: number; badgeCount: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [upgradePromptOpen, setUpgradePromptOpen] = useState(false);
  const [lowBandwidthMode, setLowBandwidthModeState] = useState<boolean>(() => loadUiSettings().lowBandwidthMode);
  const [isOffline, setIsOffline] = useState<boolean>(() => !navigator.onLine);
  const [adminUsers, setAdminUsers] = useState<AdminUserSummary[]>([]);
  const [adminUserDetails, setAdminUserDetails] = useState<AdminUserDetails | null>(null);
  const [adminLoading, setAdminLoading] = useState(false);

  const hydrateState = useCallback((payload: BootstrapPayload) => {
    setActivities(payload.activities.map(mapActivity));
    setCurrentUser(mapCurrentUser(payload.profile));
    setPreferences(mapPreferences(payload.profile.preferences, payload.profile.user.id));
    setBilling(payload.profile.billing);
    setUserActivities(payload.history.map(mapUserActivity));
    setSummary(payload.carbon);
    setChatLog(mapChats(payload.chats));
    setAiSuggestions(payload.suggestions);
    setLeaderboard(payload.leaderboard);
    setAuthError(null);
  }, []);

  const resetAppState = useCallback(() => {
    setCurrentUser(null);
    setActivities([]);
    setUserActivities([]);
    setChatLog([]);
    setPreferences(null);
    setBilling(null);
    setSummary({
      daily: 0,
      weekly: 0,
      monthly: 0,
      timeline: []
    });
    setAiSuggestions([]);
    setLeaderboard([]);
    setAdminUsers([]);
    setAdminUserDetails(null);
    setTasks([]);
    setUpgradePromptOpen(false);
  }, []);

  const bootstrap = useCallback(async () => {
    setLoading(true);
    try {
      const [catalog, profile, history, carbon, chats, suggestions, board] = await Promise.all([
        apiRequest<{ activities: BackendActivity[] }>("/activity/catalog"),
        apiRequest<BackendProfile>("/user/profile"),
        apiRequest<{ history: BackendUserActivity[] }>("/activity/history"),
        apiRequest<DashboardSummary>("/carbon/summary"),
        apiRequest<{ chats: BackendChat[] }>("/ai/history"),
        lowBandwidthMode
          ? Promise.resolve<{ suggestions: string[] }>({
              suggestions: [
                "Low-bandwidth mode is on. Open AI Chat only when you want a focused suggestion."
              ]
            })
          : apiRequest<{ suggestions: string[] }>("/ai/suggestions", { method: "POST", body: {} }),
        apiRequest<{ leaderboard: Array<{ userId: string; name: string; averageEmission: number; badgeCount: number }> }>("/carbon/leaderboard")
      ]);

      const payload: BootstrapPayload = {
        activities: catalog.activities,
        profile,
        history: history.history,
        carbon,
        chats: chats.chats,
        suggestions: suggestions.suggestions,
        leaderboard: board.leaderboard
      };

      hydrateState(payload);
      localStorage.setItem(getCacheStorageKey(profile.user.id), JSON.stringify(payload));
    } catch {
      const cachedUserId = currentUser?.user_id;
      const rawCache = cachedUserId ? localStorage.getItem(getCacheStorageKey(cachedUserId)) : null;

      if (rawCache) {
        try {
          hydrateState(JSON.parse(rawCache) as BootstrapPayload);
          setAuthError("Using locally cached data.");
          return;
        } catch {
          resetAppState();
        }
      } else {
        resetAppState();
      }
    } finally {
      setLoading(false);
    }
  }, [currentUser?.user_id, hydrateState, lowBandwidthMode, resetAppState]);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    const syncNetworkStatus = () => setIsOffline(!navigator.onLine);

    window.addEventListener("online", syncNetworkStatus);
    window.addEventListener("offline", syncNetworkStatus);

    return () => {
      window.removeEventListener("online", syncNetworkStatus);
      window.removeEventListener("offline", syncNetworkStatus);
    };
  }, []);

  useEffect(() => {
    setTasks(pruneTasks(loadTasks(currentUser?.user_id)));
  }, [currentUser?.user_id]);

  useEffect(() => {
    saveTasks(currentUser?.user_id, pruneTasks(tasks));
  }, [currentUser?.user_id, tasks]);

  useEffect(() => {
    saveUiSettings({ lowBandwidthMode });
  }, [lowBandwidthMode]);

  useEffect(() => {
    if (currentUser && billing && !billing.hasSubscription) {
      setUpgradePromptOpen(true);
      return;
    }

    setUpgradePromptOpen(false);
  }, [billing, currentUser]);

  const login = useCallback(async (email: string, password: string) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      await apiRequest("/auth/login", {
        method: "POST",
        body: { email, password }
      });
      await bootstrap();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed";
      setAuthError(message);
      throw error;
    } finally {
      setAuthLoading(false);
    }
  }, [bootstrap]);

  const register = useCallback(async (payload: { name: string; email: string; password: string }) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      await apiRequest("/auth/register", {
        method: "POST",
        body: payload
      });
      await bootstrap();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Registration failed";
      setAuthError(message);
      throw error;
    } finally {
      setAuthLoading(false);
    }
  }, [bootstrap]);

  const logout = useCallback(async () => {
    await apiRequest("/auth/logout", { method: "POST" }).catch(() => null);
    setAuthError(null);
    resetAppState();
  }, [resetAppState]);

  const refreshActivityState = useCallback(async () => {
    const [history, carbon, profile, suggestions, board] = await Promise.all([
      apiRequest<{ history: BackendUserActivity[] }>("/activity/history"),
      apiRequest<DashboardSummary>("/carbon/summary"),
      apiRequest<BackendProfile>("/user/profile"),
      lowBandwidthMode
        ? Promise.resolve<{ suggestions: string[] }>({
            suggestions: [
              "Low-bandwidth mode is on. Open AI Chat when you want a single focused suggestion."
            ]
          })
        : apiRequest<{ suggestions: string[] }>("/ai/suggestions", { method: "POST", body: {} }),
      apiRequest<{ leaderboard: Array<{ userId: string; name: string; averageEmission: number; badgeCount: number }> }>("/carbon/leaderboard")
    ]);

    setCurrentUser(mapCurrentUser(profile));
    setUserActivities(history.history.map(mapUserActivity));
    setSummary(carbon);
    setPreferences((prev) => {
      const mapped = mapPreferences(profile.preferences, profile.user.id);
      return prev
        ? {
            ...mapped,
            receive_tips: prev.receive_tips,
            notification_time: prev.notification_time
          }
        : mapped;
    });
    setAiSuggestions(suggestions.suggestions);
    setLeaderboard(board.leaderboard);
  }, [lowBandwidthMode]);

  const loadAdminUsers = useCallback(async () => {
    setAdminLoading(true);
    try {
      const response = await apiRequest<{ users: AdminUserSummary[] }>("/admin/users");
      setAdminUsers(response.users);
    } finally {
      setAdminLoading(false);
    }
  }, []);

  const loadAdminUserDetails = useCallback(async (userId: string) => {
    setAdminLoading(true);
    try {
      const response = await apiRequest<{ user: AdminUserDetails }>(`/admin/users/${userId}`);
      setAdminUserDetails(response.user);
    } finally {
      setAdminLoading(false);
    }
  }, []);

  const totalCO2Today = summary.daily;
  const totalCO2All = userActivities.reduce((sum, activity) => sum + activity.co2_emission, 0);
  const weeklyData = summary.timeline.map((entry) => ({
    day: dayLabel(entry.date),
    co2: entry.carbonEmission
  }));

  const streak = (() => {
    let count = 0;
    const availableDays = new Set(
      userActivities.map((entry) => new Date(entry.timestamp).toISOString().slice(0, 10))
    );
    const today = new Date();

    for (let i = 0; i < 30; i += 1) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const key = date.toISOString().slice(0, 10);
      if (availableDays.has(key)) count += 1;
      else break;
    }

    return count;
  })();

  const ecoScore = (() => {
    if (!summary.timeline.length) return 100;
    const nonZeroDays = summary.timeline.filter((item) => item.carbonEmission > 0);
    const average = nonZeroDays.length
      ? nonZeroDays.reduce((sum, item) => sum + item.carbonEmission, 0) / nonZeroDays.length
      : 0;
    if (average === 0) return 100;
    return Math.max(0, Math.min(100, Math.round((1 - average / 15) * 100)));
  })();

  const motivationalMessage =
    loading
      ? "Loading your sustainability dashboard..."
      : totalCO2Today === 0
        ? "Start logging your day to uncover quick carbon-saving wins."
        : totalCO2Today <= 10
          ? "Nice work. You are under your daily goal today."
          : "You are above your daily goal today. Check the AI suggestions for the easiest category to improve next.";
  const unitPreference = preferences?.units ?? "metric";

  const addChatMessage = useCallback((message: string, sender: "user" | "AI") => {
    setChatLog((prev) => [
      ...prev,
      {
        chat_id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        user_id: currentUser?.user_id || "demo",
        message,
        sender,
        timestamp: new Date().toISOString()
      }
    ]);
  }, [currentUser?.user_id]);

  const addUserActivity = useCallback(async (activityId: string, quantity: number, notes: string) => {
    await apiRequest("/activity/log", {
      method: "POST",
      body: {
        activityId,
        quantity,
        customInput: {
          quantity,
          description: notes || "Logged from EcoBot frontend"
        }
      }
    });

    await refreshActivityState();
  }, [refreshActivityState]);

  const addUserActivitiesBatch = useCallback(async (entries: ExtractedActivityEntry[]) => {
    if (!entries.length) return;

    await apiRequest("/activity/log-batch", {
      method: "POST",
      body: {
        entries: entries.map((entry) => ({
          activityId: entry.activity.activity_id,
          quantity: entry.quantity,
          description: entry.notes,
          customInput: {
            quantity: entry.quantity,
            description: entry.notes,
            source: "ai-chat-batch"
          }
        }))
      }
    });

    await refreshActivityState();
  }, [refreshActivityState]);

  const addTask = useCallback((title: string, time: string) => {
    setTasks((prev) =>
      pruneTasks([
        ...prev,
        {
          task_id: `task-${Date.now()}`,
          user_id: currentUser?.user_id || "demo",
          title,
          time,
          completed: false,
          created_at: new Date().toISOString()
        }
      ])
    );
  }, [currentUser?.user_id]);

  const sendChatMessage = useCallback(async (message: string) => {
    if (!currentUser) return;

    addChatMessage(message, "user");

    try {
      const reminderMatch = message.match(reminderPattern);
      if (reminderMatch) {
        const title = reminderMatch[3].trim();
        const taskTime = reminderMatch[4]?.trim();
        const date = new Date();

        if (taskTime) {
          const match = taskTime.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
          if (match) {
            let hours = Number(match[1]);
            const minutes = Number(match[2] || 0);
            const suffix = match[3].toLowerCase();
            if (suffix === "pm" && hours < 12) hours += 12;
            if (suffix === "am" && hours === 12) hours = 0;
            date.setHours(hours, minutes, 0, 0);
          }
        }

        addTask(title, date.toISOString());
        addChatMessage(`Reminder set for "${title}".`, "AI");
        return;
      }

      const statsResponse = buildStatsAwareResponse({
        message,
        userActivities,
        activities,
        ecoScore,
        totalCO2Today,
        totalCO2All,
        unitPreference
      });
      if (statsResponse) {
        addChatMessage(statsResponse, "AI");
        return;
      }

      const activityBatch = inferActivitiesBatch(message, activities);
      if (activityBatch.length >= 2) {
        await addUserActivitiesBatch(activityBatch);

        const totalEmission = activityBatch.reduce(
          (sum, entry) => sum + entry.quantity * entry.activity.emission_factor,
          0
        );
        const summaryText = summarizeBatchEntries(activityBatch);
        const suggestions = buildImprovementSuggestions(activityBatch);

        addChatMessage(
          `I turned your day summary into ${activityBatch.length} activity logs. I captured: ${summaryText}. The estimated total added footprint is ${totalEmission.toFixed(2)} kg CO2.\n\nTo improve this pattern, start here:\n• ${suggestions.join('\n• ')}`,
          "AI"
        );
        return;
      }

      const activityMatch = inferActivity(message, activities);
      if (activityMatch) {
        await addUserActivity(activityMatch.activity.activity_id, activityMatch.quantity, message);
        const suggestions = buildImprovementSuggestions([
          {
            activity: activityMatch.activity,
            quantity: activityMatch.quantity,
            notes: message
          }
        ]);
        addChatMessage(
          `I logged "${activityMatch.activity.name}" for you.\n\nA good next improvement would be:\n• ${suggestions.join('\n• ')}`,
          "AI"
        );
        return;
      }

      const response = await apiRequest<{ response: string }>("/ai/chat", {
        method: "POST",
        body: { message }
      });

      addChatMessage(response.response, "AI");
    } catch (error) {
      const messageText =
        error instanceof Error && error.message
          ? error.message
          : "I hit a temporary connection issue.";
      addChatMessage(
        `${messageText} Please try again in a moment.`,
        "AI"
      );
    }
  }, [activities, addChatMessage, addTask, addUserActivitiesBatch, addUserActivity, currentUser, ecoScore, totalCO2All, totalCO2Today, unitPreference, userActivities]);

  const setLowBandwidthMode = useCallback((enabled: boolean) => {
    setLowBandwidthModeState(enabled);
  }, []);

  const dismissUpgradePrompt = useCallback(() => {
    setUpgradePromptOpen(false);
  }, []);

  const updatePreferences = useCallback(async (updates: Partial<Preferences>) => {
    if (!currentUser) return;

    await apiRequest<{ preferences: BackendPreferences }>("/user/preferences", {
      method: "PUT",
      body: {
        dietType: updates.diet_type ?? preferences?.diet_type,
        transportMode: updates.transport_mode ?? preferences?.transport_mode,
        energyUsageType: updates.energy_usage_type ?? preferences?.energy_usage_type,
        units: updates.units ?? preferences?.units
      }
    });

    setPreferences((prev) =>
      prev
        ? {
            ...prev,
            ...updates
          }
        : null
    );
  }, [currentUser, preferences]);

  const subscribeToPlan = useCallback(async (planMonths: 1 | 3 | 6 | 12) => {
    const response = await apiRequest<{ billing: BillingSnapshot }>("/user/subscription", {
      method: "POST",
      body: {
        planMonths: String(planMonths)
      }
    });

    setBilling(response.billing);
    setUpgradePromptOpen(false);
  }, []);

  const toggleTask = useCallback((taskId: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.task_id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    setTasks((prev) => prev.filter((task) => task.task_id !== taskId));
  }, []);

  const value: AppDataContextType = {
    isAuthenticated: Boolean(currentUser),
    currentUser,
    activities,
    userActivities,
    chatLog,
    tasks,
    preferences,
    billing,
    loading,
    authLoading,
    authError,
    upgradePromptOpen,
    lowBandwidthMode,
    setLowBandwidthMode,
    dismissUpgradePrompt,
    isOffline,
    unitPreference,
    adminUsers,
    adminUserDetails,
    adminLoading,
    login,
    register,
    logout,
    loadAdminUsers,
    loadAdminUserDetails,
    addUserActivity,
    addChatMessage,
    sendChatMessage,
    updatePreferences,
    subscribeToPlan,
    addTask,
    toggleTask,
    deleteTask,
    totalCO2Today,
    totalCO2All,
    weeklyData,
    ecoScore,
    streak,
    motivationalMessage,
    aiSuggestions,
    leaderboard
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppData must be used within AppDataProvider");
  }
  return context;
}
