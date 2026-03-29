import { useAppData } from '@/hooks/useAppData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, User, Award, Flame } from 'lucide-react';
import { convertCarbon } from '@/lib/units';

export default function PreferencesPage() {
  const { preferences, updatePreferences, currentUser, ecoScore, streak, unitPreference } = useAppData();

  if (!preferences) return <p className="text-muted-foreground">Loading preferences...</p>;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Preferences</h1>
        <p className="text-muted-foreground mt-1 text-sm">Customize your Ecobot experience.</p>
      </div>

      {/* Profile Card */}
      {currentUser && (
        <Card className="border-none bg-gradient-to-br from-primary/5 to-accent/5 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-7 w-7 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-lg font-bold">{currentUser.username}</p>
                <p className="text-sm text-muted-foreground">{currentUser.email}</p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="text-center rounded-xl bg-card p-3">
                <Target className="h-4 w-4 mx-auto text-accent" />
                <p className="text-lg font-bold mt-1">{convertCarbon(currentUser.daily_goal_kgCO2, unitPreference).toFixed(1)}</p>
                <p className="text-[10px] text-muted-foreground">Daily Goal ({unitPreference === 'imperial' ? 'lb' : 'kg'})</p>
              </div>
              <div className="text-center rounded-xl bg-card p-3">
                <Award className="h-4 w-4 mx-auto text-primary" />
                <p className="text-lg font-bold mt-1">{ecoScore}</p>
                <p className="text-[10px] text-muted-foreground">Eco Score</p>
              </div>
              <div className="text-center rounded-xl bg-card p-3">
                <Flame className="h-4 w-4 mx-auto text-accent" />
                <p className="text-lg font-bold mt-1">{streak}</p>
                <p className="text-[10px] text-muted-foreground">Day Streak</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings className="h-4 w-4 text-primary" /> Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-2">
          <div className="flex items-center justify-between rounded-2xl bg-secondary/35 p-4 lg:col-span-2">
            <div>
              <Label>Receive Eco Tips</Label>
              <p className="text-xs text-muted-foreground">Get daily eco-friendly suggestions</p>
            </div>
            <Switch
              checked={preferences.receive_tips}
              onCheckedChange={val => updatePreferences({ receive_tips: val })}
            />
          </div>

          <div className="space-y-2 rounded-2xl bg-secondary/25 p-4">
            <Label>Notification Time</Label>
            <Input
              type="time"
              value={preferences.notification_time}
              onChange={e => updatePreferences({ notification_time: e.target.value })}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2 rounded-2xl bg-secondary/25 p-4">
            <Label>Units</Label>
            <Select value={preferences.units} onValueChange={val => updatePreferences({ units: val })}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="metric">Metric (kg, km)</SelectItem>
                <SelectItem value="imperial">Imperial (lb, mi)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Target(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
    </svg>
  );
}
