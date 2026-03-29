import { useAppData } from '@/hooks/useAppData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Leaf, TrendingUp, Target, Flame, Award, CheckCircle2, Clock, Waves, Radar, WifiOff, DatabaseZap, LineChart, Line, AreaChart, Area, ArrowRight, Sparkles } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, LineChart as RechartsLineChart, Line as RechartsLine, AreaChart as RechartsAreaChart, Area as RechartsArea } from 'recharts';
import { carbonUnit, convertCarbon } from '@/lib/units';
import { getDegrowthStage, getMangroveCycle } from '@/lib/biome';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysAgo(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() - days);
  return copy;
}

export default function DashboardPage() {
  const {
    currentUser, userActivities, activities, totalCO2Today, totalCO2All,
    weeklyData, ecoScore, streak, motivationalMessage, tasks, aiSuggestions, leaderboard, unitPreference,
    lowBandwidthMode, isOffline,
  } = useAppData();
  const goal = currentUser?.daily_goal_kgCO2 || 10;
  const progress = Math.min((totalCO2Today / goal) * 100, 100);
  const carbonLabel = carbonUnit(unitPreference);
  const cycle = getMangroveCycle();
  const degrowthStage = getDegrowthStage(ecoScore);

  const categoryBreakdown = userActivities.reduce<Record<string, number>>((acc, ua) => {
    const act = activities.find(a => a.activity_id === ua.activity_id);
    const cat = act?.category || 'Other';
    acc[cat] = (acc[cat] || 0) + ua.co2_emission;
    return acc;
  }, {});

  const completedToday = tasks.filter(t => t.completed).length;
  const pendingTasks = tasks.filter(t => !t.completed);
  const collectiveAverage = leaderboard.length
    ? leaderboard.reduce((sum, entry) => sum + entry.averageEmission, 0) / leaderboard.length
    : 0;
  const personalVsCollective = collectiveAverage > 0 ? totalCO2Today - collectiveAverage : 0;
  const now = new Date();
  const weekStart = startOfLocalDay(daysAgo(now, 6));
  const monthStart = startOfLocalDay(daysAgo(now, 29));
  const yearStart = new Date(now.getFullYear(), 0, 1);

  const categoryKeyByActivityId = new Map(activities.map((activity) => [activity.activity_id, activity.category]));
  const filteredCategoryTotals = (startDate: Date) =>
    userActivities.reduce<Record<string, number>>((acc, entry) => {
      if (new Date(entry.timestamp) < startDate) {
        return acc;
      }

      const category = categoryKeyByActivityId.get(entry.activity_id) || 'Other';
      acc[category] = (acc[category] || 0) + entry.co2_emission;
      return acc;
    }, {});

  const weeklyCategoryTotals = filteredCategoryTotals(weekStart);
  const monthlyCategoryTotals = filteredCategoryTotals(monthStart);
  const yearlyCategoryTotals = filteredCategoryTotals(yearStart);

  const rollingThirtyDays = Array.from({ length: 30 }, (_, index) => {
    const date = startOfLocalDay(daysAgo(now, 29 - index));
    const dateKey = date.toISOString().slice(5, 10);
    const total = userActivities
      .filter((entry) => startOfLocalDay(new Date(entry.timestamp)).getTime() === date.getTime())
      .reduce((sum, entry) => sum + entry.co2_emission, 0);
    const saved = Math.max(goal - total, 0);

    return {
      date: dateKey,
      dailyEmission: Number(total.toFixed(2)),
      saved: Number(saved.toFixed(2))
    };
  }).reduce<Array<{ date: string; dailyEmission: number; cumulative: number; saved: number }>>((acc, day) => {
    const previous = acc.at(-1)?.cumulative ?? 0;
    acc.push({
      ...day,
      cumulative: Number((previous + day.dailyEmission).toFixed(2))
    });
    return acc;
  }, []);

  const topCategoryEntry = Object.entries(monthlyCategoryTotals).sort((a, b) => b[1] - a[1])[0];
  const topCategoryName = topCategoryEntry?.[0] ?? 'Travel';
  const reductionFactor = topCategoryName === 'Travel' ? 0.28 : topCategoryName === 'Food' ? 0.22 : 0.18;
  const currentThirtyDayPath = rollingThirtyDays.reduce((sum, day) => sum + day.dailyEmission, 0);
  const betterFutureThirtyDay = Number((currentThirtyDayPath * (1 - reductionFactor)).toFixed(2));
  const averageDailyEmission = rollingThirtyDays.length
    ? currentThirtyDayPath / rollingThirtyDays.length
    : 0;
  const estimatedYearlyPath = averageDailyEmission * 365;
  const estimatedYearlyBetter = estimatedYearlyPath * (1 - reductionFactor);
  const totalSavedThisMonth = rollingThirtyDays.reduce((sum, day) => sum + day.saved, 0);

  const recommendationCards = [
    aiSuggestions[0]
      ? {
          title: 'Highest-Impact Next Step',
          body: aiSuggestions[0]
        }
      : null,
    topCategoryEntry
      ? {
          title: `${topCategoryName} Focus`,
          body: `${topCategoryName} is your largest category this month at ${convertCarbon(topCategoryEntry[1], unitPreference).toFixed(1)} ${carbonLabel}. Cutting this category first will move your score fastest.`
        }
      : null,
    {
      title: 'Daily Savings Habit',
      body: `You have already avoided ${convertCarbon(totalSavedThisMonth, unitPreference).toFixed(1)} ${carbonLabel} over the last 30 days by staying under your daily goal on lower-emission days.`
    }
  ].filter(Boolean) as Array<{ title: string; body: string }>;

  const categoryColors: Record<string, string> = {
    Travel: 'bg-blue-500', Food: 'bg-orange-500', Energy: 'bg-yellow-500', Shopping: 'bg-purple-500',
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Motivational Banner */}
      <div className="rounded-3xl border border-primary/20 bg-gradient-to-r from-emerald-500/20 via-cyan-500/10 to-amber-400/10 p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl xl:text-4xl">
              Welcome back, {currentUser?.username || 'User'}
            </h1>
            <p className="mt-2 text-xs uppercase tracking-[0.3em] text-emerald-300">Mangrove Biome System</p>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">{motivationalMessage}</p>
            <p className={`mt-3 text-sm font-medium ${cycle.accent}`}>{cycle.phase}</p>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{cycle.description}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center sm:gap-4">
            <div className="rounded-2xl bg-background/60 px-4 py-3 text-center">
              <div className="flex items-center gap-1 text-accent">
                <Flame className="h-5 w-5" />
                <span className="text-2xl font-bold">{streak}</span>
              </div>
              <p className="text-xs text-muted-foreground">Day Streak</p>
            </div>
            <div className="rounded-2xl bg-background/60 px-4 py-3 text-center">
              <div className="flex items-center gap-1 text-primary">
                <Award className="h-5 w-5" />
                <span className="text-2xl font-bold">{ecoScore}</span>
              </div>
              <p className="text-xs text-muted-foreground">Eco Score</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-none bg-secondary/30 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Waves className="h-4 w-4 text-cyan-300" />
              Nature&apos;s Metronome
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            The dashboard changes guidance by real-world time cycle. Right now Ecobot is in <span className="font-medium text-foreground">{cycle.phase}</span>.
          </CardContent>
        </Card>

        <Card className="border-none bg-secondary/30 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Radar className="h-4 w-4 text-amber-300" />
              Power Of One
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {collectiveAverage > 0
              ? personalVsCollective <= 0
                ? `You are ${convertCarbon(Math.abs(personalVsCollective), unitPreference).toFixed(1)} ${carbonLabel} below the tracked average.`
                : `You are ${convertCarbon(personalVsCollective, unitPreference).toFixed(1)} ${carbonLabel} above the tracked average.`
              : "Log a few activities to compare your impact against the community baseline."}
          </CardContent>
        </Card>

        <Card className="border-none bg-secondary/30 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              {isOffline || lowBandwidthMode ? <WifiOff className="h-4 w-4 text-emerald-300" /> : <DatabaseZap className="h-4 w-4 text-emerald-300" />}
              Local-First Status
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {isOffline
              ? "You are offline. Ecobot can fall back to locally cached data on this device."
              : lowBandwidthMode
                ? "Low-bandwidth mode is enabled. The app is reducing AI calls and visual weight."
                : "Live mode is active. Turn on low-bandwidth mode in Preferences for a lighter demo."}
          </CardContent>
        </Card>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Today's CO₂</CardTitle>
            <Leaf className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{convertCarbon(totalCO2Today, unitPreference).toFixed(1)} {carbonLabel}</div>
            <Progress value={progress} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {progress < 100 ? `${convertCarbon(goal - totalCO2Today, unitPreference).toFixed(1)} ${carbonLabel} remaining` : '⚠️ Goal exceeded'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Daily Goal</CardTitle>
            <Target className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{convertCarbon(goal, unitPreference).toFixed(1)} {carbonLabel}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round(progress)}% used
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Tasks Done</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedToday}</div>
            <p className="text-xs text-muted-foreground mt-1">{pendingTasks.length} pending</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Logged</CardTitle>
            <TrendingUp className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{convertCarbon(totalCO2All, unitPreference).toFixed(1)} {carbonLabel}</div>
            <p className="text-xs text-muted-foreground mt-1">{userActivities.length} activities</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 xl:grid-cols-5">
        {/* Weekly Chart */}
        <Card className="lg:col-span-3 border-none shadow-md">
          <CardHeader>
            <CardTitle className="text-base">{lowBandwidthMode ? 'Weekly CO₂ Snapshot' : 'Weekly CO₂ Emissions'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={lowBandwidthMode ? "h-48" : "h-64"}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  {!lowBandwidthMode && <CartesianGrid strokeDasharray="3 3" className="opacity-30" />}
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  {!lowBandwidthMode && <YAxis tick={{ fontSize: 12 }} />}
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    formatter={(value: number) => [`${convertCarbon(value, unitPreference).toFixed(1)} ${carbonLabel}`, 'CO₂']}
                  />
                  {!lowBandwidthMode && <ReferenceLine y={goal} stroke="hsl(var(--accent))" strokeDasharray="4 4" label={{ value: 'Goal', position: 'right', fontSize: 11 }} />}
                  <Bar dataKey="co2" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card className="lg:col-span-2 border-none shadow-md">
          <CardHeader>
            <CardTitle className="text-base">By Category</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(categoryBreakdown).sort((a, b) => b[1] - a[1]).map(([cat, val]) => (
              <div key={cat} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${categoryColors[cat] || 'bg-muted-foreground'}`} />
                    <span className="font-medium">{cat}</span>
                  </div>
                  <span className="text-muted-foreground">{convertCarbon(val, unitPreference).toFixed(1)} {carbonLabel}</span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div
                    className={`h-full rounded-full ${categoryColors[cat] || 'bg-muted-foreground'} transition-all duration-700`}
                    style={{ width: `${Math.min((val / totalCO2All) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))}
            {Object.keys(categoryBreakdown).length === 0 && (
              <p className="text-muted-foreground text-sm">No activities logged yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="text-base">This Week By Category</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(weeklyCategoryTotals).sort((a, b) => b[1] - a[1]).map(([category, value]) => (
              <div key={category} className="flex items-center justify-between rounded-xl bg-secondary/35 px-4 py-3 text-sm">
                <span>{category}</span>
                <span className="font-medium">{convertCarbon(value, unitPreference).toFixed(1)} {carbonLabel}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="text-base">This Month By Category</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(monthlyCategoryTotals).sort((a, b) => b[1] - a[1]).map(([category, value]) => (
              <div key={category} className="flex items-center justify-between rounded-xl bg-secondary/35 px-4 py-3 text-sm">
                <span>{category}</span>
                <span className="font-medium">{convertCarbon(value, unitPreference).toFixed(1)} {carbonLabel}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="text-base">This Year By Category</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(yearlyCategoryTotals).sort((a, b) => b[1] - a[1]).map(([category, value]) => (
              <div key={category} className="flex items-center justify-between rounded-xl bg-secondary/35 px-4 py-3 text-sm">
                <span>{category}</span>
                <span className="font-medium">{convertCarbon(value, unitPreference).toFixed(1)} {carbonLabel}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 2xl:grid-cols-2">
        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="text-base">30-Day Cumulative Emissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsAreaChart data={rollingThirtyDays}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    formatter={(value: number) => [`${convertCarbon(value, unitPreference).toFixed(1)} ${carbonLabel}`, 'Cumulative CO₂']}
                  />
                  <RechartsArea
                    type="monotone"
                    dataKey="cumulative"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.2}
                  />
                </RechartsAreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="text-base">Daily CO₂ Saved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart data={rollingThirtyDays}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    formatter={(value: number) => [`${convertCarbon(value, unitPreference).toFixed(1)} ${carbonLabel}`, 'Saved vs goal']}
                  />
                  <RechartsLine
                    type="monotone"
                    dataKey="saved"
                    stroke="hsl(var(--accent))"
                    strokeWidth={3}
                    dot={false}
                  />
                </RechartsLineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 2xl:grid-cols-2">
        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" />
              Current Path vs Better Future
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
              <div className="rounded-2xl bg-secondary/35 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Current 30-Day Path</p>
                <p className="mt-2 text-2xl font-bold">{convertCarbon(currentThirtyDayPath, unitPreference).toFixed(1)} {carbonLabel}</p>
                <p className="mt-1 text-sm text-muted-foreground">Projected yearly path: {convertCarbon(estimatedYearlyPath, unitPreference).toFixed(0)} {carbonLabel}</p>
              </div>
              <div className="flex justify-center">
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="rounded-2xl bg-primary/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-primary">Better Future Scenario</p>
                <p className="mt-2 text-2xl font-bold">{convertCarbon(betterFutureThirtyDay, unitPreference).toFixed(1)} {carbonLabel}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  If you reduce {topCategoryName.toLowerCase()} by about {Math.round(reductionFactor * 100)}%, your yearly path drops to {convertCarbon(estimatedYearlyBetter, unitPreference).toFixed(0)} {carbonLabel}.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-accent" />
              Personalized Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recommendationCards.map((item) => (
              <div key={item.title} className="rounded-xl bg-secondary/40 p-4">
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Tasks */}
      {pendingTasks.length > 0 && (
        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-accent" /> Upcoming Reminders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {pendingTasks.slice(0, 6).map(task => (
                <div key={task.task_id} className="flex items-center gap-3 rounded-xl bg-secondary/50 px-4 py-3">
                  <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(task.time).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 2xl:grid-cols-2">
        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="text-base">AI Suggestions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {aiSuggestions.length > 0 ? aiSuggestions.map((suggestion) => (
              <div key={suggestion} className="rounded-xl bg-secondary/50 p-3 text-sm text-muted-foreground">
                {suggestion}
              </div>
            )) : (
              <p className="text-sm text-muted-foreground">Suggestions will appear once your activity history loads.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="text-base">{currentUser?.is_admin ? 'Leaderboard' : 'Your Standing'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {leaderboard.length > 0 ? leaderboard.map((entry, index) => (
              <div key={entry.userId} className="flex items-center justify-between rounded-xl bg-secondary/40 px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{currentUser?.is_admin ? `${index + 1}. ${entry.name}` : entry.name}</p>
                  <p className="text-xs text-muted-foreground">{entry.badgeCount} badges earned</p>
                </div>
                <span className="text-sm font-semibold text-primary">{convertCarbon(entry.averageEmission, unitPreference).toFixed(1)} {carbonLabel} avg</span>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground">
                {currentUser?.is_admin
                  ? 'Leaderboard data will appear once the backend is connected.'
                  : 'Your personal standing will appear once you have some activity history.'}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="text-base">Total Transparency</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="rounded-xl bg-secondary/40 p-3">
              Daily total = sum of each logged activity&apos;s stored `carbon emission`.
            </div>
            <div className="rounded-xl bg-secondary/40 p-3">
              Each activity emission = quantity × activity emission factor from the backend catalog.
            </div>
            <div className="rounded-xl bg-secondary/40 p-3">
              Leaderboard score = average emission per logged activity, not a hidden proprietary score.
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="text-base">Degrowth Interface</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="rounded-xl bg-secondary/40 p-3">
              Current stage: <span className="font-medium text-foreground">{degrowthStage}</span>
            </div>
            <div className="rounded-xl bg-secondary/40 p-3">
              When your habits improve, the interface reduces visual noise and shifts toward a calmer, simpler state.
            </div>
            <div className="rounded-xl bg-secondary/40 p-3">
              Charitable cut: 1% of any future premium revenue is earmarked for mangrove restoration and local habitat projects.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
