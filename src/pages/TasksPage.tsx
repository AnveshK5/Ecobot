import { useState } from 'react';
import { useAppData } from '@/hooks/useAppData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ListTodo, Plus, Trash2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function TasksPage() {
  const { tasks, addTask, toggleTask, deleteTask } = useAppData();
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const taskTime = time ? new Date(time).toISOString() : new Date().toISOString();
    addTask(title.trim(), taskTime);
    toast.success('Task added!');
    setTitle('');
    setTime('');
  };

  const pending = tasks.filter(t => !t.completed).sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  const completed = tasks.filter(t => t.completed);

  return (
    <div className="max-w-2xl space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Tasks & Reminders</h1>
        <p className="text-muted-foreground mt-1 text-sm">Stay productive and eco-conscious.</p>
      </div>

      {/* Add Task */}
      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="h-4 w-4 text-primary" /> New Task
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="What do you need to do?"
              className="flex-1 rounded-xl"
            />
            <Input
              type="datetime-local"
              value={time}
              onChange={e => setTime(e.target.value)}
              className="rounded-xl sm:w-52"
            />
            <Button type="submit" className="rounded-xl" disabled={!title.trim()}>
              Add
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Pending */}
      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ListTodo className="h-4 w-4 text-accent" /> Pending ({pending.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pending.length === 0 ? (
            <p className="text-muted-foreground text-sm">All clear! 🎉</p>
          ) : (
            <div className="space-y-2">
              {pending.map(task => (
                <div key={task.task_id} className="flex items-center gap-3 rounded-xl bg-secondary/40 px-4 py-3 group hover:bg-secondary/70 transition-colors">
                  <Checkbox
                    checked={false}
                    onCheckedChange={() => { toggleTask(task.task_id); toast.success('Task completed! 🎉'); }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{task.title}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(task.time).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => deleteTask(task.task_id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Completed */}
      {completed.length > 0 && (
        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="text-base text-muted-foreground">Completed ({completed.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {completed.map(task => (
                <div key={task.task_id} className="flex items-center gap-3 rounded-xl px-4 py-3 opacity-60">
                  <Checkbox checked onCheckedChange={() => toggleTask(task.task_id)} />
                  <p className="text-sm line-through flex-1 truncate">{task.title}</p>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteTask(task.task_id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
