import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="container px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <span className="text-sm font-bold text-primary-foreground">N</span>
            </div>
            <span className="text-lg font-semibold">NeuroLoop Pro</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <a href="#protocols" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Protocols
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Insights
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Premium
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link to="/auth">Login</Link>
            </Button>
            <Button asChild variant="hero" size="sm">
              <Link to="/auth">Start Free</Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
