import { Button } from "@/components/ui/button";
import { Check, Crown, Zap } from "lucide-react";
import { Link } from "react-router-dom";

export function Pricing() {
  return (
    <section className="py-24 sm:py-32 relative">
      <div className="absolute inset-0 bg-gradient-subtle" />
      
      <div className="container px-6 relative">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-semibold mb-5">
            Choose Your <span className="text-gradient">Access</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            Select the depth of cognitive insight and reporting that matches your needs.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Free Tier */}
          <div className="p-8 rounded-xl bg-card border border-border animate-fade-in-up shadow-card">
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-2">Free</h3>
              <p className="text-muted-foreground text-sm">Introductory system access</p>
            </div>
            
            <div className="mb-8">
              <span className="text-4xl font-semibold">$0</span>
              <span className="text-muted-foreground">/forever</span>
            </div>

            <ul className="space-y-4 mb-8">
              {[
                "2 daily cognitive sessions",
                "Introductory S1 & S2 access",
                "Limited Neuro Lab protocols",
                "Basic progress tracking",
                "Standard accuracy modeling",
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
          <div className="p-8 rounded-xl bg-card border border-primary/25 shadow-glow animate-fade-in-up relative" style={{ animationDelay: "0.1s" }}>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                BEST VALUE
              </span>
            </div>
            
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-primary" />
                <h3 className="text-xl font-semibold">Premium</h3>
              </div>
              <p className="text-muted-foreground text-sm">Complete cognitive system</p>
            </div>
            
            <div className="mb-8">
              <span className="text-4xl font-semibold">$11.99</span>
              <span className="text-muted-foreground">/month</span>
            </div>

            <ul className="space-y-4 mb-8">
              {[
                "Unlimited daily sessions",
                "Full S1 & S2 protocols",
                "Full Neuro Lab access",
                "Enhanced cognitive accuracy",
                "Monthly Cognitive Report",
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

          {/* Pro Tier */}
          <div className="p-8 rounded-xl bg-card border border-border shadow-card animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-5 h-5 text-muted-foreground" />
                <h3 className="text-xl font-semibold">Pro</h3>
              </div>
              <p className="text-muted-foreground text-sm">Advanced insight layer</p>
            </div>
            
            <div className="mb-8">
              <span className="text-4xl font-semibold">$16.99</span>
              <span className="text-muted-foreground">/month</span>
            </div>

            <ul className="space-y-4 mb-8">
              {[
                "Everything in Premium",
                "On-demand Cognitive Reports",
                "Advanced trend analytics",
                "Priority support",
                "Early access to features",
              ].map((feature, i) => (
                <li key={feature} className="flex items-start gap-3 text-sm">
                  <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span className={i === 1 ? "font-medium" : ""}>{feature}</span>
                </li>
              ))}
            </ul>

            <Button asChild variant="outline" className="w-full min-h-[52px] rounded-xl">
              <Link to="/auth">Start Free Trial</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
