import { AppShell } from "@/components/app/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Check, Crown, Zap, Brain, Scale, BarChart3, Sparkles } from "lucide-react";

const benefits = [
  {
    icon: Zap,
    title: "Advanced Stress Protocols",
    description: "Longer, more structured protocols for deep stress relief.",
  },
  {
    icon: Brain,
    title: "Deep Clarity Sessions",
    description: "5-minute sessions tailored for high-stakes work preparation.",
  },
  {
    icon: Scale,
    title: "Full Decision Pro Framework",
    description: "Complete decision-making workflow for complex choices.",
  },
  {
    icon: BarChart3,
    title: "Weekly Performance Reports",
    description: "Personalized insights based on your usage patterns.",
  },
  {
    icon: Sparkles,
    title: "Priority Access",
    description: "First access to new protocol types and features.",
  },
];

const Premium = () => {
  const { user, upgradeToPremium } = useAuth();
  const isPremium = user?.subscriptionStatus === "premium";

  const handleUpgrade = () => {
    upgradeToPremium();
    toast({
      title: "Welcome to Premium!",
      description: "You now have access to all premium features.",
    });
  };

  return (
    <AppShell>
      <div className="container px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {isPremium ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-6">
                <Crown className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-3xl font-bold mb-4">You're Premium</h1>
              <p className="text-muted-foreground text-lg mb-8">
                You have full access to all NeuroLoop Pro features.
              </p>
              <Card variant="glow" className="p-6 text-left">
                <h3 className="font-semibold mb-4">Your Premium Benefits</h3>
                <ul className="space-y-3">
                  {benefits.map((benefit) => (
                    <li key={benefit.title} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <span className="font-medium">{benefit.title}</span>
                        <p className="text-sm text-muted-foreground">{benefit.description}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                  <Crown className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-primary">Premium</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold mb-4">
                  Unlock Your <span className="text-gradient">Mental Edge</span>
                </h1>
                <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                  The free tier gives you a taste. Premium is for serious performers who demand the best from their brain.
                </p>
              </div>

              {/* Benefits */}
              <div className="grid md:grid-cols-2 gap-4 mb-12">
                {benefits.map((benefit) => (
                  <Card key={benefit.title} variant="elevated" className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <benefit.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">{benefit.title}</h3>
                        <p className="text-sm text-muted-foreground">{benefit.description}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Pricing */}
              <Card variant="glow" className="p-8 text-center">
                <h2 className="text-xl font-semibold mb-2">Your brain is your most valuable asset</h2>
                <p className="text-muted-foreground mb-6">Treat it like one.</p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button onClick={handleUpgrade} variant="hero" size="lg">
                    Go Premium – $12/month
                  </Button>
                  <Button onClick={handleUpgrade} variant="outline" size="lg">
                    Annual – $99/year
                    <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      Save 31%
                    </span>
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground mt-6">
                  Cancel anytime. No questions asked.
                </p>
              </Card>

              {/* Quote */}
              <div className="mt-12 text-center">
                <blockquote className="text-lg text-muted-foreground italic">
                  "Your brain is your edge. Protect your mental longevity."
                </blockquote>
              </div>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
};

export default Premium;
