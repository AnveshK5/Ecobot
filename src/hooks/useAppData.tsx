import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode
} from "react";
import { apiRequest } from "@/lib/api";

type ActivityType = "transport" | "food" | "energy" | "shopping";
type UnitPreference = "metric" | "imperial";
type UserRole = "USER" | "SUPERUSER";

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
  loading: boolean;
  authLoading: boolean;
  authError: string | null;
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
  const [adminUsers, setAdminUsers] = useState<AdminUserSummary[]>([]);
  const [adminUserDetails, setAdminUserDetails] = useState<AdminUserDetails | null>(null);
  const [adminLoading, setAdminLoading] = useState(false);

  const resetAppState = useCallback(() => {
    setCurrentUser(null);
    setActivities([]);
    setUserActivities([]);
    setChatLog([]);
    setPreferences(null);
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
        apiRequest<{ suggestions: string[] }>("/ai/suggestions", { method: "POST", body: {} }),
        apiRequest<{ leaderboard: Array<{ userId: string; name: string; averageEmission: number; badgeCount: number }> }>("/carbon/leaderboard")
      ]);

      setActivities(catalog.activities.map(mapActivity));
      setCurrentUser(mapCurrentUser(profile));
      setPreferences(mapPreferences(profile.preferences, profile.user.id));
      setUserActivities(history.history.map(mapUserActivity));
      setSummary(carbon);
      setChatLog(mapChats(chats.chats));
      setAiSuggestions(suggestions.suggestions);
      setLeaderboard(board.leaderboard);
      setAuthError(null);
    } catch {
      resetAppState();
    } finally {
      setLoading(false);
    }
  }, [resetAppState]);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    setTasks(loadTasks(currentUser?.user_id));
  }, [currentUser?.user_id]);

  useEffect(() => {
    saveTasks(currentUser?.user_id, tasks);
  }, [currentUser?.user_id, tasks]);

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
      apiRequest<{ suggestions: string[] }>("/ai/suggestions", { method: "POST", body: {} }),
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
  }, []);

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

  const addTask = useCallback((title: string, time: string) => {
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

      const activityMatch = inferActivity(message, activities);
      if (activityMatch) {
        await addUserActivity(activityMatch.activity.activity_id, activityMatch.quantity, message);
        addChatMessage(
          `${activityMatch.activity.name} logged successfully.`,
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
  }, [activities, addChatMessage, addTask, addUserActivity, currentUser]);

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

  const value: AppDataContextType = {
    isAuthenticated: Boolean(currentUser),
    currentUser,
    activities,
    userActivities,
    chatLog,
    tasks,
    preferences,
    loading,
    authLoading,
    authError,
    unitPreference: preferences?.units ?? "metric",
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
