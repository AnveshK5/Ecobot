import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppDataProvider } from "./hooks/useAppData";
import AppLayout from "./components/AppLayout";
import DashboardPage from "./pages/DashboardPage";
import AddActivityPage from "./pages/AddActivityPage";
import HistoryPage from "./pages/HistoryPage";
import ChatPage from "./pages/ChatPage";
import TasksPage from "./pages/TasksPage";
import PreferencesPage from "./pages/PreferencesPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppDataProvider>
          <AppLayout>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/add" element={<AddActivityPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/preferences" element={<PreferencesPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </AppDataProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
