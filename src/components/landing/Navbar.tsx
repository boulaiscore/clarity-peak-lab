import { Button } from "@/components/ui/button";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleHowItWorksClick = () => {
    if (location.pathname === "/") {
      const element = document.getElementById('how-it-works');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate("/");
      setTimeout(() => {
        const element = document.getElementById('how-it-works');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };

  return (
    <nav 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled 
          ? "bg-black/90 backdrop-blur-md" 
          : "bg-transparent"
      )}
    >
      <div className="container px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo - minimal text only */}
          <Link to="/" className="flex items-center">
            <span className="text-white font-bold text-lg tracking-tight">NEUROLOOP</span>
          </Link>

          {/* Nav links - centered, minimal */}
          <div className="hidden md:flex items-center gap-10">
            <button 
              onClick={handleHowItWorksClick}
              className="text-sm text-white/70 hover:text-white transition-colors font-medium"
            >
              Technology
            </button>
            <Link 
              to="/brain-science" 
              className="text-sm text-white/70 hover:text-white transition-colors font-medium"
            >
              Science
            </Link>
            <Link 
              to="/auth" 
              className="text-sm text-white/70 hover:text-white transition-colors font-medium"
            >
              Sign In
            </Link>
          </div>

          {/* CTA - pill shaped, solid white */}
          <Button 
            asChild 
            className="rounded-full bg-white text-black hover:bg-white/90 font-semibold px-6 h-10"
          >
            <Link to="/auth">Join Now</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}
