import { ReactNode, useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Home, LayoutDashboard, Activity, Menu, X, User, Settings, CreditCard, LogOut } from "lucide-react";
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
import type { AdaptiveCoachPassiveState } from "@/hooks/useAdaptiveCoachShadow";
import { useAdaptiveFocusShadowRecorder } from "@/hooks/useAdaptiveFocusCoach";
import { useSubscription } from "@/hooks/useSubscription";
import { PremiumPaywall } from "@/components/app/PremiumPaywall";
import { FIRST_PROTOCOL_PAYWALL_PENDING_KEY } from "@/lib/productAnalytics";
import { preloadAppRoute } from "@/lib/routePreload";

interface AppShellProps {
  children: ReactNode | ((coachState: AdaptiveCoachPassiveState) => ReactNode);
}

const navItems = [
  { to: "/app", icon: Home, label: "Home" },
  { to: "/neuro-lab", icon: Activity, label: "Lab" },
  { to: "/app/dashboard", icon: LayoutDashboard, label: "Monitor" },
];

const menuItems = [
  { to: "/app/profile", icon: User, label: "Profile" },
  { to: "/app/wearable", icon: ({ className }: { className?: string }) => <GarminIcon className={className} size={20} />, label: "Health & wearables" },
  { to: "/app/settings", icon: Settings, label: "Settings" },
  { to: "/app/subscription", icon: CreditCard, label: "Subscription" },
];

function DeferredAppIntelligence({
  onCoachState,
}: {
  onCoachState: (state: AdaptiveCoachPassiveState) => void;
}) {
  useAutoMetricSnapshot();
  const coachState = useAdaptiveCoachShadowRecorder();
  useAdaptiveFocusShadowRecorder(coachState);

  // The hook returns a new object each render, so publish upward only when the
  // serialized payload actually changes. Otherwise the parent setState feeds
  // back into this effect and the app render-loops (frozen UI).
  const lastPublishedRef = useRef<string | null>(null);
  useEffect(() => {
    if (coachState.isLoading) return;
    const signature = JSON.stringify(coachState.passiveFeatures ?? null);
    if (lastPublishedRef.current === signature) return;
    lastPublishedRef.current = signature;
    onCoachState(coachState);
  }, [coachState, onCoachState]);

  return null;
}

export function AppShell({ children }: AppShellProps) {
  const isNativeApp = Capacitor.isNativePlatform();
  const location = useLocation();
  const { permission, checkReminders } = useNotifications();
  const { logout } = useAuth();
  const subscription = useSubscription();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showFirstProtocolPaywall, setShowFirstProtocolPaywall] = useState(false);
  const [backgroundReady, setBackgroundReady] = useState(false);
  const [adaptiveCoachState, setAdaptiveCoachState] = useState<AdaptiveCoachPassiveState>({
    passiveFeatures: null,
    isLoading: true,
  });
  
  // Initialize decay notifications on app load
  useDecayNotificationInit();
  
  // Snapshot persistence and the 90-day coach analysis are background work.
  // Give the active route and its core metrics the first render/network slot.
  useEffect(() => {
    const timeoutId = window.setTimeout(() => setBackgroundReady(true), 450);
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    trackProductEvent("app_route_viewed", {
      route: `${location.pathname}${location.search}`,
    });
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (subscription.loading) return;
    if (subscription.tier !== "free") {
      localStorage.removeItem(FIRST_PROTOCOL_PAYWALL_PENDING_KEY);
      return;
    }
    if (location.pathname === "/app/subscription") return;
    if (localStorage.getItem(FIRST_PROTOCOL_PAYWALL_PENDING_KEY) === "true") {
      localStorage.removeItem(FIRST_PROTOCOL_PAYWALL_PENDING_KEY);
      setShowFirstProtocolPaywall(true);
    }
  }, [location.pathname, subscription.loading, subscription.tier]);
  
  // Check for reminders on mount
  useEffect(() => {
    if (permission === "granted") {
      checkReminders();
    }
  }, [permission, checkReminders]);

  return (
    <div className="app-safe-frame min-h-[100dvh] flex flex-col bg-background">
      {backgroundReady && (
        <DeferredAppIntelligence onCoachState={setAdaptiveCoachState} />
      )}
      {!isNativeApp && (
        <>
          <PaymentTestModeBanner />
          <PastDueBanner />
        </>
      )}
      <main className="flex-1 pb-28">
        {typeof children === "function" ? children(adaptiveCoachState) : children}
      </main>

      {/* Bottom navigation */}
      <nav className="app-safe-bottom fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border/30">
        <div className="flex items-center justify-around h-14 max-w-md mx-auto px-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-current={isActive ? "page" : undefined}
                onPointerDown={() => preloadAppRoute(item.to)}
                onFocus={() => preloadAppRoute(item.to)}
                className={cn(
                  "flex min-w-[52px] flex-col items-center justify-center gap-0.5 rounded-lg px-3 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground/30",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground/65 hover:text-foreground/85"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[9px] font-medium uppercase tracking-wider">{item.label}</span>
              </Link>
            );
          })}
          
          {/* Menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            className={cn(
              "flex min-w-[52px] flex-col items-center justify-center gap-0.5 rounded-lg px-3 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground/30",
              menuOpen || menuItems.some(item => location.pathname === item.to || (item.to === "/brain-science" && location.pathname === "/brain-science"))
                ? "text-foreground"
                : "text-muted-foreground/65 hover:text-foreground/85"
            )}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
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
              className="absolute bottom-full left-0 right-0 mb-2 mx-4"
            >
              <div className="bg-card border border-border rounded-xl shadow-lg overflow-hidden max-w-md mx-auto">
                {menuItems.map((item) => {
                  const isActive = location.pathname === item.to;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      aria-current={isActive ? "page" : undefined}
                      onClick={() => setMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3.5 transition-colors border-b border-border/30",
                        isActive
                          ? "bg-white/[0.06] text-foreground"
                          : "text-muted-foreground hover:bg-white/[0.035] hover:text-foreground"
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </Link>
                  );
                })}
                
                {/* Logout button */}
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                  className="flex items-center gap-3 px-4 py-3.5 transition-colors w-full text-left text-red-400 hover:bg-red-500/10"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-sm font-medium">Sign Out</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <PremiumPaywall
        open={showFirstProtocolPaywall}
        onOpenChange={setShowFirstProtocolPaywall}
        feature="first-protocol"
      />
    </div>
  );
}
