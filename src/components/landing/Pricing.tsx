import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";

export function Pricing() {
  return (
    <section className="py-24 sm:py-32 relative">
      <div className="absolute inset-0 bg-gradient-subtle" />
      
      <div className="container px-6 relative">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-semibold mb-5">
            Upgrade to <span className="text-gradient">Premium</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            Unlock advanced cognitive protocols, deeper reasoning sequences, and weekly insights into your thinking patterns.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Free Tier */}
          <div className="p-8 rounded-xl bg-card border border-border animate-fade-in-up shadow-card">
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-2">Free</h3>
              <p className="text-muted-foreground text-sm">Core protocols to start training</p>
            </div>
            
            <div className="mb-8">
              <span className="text-4xl font-semibold">$0</span>
              <span className="text-muted-foreground">/forever</span>
            </div>

            <ul className="space-y-4 mb-8">
              {[
                "Focus Arena training area",
                "30s & 2min session durations",
                "3 sessions per day",
                "Basic SCI tracking",
              ].map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm">
                  <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Button asChild variant="outline" className="w-full min-h-[52px] rounded-xl">
              <Link to="/auth">Get Started</Link>
            </Button>
          </div>

          {/* Premium Tier */}
          <div className="p-8 rounded-xl bg-card border border-primary/25 shadow-glow animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <div className="flex items-start justify-between mb-8">
              <div>
                <h3 className="text-xl font-semibold mb-2">Premium</h3>
                <p className="text-muted-foreground text-sm">Complete cognitive training system</p>
              </div>
              <span className="px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary">
                Recommended
              </span>
            </div>
            
            <div className="mb-8">
              <span className="text-4xl font-semibold">$12</span>
              <span className="text-muted-foreground">/month</span>
            </div>

            <ul className="space-y-4 mb-8">
              {[
                "All 3 Neuro Lab areas",
                "Extended sessions (5min, 7min)",
                "Neuro Activation™ warm-up",
                "Unlimited daily sessions",
                "Full dashboard with trends",
                "Complete badge system",
              ].map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm">
                  <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Button asChild variant="hero" className="w-full min-h-[52px] rounded-xl">
              <Link to="/auth">Start Free Trial</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
