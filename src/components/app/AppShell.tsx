import { ReactNode, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Home, LayoutDashboard, User, Bell, BellOff, Dumbbell, Crown } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { usePremiumGating } from "@/hooks/usePremiumGating";

interface AppShellProps {
  children: ReactNode;
}

const navItems = [
  { to: "/app", icon: Home, label: "Home" },
  { to: "/neuro-lab", icon: Dumbbell, label: "Lab" },
  { to: "/app/dashboard", icon: LayoutDashboard, label: "Progress" },
  { to: "/app/account", icon: User, label: "Account" },
];

export function AppShell({ children }: AppShellProps) {
  const location = useLocation();
  const { permission, isSupported, checkReminders } = useNotifications();
  const { isPremium } = usePremiumGating();

  useEffect(() => {
    if (permission === "granted") {
      checkReminders();
    }
  }, [permission]);

  return (
    <div className="min-h-screen min-h-[100dvh] bg-background flex flex-col">
      {/* Premium Header */}
      <header className="sticky top-0 z-50 glass-card border-b border-border/30">
        <div className="container px-4">
          <div className="flex items-center justify-between h-14">
            <div className="w-10" />
            <Link to="/app" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-gold flex items-center justify-center shadow-button">
                <span className="text-primary-foreground font-bold text-sm">N</span>
              </div>
              <span className="font-semibold tracking-tight text-base text-foreground">NeuroLoop</span>
              {isPremium && (
                <span className="text-[8px] px-2 py-0.5 bg-gradient-gold rounded-full text-primary-foreground font-bold uppercase tracking-wider">
                  Pro
                </span>
              )}
            </Link>
            <Link to="/app/install" className="w-10 h-10 flex items-center justify-center rounded-xl bg-muted/50 border border-border/50">
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

      {/* Premium Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 safe-area-pb">
        <div className="glass-card rounded-2xl shadow-soft border border-border/30 flex items-center justify-around h-[72px] max-w-md mx-auto px-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to || 
              (item.to === "/neuro-lab" && location.pathname.startsWith("/neuro-lab"));
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col items-center justify-center gap-1.5 px-4 py-2 rounded-xl transition-all duration-200 min-w-[64px] press-effect",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                  isActive ? "bg-primary/15 shadow-glow" : "hover:bg-muted/50"
                )}>
                  <item.icon className={cn("w-5 h-5", isActive && "drop-shadow-sm")} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={cn(
                  "text-[10px] font-medium tracking-wide",
                  isActive && "text-primary"
                )}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
