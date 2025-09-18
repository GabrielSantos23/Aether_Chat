import { AccountCard } from "@/components/AccountCard";
import { SingleFieldForm } from "@/components/single-field-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useSession, signOut } from "next-auth/react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Globe, MapPin, Clock } from "lucide-react";
import { UserProfileCards } from "@/components/UserProfileCards";
import { useMutation, useQuery } from "convex/react";
import { api } from "@aether-ai-2/backend/convex/_generated/api";
import { SessionItem } from "@/lib/types";

function getUsername(user?: { name?: string; username?: string }) {
  return user?.name || user?.username || "";
}

function getDeviceInfo(sessionItem: SessionItem) {
  if (sessionItem.platform) {
    return `${sessionItem.platform} Device`;
  }
  if (sessionItem.userAgent) {
    if (sessionItem.userAgent.includes("Mobile")) return "Mobile Device";
    if (sessionItem.userAgent.includes("Chrome")) return "Chrome Browser";
    if (sessionItem.userAgent.includes("Firefox")) return "Firefox Browser";
    if (sessionItem.userAgent.includes("Safari")) return "Safari Browser";
    return "Desktop Browser";
  }
  return "Web Session";
}

function getDeviceIcon(sessionItem: SessionItem) {
  if (sessionItem.platform === "Windows") return "🪟";
  if (sessionItem.platform === "macOS") return "🍎";
  if (sessionItem.platform === "Linux") return "🐧";
  if (sessionItem.platform === "Android") return "🤖";
  if (sessionItem.platform === "iOS") return "📱";
  return <Globe className="size-4" />;
}

function getRelativeTime(timestamp: number) {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days > 1 ? "s" : ""} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  } else {
    return "Just now";
  }
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AccountDashboard() {
  const { data: session, status, update } = useSession();
  const sessions = useQuery(api.users.getMySessions) ?? [];
  const revokeSession = useMutation(api.users.revokeSession);
  const updateMyName = useMutation(api.users.updateMyName);

  const handleUsernameUpdate = async (value: string) => {
    if (!session?.user) return;

    try {
      await updateMyName({ name: value });
      await update({
        ...session,
        user: {
          ...session.user,
          name: value,
        },
      });
      toast.success("Username updated");
    } catch (error) {
      toast.error("Failed to update username");
      console.error("Error updating username:", error);
    }
  };

  return (
    <div className="flex flex-col gap-y-10">
      <title>Account | Aether</title>

      {!session ? (
        <AccountCard
          title="Anonymous"
          className=""
          description="As an anonymous user, your data may be deleted or lost at any time. Login to keep your data safe."
        >
          <div className="rounded-xl border bg-card">
            <div className="p-4 flex flex-col gap-2 ">
              <h3>Not logged in</h3>
              <p>
                You are currently an anonymous user. Your chats, messages and
                preferences may be deleted in the future. To save your data,
                create an account or login.
              </p>
            </div>
            <div className="flex px-4 py-3 bg-sidebar w-full justify-end border-t rounded-b-xl">
              <Button variant="default" size="sm" asChild>
                <Link to="/login">Login</Link>
              </Button>
            </div>
          </div>
        </AccountCard>
      ) : null}

      {session && (
        <AccountCard title="Profile" description="Update your account details">
          <SingleFieldForm
            label="Username"
            description="What do you want to be called?"
            footerMessage="Please use 32 characters or less."
            defaultValue={getUsername(session.user)}
            renderInput={({ onChange, value }) => (
              <Input
                id="field-input"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Enter your username"
              />
            )}
            onSubmit={handleUsernameUpdate}
          />
        </AccountCard>
      )}

      <Separator />

      {session && (
        <AccountCard title="Sessions" description="Manage your sessions">
          <div className="flex flex-col gap-4">
            {sessions.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <p>No active sessions found</p>
              </div>
            ) : (
              sessions.map((sessionItem: SessionItem) => {
                const isCurrentSession = false;
                const deviceInfo = getDeviceInfo(sessionItem);
                const deviceIcon = getDeviceIcon(sessionItem);

                return (
                  <div
                    key={sessionItem.id}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                      isCurrentSession
                        ? "bg-primary/10 border-primary/20"
                        : "bg-muted/50 border-foreground/10 hover:bg-muted/80"
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className={`flex items-center justify-center w-8 h-8 rounded-md ${
                          isCurrentSession
                            ? "bg-primary/20 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {deviceIcon}
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">
                            {deviceInfo}
                          </span>
                          {isCurrentSession && (
                            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                              Current
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="size-3" />
                            <span>
                              {getRelativeTime(sessionItem.createdAt)}
                            </span>
                          </div>
                          {sessionItem.ipAddress && (
                            <div className="flex items-center gap-1">
                              <MapPin className="size-3" />
                              <span>{sessionItem.ipAddress}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <span>
                              Expires:{" "}
                              {formatDate(new Date(sessionItem.expires))}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {!isCurrentSession && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={async () => {
                          try {
                            await revokeSession({
                              sessionToken: sessionItem.sessionToken,
                            });
                            toast.success("Session revoked");
                          } catch (e) {
                            toast.error("Failed to revoke session");
                          }
                        }}
                      >
                        <span>Revoke</span>
                      </Button>
                    )}

                    {isCurrentSession && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          signOut();
                        }}
                      >
                        <span>Logout</span>
                      </Button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </AccountCard>
      )}
    </div>
  );
}
