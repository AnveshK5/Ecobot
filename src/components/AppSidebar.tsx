import { Leaf, BarChart3, PlusCircle, MessageSquare, Settings, History, ListTodo, Menu, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const links = [
  { to: '/', icon: BarChart3, label: 'Dashboard' },
  { to: '/add', icon: PlusCircle, label: 'Add Activity' },
  { to: '/tasks', icon: ListTodo, label: 'Tasks' },
  { to: '/history', icon: History, label: 'History' },
  { to: '/chat', icon: MessageSquare, label: 'AI Chat' },
  { to: '/preferences', icon: Settings, label: 'Preferences' },
];

export default function AppSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Header */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b border-border bg-card px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <Leaf className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold tracking-tight">EcoMind</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-1.5 rounded-lg hover:bg-secondary">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-border bg-card transition-transform duration-300',
        'md:translate-x-0',
        mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      )}>
        <div className="flex items-center gap-2.5 border-b border-border px-6 py-5">
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Leaf className="h-5 w-5 text-primary" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight">EcoMind</span>
            <p className="text-[10px] text-muted-foreground -mt-0.5">AI Carbon Tracker</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-muted-foreground hover:bg-secondary hover:text-secondary-foreground'
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-border px-4 py-4">
          <div className="rounded-xl bg-primary/5 p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">🌍 Did you know?</p>
            <p className="mt-1">The average person produces about 4 tons of CO₂ per year.</p>
          </div>
        </div>
      </aside>
    </>
  );
}
