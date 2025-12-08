import { Button } from "@/components/ui/button";
import { Check, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export function Pricing() {
  return (
    <section className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      
      <div className="container px-4 relative">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Start <span className="text-gradient">Free</span>, Go <span className="text-gradient">Premium</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Get started with essential protocols. Upgrade when you're ready for the full mental edge.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Tier */}
          <div className="p-8 rounded-2xl bg-card border border-border animate-fade-in-up">
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2">Free</h3>
              <p className="text-muted-foreground text-sm">Essential protocols to get started</p>
            </div>
            
            <div className="mb-6">
              <span className="text-4xl font-bold">$0</span>
              <span className="text-muted-foreground">/forever</span>
            </div>

            <ul className="space-y-3 mb-8">
              {[
                "3 core protocol types",
                "30-second quick sessions",
                "Basic session tracking",
                "Simple insights",
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-sm">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Button asChild variant="outline" className="w-full">
              <Link to="/auth">Get Started</Link>
            </Button>
          </div>

          {/* Premium Tier */}
          <div className="p-8 rounded-2xl bg-card border border-primary/30 shadow-glow animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <div className="flex items-center gap-2 mb-6">
              <div>
                <h3 className="text-xl font-semibold mb-2">Premium</h3>
                <p className="text-muted-foreground text-sm">The complete mental edge toolkit</p>
              </div>
              <span className="ml-auto px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary">
                <Sparkles className="w-3 h-3 inline mr-1" />
                Popular
              </span>
            </div>
            
            <div className="mb-6">
              <span className="text-4xl font-bold">$12</span>
              <span className="text-muted-foreground">/month</span>
            </div>

            <ul className="space-y-3 mb-8">
              {[
                "All protocol types & durations",
                "Advanced 5-minute deep sessions",
                "Full Decision Pro framework",
                "Weekly performance insights",
                "Priority access to new protocols",
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-sm">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Button asChild variant="hero" className="w-full">
              <Link to="/auth">Start Free Trial</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
