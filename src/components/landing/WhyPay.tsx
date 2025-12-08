import { TrendingUp, Clock, Brain, Shield } from "lucide-react";

const reasons = [
  {
    icon: TrendingUp,
    title: "Fewer Bad Decisions",
    stat: "Better",
    description: "Structured frameworks that cut through emotional noise and cognitive biases.",
  },
  {
    icon: Clock,
    title: "Performance When It Matters",
    stat: "Faster",
    description: "Peak clarity in meetings, deep work, and high-stakes moments.",
  },
  {
    icon: Brain,
    title: "Mental Longevity",
    stat: "Sharper",
    description: "Keep your brain sharp for longer. Protect your most valuable asset.",
  },
];

export function WhyPay() {
  return (
    <section className="py-24 relative">
      <div className="container px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Professionals <span className="text-gradient">Pay For NeuroLoop</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Your brain is your edge. High performers don't leave mental performance to chance.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {reasons.map((reason, index) => (
              <div
                key={reason.title}
                className="p-8 rounded-2xl bg-gradient-surface border border-border hover:border-primary/30 transition-all duration-300 animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <reason.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-2xl font-bold text-gradient">{reason.stat}</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">{reason.title}</h3>
                <p className="text-muted-foreground text-sm">{reason.description}</p>
              </div>
            ))}
          </div>

          {/* Quote */}
          <div className="mt-16 text-center p-8 rounded-2xl bg-card border border-border">
            <blockquote className="text-xl md:text-2xl font-medium mb-4">
              "Less noise. More signal. <span className="text-gradient">Decide like a pro.</span>"
            </blockquote>
            <p className="text-muted-foreground">— The NeuroLoop Philosophy</p>
          </div>
        </div>
      </div>
    </section>
  );
}
