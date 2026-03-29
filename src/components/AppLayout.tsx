import { ReactNode } from 'react';
import AppSidebar from './AppSidebar';
import UpgradePromptDialog from './UpgradePromptDialog';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <UpgradePromptDialog />
      <main className="min-w-0 flex-1 md:ml-64">
        <div className="mx-auto w-full max-w-7xl px-4 pb-8 pt-20 sm:px-6 md:px-8 md:pt-8 xl:px-10">
          {children}
        </div>
      </main>
    </div>
  );
}
