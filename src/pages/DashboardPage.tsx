import { useAppData } from '@/hooks/useAppData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Leaf, TrendingUp, Target, Zap, Flame, Award, CheckCircle2, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function DashboardPage() {
  const {
    currentUser, userActivities, activities, totalCO2Today, totalCO2All,
    weeklyData, ecoScore, streak, motivationalMessage, tasks,
  } = useAppData();
  const goal = currentUser?.daily_goal_kgCO2 || 10;
  const progress = Math.min((totalCO2Today / goal) * 100, 100);

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
      <div className="rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 border border-primary/20 p-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Welcome back, {currentUser?.username || 'User'} 🌿
            </h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">{motivationalMessage}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="flex items-center gap-1 text-accent">
                <Flame className="h-5 w-5" />
                <span className="text-2xl font-bold">{streak}</span>
              </div>
              <p className="text-xs text-muted-foreground">Day Streak</p>
            </div>
            <div className="text-center">
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
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Today's CO₂</CardTitle>
            <Leaf className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCO2Today.toFixed(1)} kg</div>
            <Progress value={progress} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {progress < 100 ? `${(goal - totalCO2Today).toFixed(1)}kg remaining` : '⚠️ Goal exceeded'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Daily Goal</CardTitle>
            <Target className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{goal} kg</div>
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
            <div className="text-2xl font-bold">{totalCO2All.toFixed(1)} kg</div>
            <p className="text-xs text-muted-foreground mt-1">{userActivities.length} activities</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-5">
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
                    formatter={(value: number) => [`${value} kg`, 'CO₂']}
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
                  <span className="text-muted-foreground">{val.toFixed(1)} kg</span>
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
    </div>
  );
}
