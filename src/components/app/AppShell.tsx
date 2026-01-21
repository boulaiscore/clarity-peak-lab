import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Home, LayoutDashboard, Bell, BellOff, Activity, BookOpen, Sun, Moon, Menu, X, Layers, User, Settings, CreditCard, LogOut } from "lucide-react";
import { NeuroLoopWordmark } from "@/components/ui/NeuroLoopWordmark";
import { useNotifications } from "@/hooks/useNotifications";
import { useTheme } from "@/hooks/useTheme";
import { useDecayNotificationInit } from "@/hooks/useDecayNotificationInit";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

interface AppShellProps {
  children: ReactNode;
}

const navItems = [
  { to: "/app", icon: Home, label: "Home" },
  { to: "/neuro-lab", icon: Activity, label: "Lab" },
  { to: "/app/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/app/health", icon: Layers, label: "Health" },
];

const menuItems = [
  { to: "/app/profile", icon: User, label: "Profile" },
  { to: "/app/settings", icon: Settings, label: "Settings" },
  { to: "/app/subscription", icon: CreditCard, label: "Subscription" },
  { to: "/brain-science", icon: BookOpen, label: "Science" },
];

export function AppShell({ children }: AppShellProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { permission, isSupported, checkReminders } = useNotifications();
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Initialize decay notifications on app load
  useDecayNotificationInit();
  
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  
  const minSwipeDistance = 50;

  const currentIndex = navItems.findIndex(item => item.to === location.pathname);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && currentIndex < navItems.length - 1) {
      navigate(navItems[currentIndex + 1].to);
    }
    if (isRightSwipe && currentIndex > 0) {
      navigate(navItems[currentIndex - 1].to);
    }
  };

  // Check for reminders on mount
  useEffect(() => {
    if (permission === "granted") {
      checkReminders();
    }
  }, [permission]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border/30">
        <div className="container px-4">
          <div className="flex items-center justify-between h-12">
            {/* Theme toggle */}
            <button 
              onClick={toggleTheme}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted/50 transition-colors"
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
              ) : (
                <Moon className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
              )}
            </button>
            
            <Link to="/app" className="flex items-center gap-2">
              <NeuroLoopWordmark
                logoSize={24}
                logoClassName="text-primary"
                textClassName="font-semibold tracking-tight text-sm"
              />
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

      {/* Main content with swipe */}
      <main 
        className="flex-1 pb-20"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {children}
      </main>

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
          
          {/* Menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors min-w-[52px]",
              menuOpen || menuItems.some(item => location.pathname === item.to || (item.to === "/brain-science" && location.pathname === "/brain-science"))
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
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
                      onClick={() => setMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3.5 transition-colors border-b border-border/30",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-muted/50"
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
    </div>
  );
}