import { useState, useRef, useEffect } from 'react';
import { useAppData } from '@/hooks/useAppData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Bot, Send, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const quickActions = [
  "I drove 10 miles",
  "Remind me to study at 6 PM",
  "I walked 3 miles",
  "I ate beef 0.5 kg",
];

export default function ChatPage() {
  const { chatLog, sendChatMessage } = useAppData();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [chatLog]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendChatMessage(input.trim());
    setInput('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-3xl animate-in fade-in duration-500">
      <div className="mb-4">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">EcoMind AI Assistant</h1>
        <p className="text-muted-foreground mt-1 text-sm">Log activities, set reminders, get eco tips — just chat naturally.</p>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden border-none shadow-lg">
        <CardHeader className="border-b border-border py-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div>
              <span className="font-semibold">EcoMind AI</span>
              <span className="text-xs text-muted-foreground ml-2">Online</span>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {chatLog.map((msg, i) => (
            <div
              key={msg.chat_id}
              className={cn(
                'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm animate-in slide-in-from-bottom-2 duration-300',
                msg.sender === 'user'
                  ? 'ml-auto bg-primary text-primary-foreground rounded-br-md'
                  : 'bg-secondary text-secondary-foreground rounded-bl-md'
              )}
              style={{ animationDelay: `${i * 30}ms` }}
            >
              {msg.message}
              <div className={cn(
                'text-[10px] mt-1 opacity-60',
                msg.sender === 'user' ? 'text-right' : ''
              )}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
        </CardContent>

        {/* Quick Actions */}
        <div className="px-4 py-2 border-t border-border/50 flex gap-2 overflow-x-auto">
          {quickActions.map(action => (
            <button
              key={action}
              onClick={() => { sendChatMessage(action); }}
              className="shrink-0 text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              <Sparkles className="h-3 w-3 inline mr-1" />{action}
            </button>
          ))}
        </div>

        <div className="border-t border-border p-3 flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Try 'I drove 10 miles' or 'Remind me to study at 6 PM'..."
            className="rounded-xl"
          />
          <Button onClick={handleSend} size="icon" className="rounded-xl shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
