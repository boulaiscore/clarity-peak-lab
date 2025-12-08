import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Home, LayoutDashboard, BarChart3, Crown, User } from "lucide-react";

interface AppShellProps {
  children: ReactNode;
}

const navItems = [
  { to: "/app", icon: Home, label: "Train" },
  { to: "/app/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/app/insights", icon: BarChart3, label: "Insights" },
  { to: "/app/premium", icon: Crown, label: "Premium" },
  { to: "/app/account", icon: User, label: "Account" },
];

export function AppShell({ children }: AppShellProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container px-6">
          <div className="flex items-center justify-center h-14">
            <Link to="/app" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-primary flex items-center justify-center">
                <span className="text-foreground font-semibold text-xs">N</span>
              </div>
              <span className="font-semibold tracking-tight text-sm">NeuroLoop Pro</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 pb-24">{children}</main>

      {/* Bottom navigation - mobile optimized */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border safe-area-pb">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all min-w-[64px] touch-target",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive && "text-primary")} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
