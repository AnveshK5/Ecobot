import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { apiRequest, getStoredToken, setStoredToken } from "@/lib/api";

type ActivityType = "transport" | "food" | "energy" | "shopping";

export interface User {
  user_id: string;
  username: string;
  email: string;
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
  units: string;
}

type DashboardSummary = {
  daily: number;
  weekly: number;
  monthly: number;
  timeline: Array<{ date: string; carbonEmission: number }>;
};

interface AppDataContextType {
  currentUser: User | null;
  activities: Activity[];
  userActivities: UserActivity[];
  chatLog: ChatMessage[];
  tasks: Task[];
  preferences: Preferences | null;
  loading: boolean;
  addUserActivity: (activityId: string, quantity: number, notes: string) => Promise<void>;
  addChatMessage: (message: string, sender: "user" | "AI") => void;
  sendChatMessage: (message: string) => Promise<void>;
  updatePreferences: (updates: Partial<Preferences>) => Promise<void>;
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
};

type BackendProfile = {
  user: {
    id: string;
    name: string;
    email: string;
    createdAt: string;
  };
  preferences: BackendPreferences | null;
  badges: Array<{
    id: string;
    key: string;
    name: string;
    description: string;
    awardedAt: string;
  }>;
};

const AppDataContext = createContext<AppDataContextType | null>(null);
const TASKS_KEY = "ecobot-tasks";

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

function loadTasks() {
  const raw = localStorage.getItem(TASKS_KEY);
  if (!raw) return quickTaskSeed;

  try {
    return JSON.parse(raw) as Task[];
  } catch {
    return quickTaskSeed;
  }
}

function saveTasks(tasks: Task[]) {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

function formatUnit(description: string, type: ActivityType) {
  const lower = description.toLowerCase();
  if (lower.includes("kwh")) return "kWh";
  if (lower.includes("therm")) return "therm";
  if (lower.includes("meal")) return "meal";
  if (lower.includes("ride") || lower.includes("driving") || lower.includes("walking") || lower.includes("cycling") || lower.includes("flight")) {
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
    units: "metric"
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

function dayLabel(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", { weekday: "short" });
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
  const [chatLog, setChatLog] = useState<ChatMessage[]>([]);
  const [tasks, setTasks] = useState<Task[]>(() => loadTasks());
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [summary, setSummary] = useState<DashboardSummary>({
    daily: 0,
    weekly: 0,
    monthly: 0,
    timeline: []
  });
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [leaderboard, setLeaderboard] = useState<Array<{ userId: string; name: string; averageEmission: number; badgeCount: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    async function bootstrap() {
      try {
        let activeToken = token;

        if (!activeToken) {
          const login = await apiRequest<{
            token: string;
            user: { id: string; name: string; email: string };
          }>("/auth/login", {
            method: "POST",
            body: {
              email: import.meta.env.VITE_DEMO_EMAIL || "demo@ecobot.app",
              password: import.meta.env.VITE_DEMO_PASSWORD || "DemoPass123!"
            }
          });

          activeToken = login.token;
          setStoredToken(activeToken);
          setToken(activeToken);
        }

        const [catalog, profile, history, carbon, chats, suggestions, board] = await Promise.all([
          apiRequest<{ activities: BackendActivity[] }>("/activity/catalog", { token: activeToken }),
          apiRequest<BackendProfile>("/user/profile", { token: activeToken }),
          apiRequest<{ history: BackendUserActivity[] }>("/activity/history", { token: activeToken }),
          apiRequest<DashboardSummary>("/carbon/summary", { token: activeToken }),
          apiRequest<{ chats: BackendChat[] }>("/ai/history", { token: activeToken }),
          apiRequest<{ suggestions: string[] }>("/ai/suggestions", { method: "POST", body: {}, token: activeToken }),
          apiRequest<{ leaderboard: Array<{ userId: string; name: string; averageEmission: number; badgeCount: number }> }>("/carbon/leaderboard", { token: activeToken })
        ]);

        setActivities(catalog.activities.map(mapActivity));
        setCurrentUser({
          user_id: profile.user.id,
          username: profile.user.name,
          email: profile.user.email,
          daily_goal_kgCO2: 10,
          created_at: profile.user.createdAt
        });
        setPreferences(mapPreferences(profile.preferences, profile.user.id));
        setUserActivities(history.history.map(mapUserActivity));
        setSummary(carbon);
        setChatLog(mapChats(chats.chats));
        setAiSuggestions(suggestions.suggestions);
        setLeaderboard(board.leaderboard);
      } finally {
        setLoading(false);
      }
    }

    void bootstrap();
  }, [token]);

  const addChatMessage = (message: string, sender: "user" | "AI") => {
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
  };

  async function refreshActivityState(activeToken = token) {
    if (!activeToken) return;

    const [history, carbon, profile, suggestions, board] = await Promise.all([
      apiRequest<{ history: BackendUserActivity[] }>("/activity/history", { token: activeToken }),
      apiRequest<DashboardSummary>("/carbon/summary", { token: activeToken }),
      apiRequest<BackendProfile>("/user/profile", { token: activeToken }),
      apiRequest<{ suggestions: string[] }>("/ai/suggestions", { method: "POST", body: {}, token: activeToken }),
      apiRequest<{ leaderboard: Array<{ userId: string; name: string; averageEmission: number; badgeCount: number }> }>("/carbon/leaderboard", { token: activeToken })
    ]);

    setUserActivities(history.history.map(mapUserActivity));
    setSummary(carbon);
    setPreferences((prev) => {
      const mapped = mapPreferences(profile.preferences, profile.user.id);
      return prev
        ? {
            ...mapped,
            receive_tips: prev.receive_tips,
            notification_time: prev.notification_time,
            units: prev.units
          }
        : mapped;
    });
    setAiSuggestions(suggestions.suggestions);
    setLeaderboard(board.leaderboard);
  }

  async function addUserActivity(activityId: string, quantity: number, notes: string) {
    if (!token) return;

    await apiRequest("/activity/log", {
      method: "POST",
      token,
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
  }

  async function sendChatMessage(message: string) {
    if (!token || !currentUser) return;

    addChatMessage(message, "user");

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

    const activityMatch = inferActivity(message, activities);
    if (activityMatch) {
      await addUserActivity(activityMatch.activity.activity_id, activityMatch.quantity, message);
      const emission = Number((activityMatch.quantity * activityMatch.activity.emission_factor).toFixed(2));
      addChatMessage(
        `${activityMatch.activity.name} logged: ${activityMatch.quantity} ${activityMatch.activity.unit}(s) for ${emission} kg CO2.`,
        "AI"
      );
      return;
    }

    const response = await apiRequest<{ response: string }>("/ai/chat", {
      method: "POST",
      token,
      body: { message }
    });

    addChatMessage(response.response, "AI");
  }

  async function updatePreferences(updates: Partial<Preferences>) {
    if (!token || !currentUser) return;

    await apiRequest<{ preferences: BackendPreferences }>("/user/preferences", {
      method: "PUT",
      token,
      body: {
        dietType: updates.diet_type ?? preferences?.diet_type,
        transportMode: updates.transport_mode ?? preferences?.transport_mode,
        energyUsageType: updates.energy_usage_type ?? preferences?.energy_usage_type
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
  }

  function addTask(title: string, time: string) {
    setTasks((prev) => [
      ...prev,
      {
        task_id: `task-${Date.now()}`,
        user_id: currentUser?.user_id || "demo",
        title,
        time,
        completed: false,
        created_at: new Date().toISOString()
      }
    ]);
  }

  function toggleTask(taskId: string) {
    setTasks((prev) =>
      prev.map((task) =>
        task.task_id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  }

  function deleteTask(taskId: string) {
    setTasks((prev) => prev.filter((task) => task.task_id !== taskId));
  }

  const totalCO2Today = summary.daily;
  const totalCO2All = useMemo(
    () => userActivities.reduce((sum, activity) => sum + activity.co2_emission, 0),
    [userActivities]
  );

  const weeklyData = useMemo(
    () =>
      summary.timeline.map((entry) => ({
        day: dayLabel(entry.date),
        co2: entry.carbonEmission
      })),
    [summary.timeline]
  );

  const streak = useMemo(() => {
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
  }, [userActivities]);

  const ecoScore = useMemo(() => {
    if (!summary.timeline.length) return 100;
    const nonZeroDays = summary.timeline.filter((item) => item.carbonEmission > 0);
    const average = nonZeroDays.length
      ? nonZeroDays.reduce((sum, item) => sum + item.carbonEmission, 0) / nonZeroDays.length
      : 0;
    if (average === 0) return 100;
    return Math.max(0, Math.min(100, Math.round((1 - average / 15) * 100)));
  }, [summary.timeline]);

  const motivationalMessage = useMemo(() => {
    if (loading) return "Loading your sustainability dashboard...";
    if (totalCO2Today === 0) return "Start logging your day to uncover quick carbon-saving wins.";
    if (totalCO2Today <= 10) return `Nice work. You are ${(10 - totalCO2Today).toFixed(1)} kg under your daily goal today.`;
    return "You are above your daily goal today. Check the AI suggestions for the easiest category to improve next.";
  }, [loading, totalCO2Today]);

  const value = useMemo<AppDataContextType>(
    () => ({
      currentUser,
      activities,
      userActivities,
      chatLog,
      tasks,
      preferences,
      loading,
      addUserActivity,
      addChatMessage,
      sendChatMessage,
      updatePreferences,
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
    }),
    [
      currentUser,
      activities,
      userActivities,
      chatLog,
      tasks,
      preferences,
      loading,
      totalCO2Today,
      totalCO2All,
      weeklyData,
      ecoScore,
      streak,
      motivationalMessage,
      aiSuggestions,
      leaderboard
    ]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppData must be used within AppDataProvider");
  }
  return context;
}
