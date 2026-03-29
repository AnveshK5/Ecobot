import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAppData } from "@/hooks/useAppData";

export default function ProtectedRoute() {
  const { isAuthenticated, loading, authLoading } = useAppData();
  const location = useLocation();

  if (!isAuthenticated && !authLoading) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (loading && isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="rounded-2xl border border-border bg-card px-6 py-4 text-sm text-muted-foreground shadow-sm">
          Loading your account...
        </div>
      </div>
    );
  }

  return <Outlet />;
}
