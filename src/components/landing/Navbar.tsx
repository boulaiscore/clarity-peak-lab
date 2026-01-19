import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { NavigationTabs } from "./NavigationTabs";
import { Menu, X } from "lucide-react";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close panels when scrolled changes
  useEffect(() => {
    if (scrolled && activeTab) {
      // Keep panel open even when scrolled
    }
  }, [scrolled, activeTab]);

  return (
    <>
      <nav 
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrolled || activeTab
            ? "bg-black/95 backdrop-blur-md" 
            : "bg-transparent"
        )}
      >
        <div className="container px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center" onClick={() => setActiveTab(null)}>
              <span className="text-white font-bold text-lg tracking-tight">NEUROLOOP</span>
            </Link>

            {/* Navigation Tabs */}
            <NavigationTabs activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden w-10 h-10 flex items-center justify-center text-white/70 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* CTA */}
            <Button 
              asChild 
              className="hidden lg:flex rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-6 h-10"
            >
              <Link to="/auth">Join Now</Link>
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-black/95 border-t border-white/5">
            <div className="container px-6 py-4 space-y-2">
              {["subscriptions", "how-it-works", "assessment", "why-neuroloop", "protocols"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left py-3 text-sm text-white/70 hover:text-white uppercase tracking-wider"
                >
                  {tab.replace(/-/g, " ")}
                </button>
              ))}
              <Link
                to="/auth"
                className="block w-full text-center py-3 mt-4 rounded-full bg-primary text-primary-foreground font-semibold"
                onClick={() => setMobileMenuOpen(false)}
              >
                Join Now
              </Link>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
