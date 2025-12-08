import { ReactNode, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Home, LayoutDashboard, BarChart3, Crown, User, Bell, BellOff, Dumbbell } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";

interface AppShellProps {
  children: ReactNode;
}

const navItems = [
  { to: "/app", icon: Home, label: "Train" },
  { to: "/neuro-gym", icon: Dumbbell, label: "Gym" },
  { to: "/app/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/app/insights", icon: BarChart3, label: "Insights" },
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border/30">
        <div className="container px-4">
          <div className="flex items-center justify-between h-12">
            <div className="w-8" />
            <Link to="/app" className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-semibold text-[10px]">N</span>
              </div>
              <span className="font-semibold tracking-tight text-sm">NeuroLoop</span>
            </Link>
            <Link to="/app/install" className="w-8 flex justify-end">
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
      <main className="flex-1 pb-20">{children}</main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border/30 safe-area-pb">
        <div className="flex items-center justify-around h-14 max-w-md mx-auto px-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors min-w-[52px]",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[9px] font-medium uppercase tracking-wider">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}