import { ReactNode, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Home, LayoutDashboard, User, Bell, BellOff, Dumbbell } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";

interface AppShellProps {
  children: ReactNode;
}

const navItems = [
  { to: "/app", icon: Home, label: "Train" },
  { to: "/neuro-lab", icon: Dumbbell, label: "Lab" },
  { to: "/app/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/app/account", icon: User, label: "Account" },
];

export function AppShell({ children }: AppShellProps) {
  const location = useLocation();
  const { permission, isSupported, checkReminders } = useNotifications();

  // Check for reminders on mount
  useEffect(() => {
    if (permission === "granted") {
      checkReminders();
    }
  }, [permission]);

  return (
    <div className="min-h-screen bg-gradient-page flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border/30 shadow-sm">
        <div className="container px-4">
          <div className="flex items-center justify-between h-14">
            <div className="w-10" />
            <Link to="/app" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-button">
                <span className="text-primary-foreground font-bold text-xs">N</span>
              </div>
              <span className="font-semibold tracking-tight text-base">NeuroLoop</span>
            </Link>
            <Link to="/app/install" className="w-10 h-10 flex items-center justify-center rounded-full bg-card shadow-card">
              {isSupported && permission !== "granted" ? (
                <BellOff className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Bell className={cn(
                  "w-4 h-4",
                  permission === "granted" ? "text-primary" : "text-muted-foreground"
                )} />
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 pb-24">{children}</main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 safe-area-pb">
        <div className="bg-card/95 backdrop-blur-xl rounded-2xl shadow-soft border border-border/30 flex items-center justify-around h-16 max-w-md mx-auto px-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all duration-200 min-w-[60px]",
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive && "scale-110")} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
