import { useState } from 'react';
import { useAppData } from '@/hooks/useAppData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { PlusCircle, Leaf, Sparkles } from 'lucide-react';
import { carbonUnit, convertCarbon, convertDistance, distanceUnit } from '@/lib/units';

export default function AddActivityPage() {
  const { activities, addUserActivity, sendChatMessage, unitPreference } = useAppData();
  const [entryMode, setEntryMode] = useState<'manual' | 'type'>('manual');
  const [selectedActivity, setSelectedActivity] = useState('');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [typedSummary, setTypedSummary] = useState('');
  const [submittingTypedSummary, setSubmittingTypedSummary] = useState(false);

  const selected = activities.find(a => a.activity_id === selectedActivity);
  const rawQuantity = quantity ? parseFloat(quantity) : 0;
  const normalizedQuantity = selected?.unit === 'mile' && unitPreference === 'metric'
    ? rawQuantity / 1.60934
    : rawQuantity;
  const preview = selected && quantity ? (normalizedQuantity * selected.emission_factor).toFixed(2) : null;
  const displayUnit = selected?.unit === 'mile' ? distanceUnit(unitPreference) : selected?.unit;
  const displayedFactorValue = selected
    ? selected.unit === 'mile' && unitPreference === 'metric'
      ? convertCarbon(selected.emission_factor, unitPreference) / convertDistance(1, unitPreference)
      : convertCarbon(selected.emission_factor, unitPreference)
    : 0;
  const displayFactor = selected?.unit === 'mile'
    ? `${displayedFactorValue.toFixed(2)} ${carbonUnit(unitPreference)}/${distanceUnit(unitPreference)}`
    : selected
      ? `${displayedFactorValue.toFixed(2)} ${carbonUnit(unitPreference)}/${selected.unit}`
      : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActivity || !quantity) return;
    await addUserActivity(selectedActivity, normalizedQuantity, notes);
    toast.success('Activity logged!', { description: `${convertCarbon(Number(preview), unitPreference).toFixed(2)} ${carbonUnit(unitPreference)} CO₂ added.` });
    setSelectedActivity('');
    setQuantity('');
    setNotes('');
  };

  const handleTypedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedSummary.trim()) return;

    setSubmittingTypedSummary(true);
    try {
      await sendChatMessage(typedSummary.trim());
      toast.success('Summary processed', {
        description: 'Ecobot analyzed your text and logged the activities it recognized.'
      });
      setTypedSummary('');
    } finally {
      setSubmittingTypedSummary(false);
    }
  };

  const categoryEmoji: Record<string, string> = { Travel: '🚗', Food: '🍽️', Energy: '⚡', Shopping: '🛒' };

  // Group activities by category
  const grouped = activities.reduce<Record<string, typeof activities>>((acc, a) => {
    (acc[a.category] = acc[a.category] || []).push(a);
    return acc;
  }, {});

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Log Activity</h1>
        <p className="text-muted-foreground mt-1 text-sm">Choose manual entry or type your day naturally and let Ecobot extract activities for you.</p>
      </div>

      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <PlusCircle className="h-4 w-4 text-primary" /> New Entry
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={entryMode} onValueChange={(value) => setEntryMode(value as 'manual' | 'type')} className="space-y-5">
            <TabsList className="grid w-full grid-cols-2 rounded-xl bg-secondary/60 p-1">
              <TabsTrigger value="manual" className="rounded-lg">Manual</TabsTrigger>
              <TabsTrigger value="type" className="rounded-lg">Type</TabsTrigger>
            </TabsList>

            <TabsContent value="manual" className="mt-0">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label>Activity</Label>
                    <Select value={selectedActivity} onValueChange={setSelectedActivity}>
                      <SelectTrigger className="rounded-xl"><SelectValue placeholder="Choose an activity" /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(grouped).map(([cat, acts]) => (
                          <div key={cat}>
                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                              {categoryEmoji[cat]} {cat}
                            </div>
                            {acts.map(a => (
                              <SelectItem key={a.activity_id} value={a.activity_id}>
                                {a.name} — {a.unit === 'mile'
                                  ? `${(unitPreference === 'metric'
                                    ? convertCarbon(a.emission_factor, unitPreference) / convertDistance(1, unitPreference)
                                    : convertCarbon(a.emission_factor, unitPreference)).toFixed(2)} ${carbonUnit(unitPreference)}/${distanceUnit(unitPreference)}`
                                  : `${convertCarbon(a.emission_factor, unitPreference).toFixed(2)} ${carbonUnit(unitPreference)}/${a.unit}`}
                              </SelectItem>
                            ))}
                          </div>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Quantity {selected ? `(${displayUnit}s)` : ''}</Label>
                    <Input
                      type="number"
                      min="0"
                      step="any"
                      value={quantity}
                      onChange={e => setQuantity(e.target.value)}
                      placeholder={selected?.unit === 'mile' && unitPreference === 'metric' ? "e.g. 16.1" : "e.g. 10"}
                      className="rounded-xl"
                    />
                    {selected && <p className="text-xs text-muted-foreground">Factor: {displayFactor}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>Notes (optional)</Label>
                    <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Drove to campus" className="min-h-24 rounded-xl" />
                  </div>
                </div>

                {preview && (
                  <div className={`rounded-xl p-4 text-sm ${parseFloat(preview) === 0
                    ? 'bg-primary/10 text-primary'
                    : 'bg-destructive/10 text-destructive'
                  }`}>
                    <div className="flex items-center gap-2">
                      <Leaf className="h-4 w-4" />
                      <span>Estimated CO₂: <strong>{convertCarbon(Number(preview), unitPreference).toFixed(2)} {carbonUnit(unitPreference)}</strong></span>
                    </div>
                    {parseFloat(preview) === 0 && <p className="mt-1 text-xs">Zero emissions — great choice! 🌟</p>}
                  </div>
                )}

                <Button type="submit" className="w-full rounded-xl md:w-auto md:min-w-40" disabled={!selectedActivity || !quantity}>
                  Log Activity
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="type" className="mt-0">
              <form onSubmit={handleTypedSubmit} className="space-y-5">
                <div className="rounded-2xl bg-secondary/30 p-4 text-sm text-muted-foreground">
                  Type a quick activity like <span className="text-foreground">“I drove 8 km to college”</span> or paste a full day summary and Ecobot will extract multiple entries automatically.
                </div>

                <div className="space-y-2">
                  <Label>Describe Your Activity</Label>
                  <Textarea
                    value={typedSummary}
                    onChange={(e) => setTypedSummary(e.target.value)}
                    placeholder="Example: Today I drove 8 km to college, used my laptop for 6 hours, and ordered chicken biryani online..."
                    className="min-h-40 rounded-xl"
                  />
                </div>

                <Button type="submit" className="w-full rounded-xl md:w-auto md:min-w-40" disabled={!typedSummary.trim() || submittingTypedSummary}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  {submittingTypedSummary ? 'Processing...' : 'Analyze And Log'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
