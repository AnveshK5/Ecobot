import { useState, useMemo } from 'react';
import { useAppData } from '@/hooks/useAppData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { History, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

type Filter = 'all' | 'today' | 'week' | 'month';

export default function HistoryPage() {
  const { userActivities, activities } = useAppData();
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    return userActivities.filter(ua => {
      if (filter === 'today') return ua.timestamp.startsWith(todayStr);
      if (filter === 'week') {
        const d = new Date(ua.timestamp);
        const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
        return diff <= 7;
      }
      if (filter === 'month') {
        const d = new Date(ua.timestamp);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [userActivities, filter]);

  const enriched = filtered.map(ua => {
    const act = activities.find(a => a.activity_id === ua.activity_id);
    return { ...ua, activityName: act?.name || 'Unknown', unit: act?.unit || '', category: act?.category || '' };
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const totalFiltered = enriched.reduce((s, e) => s + e.co2_emission, 0);

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
  ];

  const categoryEmoji: Record<string, string> = { Travel: '🚗', Food: '🍽️', Energy: '⚡', Shopping: '🛒' };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Activity History</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {enriched.length} activities · {totalFiltered.toFixed(1)} kg CO₂ total
          </p>
        </div>
        <div className="flex gap-1.5">
          {filters.map(f => (
            <Button
              key={f.key}
              variant={filter === f.key ? 'default' : 'outline'}
              size="sm"
              className="rounded-full text-xs"
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4 text-primary" /> Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          {enriched.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">No activities found for this period.</p>
          ) : (
            <div className="divide-y divide-border">
              {enriched.map(item => (
                <div key={item.log_id} className="flex items-center justify-between py-3.5 group hover:bg-secondary/30 -mx-4 px-4 rounded-lg transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-lg">{categoryEmoji[item.category] || '🌍'}</span>
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{item.activityName}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.quantity} {item.unit}(s) · {item.notes}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <span className={cn(
                      "text-sm font-semibold",
                      item.co2_emission === 0 ? 'text-primary' : 'text-destructive'
                    )}>
                      {item.co2_emission === 0 ? '0 🌿' : `${item.co2_emission} kg`}
                    </span>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(item.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
