import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { House, ChartNoAxesCombined, Activity, Menu, X, UserRound, Settings, CreditCard, LogOut } from "lucide-react";
import { GarminIcon } from "@/components/icons/WearableIcons";
import { useNotifications } from "@/hooks/useNotifications";
import { useDecayNotificationInit } from "@/hooks/useDecayNotificationInit";
import { useAutoMetricSnapshot } from "@/hooks/useAutoMetricSnapshot";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { PastDueBanner } from "@/components/PastDueBanner";
import { trackProductEvent } from "@/lib/productAnalytics";
import { useAdaptiveCoachShadowRecorder } from "@/hooks/useAdaptiveCoachShadow";

interface AppShellProps {
  children: ReactNode;
}

const navItems = [
  {
    to: "/app",
    icon: House,
    label: "Home",
    matches: (path: string) =>
      path === "/app" ||
      path === "/app/reasoning-quality-impact" ||
      path === "/app/recovery-breakdown",
  },
  { to: "/neuro-lab", icon: Activity, label: "Lab", matches: (path: string) => path.startsWith("/neuro-lab") },
  {
    to: "/app/dashboard",
    icon: ChartNoAxesCombined,
    label: "Monitor",
    matches: (path: string) => path.startsWith("/app/dashboard") || path.startsWith("/app/report"),
  },
];

const menuItems = [
  { to: "/app/profile", icon: UserRound, label: "Profile" },
  { to: "/app/wearable", icon: ({ className }: { className?: string; strokeWidth?: number }) => <GarminIcon className={className} size={18} />, label: "Wearable" },
  { to: "/app/settings", icon: Settings, label: "Settings" },
  { to: "/app/subscription", icon: CreditCard, label: "Subscription" },
];

export function AppShell({ children }: AppShellProps) {
  const location = useLocation();
  const { permission, checkReminders } = useNotifications();
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const isMoreActive = menuItems.some((item) => location.pathname === item.to) ||
    location.pathname === "/app/adaptive-coach";
  
  // Initialize decay notifications on app load
  useDecayNotificationInit();
  
  // Auto-save daily metric snapshot (readiness, sharpness, recovery, RQ)
  useAutoMetricSnapshot();

  // Generate and persist explainable daily forecasts without changing any
  // active recommendation, plan, gating rule, or difficulty.
  useAdaptiveCoachShadowRecorder();

  useEffect(() => {
    setMenuOpen(false);
    trackProductEvent("app_route_viewed", {
      route: `${location.pathname}${location.search}`,
    });
  }, [location.pathname, location.search]);
  
  // Check for reminders on mount
  useEffect(() => {
    if (permission === "granted") {
      checkReminders();
    }
  }, [permission, checkReminders]);

  return (
    <div className="min-h-screen flex flex-col">
      <PaymentTestModeBanner />
      <PastDueBanner />
      <main className="flex-1 pb-28">
        {children}
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/30 bg-background/95 shadow-[0_-12px_32px_hsl(var(--background)/0.35)] backdrop-blur-xl safe-area-pb">
        <div className="mx-auto flex h-16 max-w-md items-center justify-around px-2">
          {navItems.map((item) => {
            const isActive = item.matches(location.pathname);
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative flex min-w-[56px] flex-col items-center justify-center gap-1 rounded-lg px-3 py-2 transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {isActive && <span className="absolute -top-1 h-px w-7 rounded-full bg-primary" />}
                <item.icon className="h-5 w-5" strokeWidth={1.75} />
                <span className="text-[9px] font-medium uppercase tracking-wider">{item.label}</span>
              </Link>
            );
          })}
          
          {/* Menu button */}
          <button
            type="button"
            aria-label={menuOpen ? "Close more menu" : "Open more menu"}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            onClick={() => setMenuOpen(!menuOpen)}
            className={cn(
              "relative flex min-w-[56px] flex-col items-center justify-center gap-1 rounded-lg px-3 py-2 transition-colors",
              menuOpen || isMoreActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {(menuOpen || isMoreActive) && (
              <span className="absolute -top-1 h-px w-7 rounded-full bg-primary" />
            )}
            {menuOpen ? <X className="h-5 w-5" strokeWidth={1.75} /> : <Menu className="h-5 w-5" strokeWidth={1.75} />}
            <span className="text-[9px] font-medium uppercase tracking-wider">More</span>
          </button>
        </div>
        
        {/* Bottom Menu Popup */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-full left-0 right-0 mx-4 mb-3"
            >
              <div className="mx-auto max-w-md overflow-hidden rounded-2xl border border-border/40 bg-card/95 shadow-2xl backdrop-blur-xl">
                <div className="border-b border-border/30 px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/65">More</p>
                </div>
                {menuItems.map((item) => {
                  const isActive = location.pathname === item.to;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 border-b border-border/30 px-4 py-3.5 transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-muted/50"
                      )}
                    >
                      <item.icon className="h-[18px] w-[18px]" strokeWidth={1.6} />
                      <span className="text-sm font-medium">{item.label}</span>
                    </Link>
                  );
                })}
                
                {/* Logout button */}
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-destructive transition-colors hover:bg-destructive/10"
                >
                  <LogOut className="h-[18px] w-[18px]" strokeWidth={1.6} />
                  <span className="text-sm font-medium">Sign Out</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </div>
  );
}
