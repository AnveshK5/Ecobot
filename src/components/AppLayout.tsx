import { ReactNode } from 'react';
import AppSidebar from './AppSidebar';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 md:ml-64 pt-16 md:pt-0 p-4 md:p-8 max-w-5xl">
        {children}
      </main>
    </div>
  );
}
