import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppDataProvider } from "./hooks/useAppData";
import AppLayout from "./components/AppLayout";
import AuthLayout from "./components/AuthLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardPage from "./pages/DashboardPage";
import AddActivityPage from "./pages/AddActivityPage";
import HistoryPage from "./pages/HistoryPage";
import ChatPage from "./pages/ChatPage";
import TasksPage from "./pages/TasksPage";
import PreferencesPage from "./pages/PreferencesPage";
import AdminPage from "./pages/AdminPage";
import UpgradePage from "./pages/UpgradePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppDataProvider>
          <Routes>
            <Route
              path="/login"
              element={
                <AuthLayout>
                  <LoginPage />
                </AuthLayout>
              }
            />
            <Route
              path="/register"
              element={
                <AuthLayout>
                  <RegisterPage />
                </AuthLayout>
              }
            />
            <Route element={<ProtectedRoute />}>
              <Route
                path="/"
                element={
                  <AppLayout>
                    <DashboardPage />
                  </AppLayout>
                }
              />
              <Route
                path="/add"
                element={
                  <AppLayout>
                    <AddActivityPage />
                  </AppLayout>
                }
              />
              <Route
                path="/tasks"
                element={
                  <AppLayout>
                    <TasksPage />
                  </AppLayout>
                }
              />
              <Route
                path="/history"
                element={
                  <AppLayout>
                    <HistoryPage />
                  </AppLayout>
                }
              />
              <Route
                path="/chat"
                element={
                  <AppLayout>
                    <ChatPage />
                  </AppLayout>
                }
              />
              <Route
                path="/upgrade"
                element={
                  <AppLayout>
                    <UpgradePage />
                  </AppLayout>
                }
              />
              <Route
                path="/preferences"
                element={
                  <AppLayout>
                    <PreferencesPage />
                  </AppLayout>
                }
              />
              <Route
                path="/admin"
                element={
                  <AppLayout>
                    <AdminPage />
                  </AppLayout>
                }
              />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppDataProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
