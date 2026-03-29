import { useAppData } from '@/hooks/useAppData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Leaf, TrendingUp, Target, Flame, Award, CheckCircle2, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { carbonUnit, convertCarbon } from '@/lib/units';

export default function DashboardPage() {
  const {
    currentUser, userActivities, activities, totalCO2Today, totalCO2All,
    weeklyData, ecoScore, streak, motivationalMessage, tasks, aiSuggestions, leaderboard, unitPreference,
  } = useAppData();
  const goal = currentUser?.daily_goal_kgCO2 || 10;
  const progress = Math.min((totalCO2Today / goal) * 100, 100);
  const carbonLabel = carbonUnit(unitPreference);

  const categoryBreakdown = userActivities.reduce<Record<string, number>>((acc, ua) => {
    const act = activities.find(a => a.activity_id === ua.activity_id);
    const cat = act?.category || 'Other';
    acc[cat] = (acc[cat] || 0) + ua.co2_emission;
    return acc;
  }, {});

  const completedToday = tasks.filter(t => t.completed).length;
  const pendingTasks = tasks.filter(t => !t.completed);

  const categoryColors: Record<string, string> = {
    Travel: 'bg-blue-500', Food: 'bg-orange-500', Energy: 'bg-yellow-500', Shopping: 'bg-purple-500',
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Motivational Banner */}
      <div className="rounded-3xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl xl:text-4xl">
              Welcome back, {currentUser?.username || 'User'} 🌿
            </h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">{motivationalMessage}</p>
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
            <CardTitle className="text-base">Weekly CO₂ Emissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    formatter={(value: number) => [`${convertCarbon(value, unitPreference).toFixed(1)} ${carbonLabel}`, 'CO₂']}
                  />
                  <ReferenceLine y={goal} stroke="hsl(var(--accent))" strokeDasharray="4 4" label={{ value: 'Goal', position: 'right', fontSize: 11 }} />
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
    </div>
  );
}
