import { useEffect } from "react";
import { Shield, UserRound } from "lucide-react";
import { useAppData } from "@/hooks/useAppData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminPage() {
  const {
    currentUser,
    adminUsers,
    adminUserDetails,
    adminLoading,
    loadAdminUsers,
    loadAdminUserDetails
  } = useAppData();

  useEffect(() => {
    if (currentUser?.is_admin) {
      void loadAdminUsers();
    }
  }, [currentUser?.is_admin, loadAdminUsers]);

  if (!currentUser?.is_admin) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        Admin access is required to view this page.
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4 text-primary" />
            User Directory
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {adminUsers.map((user) => (
            <Button
              key={user.id}
              variant={adminUserDetails?.id === user.id ? "default" : "outline"}
              className="h-auto w-full justify-start px-4 py-3 text-left"
              onClick={() => void loadAdminUserDetails(user.id)}
            >
              <div>
                <p className="font-medium">{user.name}</p>
                <p className="text-xs opacity-80">{user.email}</p>
                <p className="mt-1 text-[11px] opacity-70">
                  {user.counts.activities} activities · {user.counts.chatLogs} chats
                </p>
              </div>
            </Button>
          ))}
          {!adminUsers.length && (
            <p className="text-sm text-muted-foreground">
              {adminLoading ? "Loading users..." : "No users found."}
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserRound className="h-4 w-4 text-primary" />
            User Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {adminUserDetails ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl bg-secondary/40 p-4">
                  <p className="text-xs text-muted-foreground">Name</p>
                  <p className="mt-1 font-medium">{adminUserDetails.name}</p>
                </div>
                <div className="rounded-xl bg-secondary/40 p-4">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="mt-1 font-medium break-all">{adminUserDetails.email}</p>
                </div>
                <div className="rounded-xl bg-secondary/40 p-4">
                  <p className="text-xs text-muted-foreground">Units</p>
                  <p className="mt-1 font-medium">{adminUserDetails.preferences?.units ?? "metric"}</p>
                </div>
                <div className="rounded-xl bg-secondary/40 p-4">
                  <p className="text-xs text-muted-foreground">Role</p>
                  <p className="mt-1 font-medium">{adminUserDetails.role === "SUPERUSER" ? "Superuser" : "User"}</p>
                </div>
              </div>

              <section className="space-y-3">
                <h2 className="text-sm font-semibold">Activities</h2>
                <div className="space-y-2">
                  {adminUserDetails.activities.map((activity) => (
                    <div key={activity.id} className="rounded-xl bg-secondary/30 px-4 py-3">
                      <p className="text-sm font-medium">{activity.activity.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.carbonEmission.toFixed(2)} kg CO2 · {new Date(activity.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                  {!adminUserDetails.activities.length && (
                    <p className="text-sm text-muted-foreground">No activity logs.</p>
                  )}
                </div>
              </section>

              <section className="space-y-3">
                <h2 className="text-sm font-semibold">Chat History</h2>
                <div className="space-y-2">
                  {adminUserDetails.chatLogs.map((chat) => (
                    <div key={chat.id} className="rounded-xl bg-secondary/30 px-4 py-3">
                      <p className="text-sm font-medium">{chat.message}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{chat.response}</p>
                    </div>
                  ))}
                  {!adminUserDetails.chatLogs.length && (
                    <p className="text-sm text-muted-foreground">No chat messages.</p>
                  )}
                </div>
              </section>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              {adminLoading ? "Loading user..." : "Click a user name to inspect their data."}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
