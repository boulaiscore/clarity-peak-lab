import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="py-12 border-t border-border">
      <div className="container px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <span className="text-foreground font-semibold text-sm">N</span>
            </div>
            <span className="font-semibold tracking-tight">NeuroLoop Pro</span>
          </div>

          <nav className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
            <a href="#how-it-works" className="hover:text-foreground transition-colors">
              How It Works
            </a>
            <Link to="/auth" className="hover:text-foreground transition-colors">
              Sign In
            </Link>
            <Link to="/auth" className="hover:text-foreground transition-colors">
              Get Started
            </Link>
            <Link to="/privacy-policy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
          </nav>

          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} SuperHuman Labs
          </p>
        </div>
        
        {/* Tagline */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            Train your mind for elite reasoning.
          </p>
        </div>
      </div>
    </footer>
  );
}
