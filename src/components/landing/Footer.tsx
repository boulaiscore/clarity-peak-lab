import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="py-16 border-t border-border">
      <div className="container px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <span className="text-sm font-bold text-primary-foreground">N</span>
              </div>
              <span className="text-lg font-semibold">NeuroLoop Pro</span>
            </div>
            <p className="text-muted-foreground text-sm">
              The mental longevity system for high-performing professionals.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="sm">
              <Link to="/auth">Login</Link>
            </Button>
            <Button asChild variant="hero" size="sm">
              <Link to="/auth">Start Free</Link>
            </Button>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© 2024 NeuroLoop Pro. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
