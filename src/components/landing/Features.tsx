import { Zap, Brain, Target, Shield } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Instant Stress Reduction",
    description: "Science-based protocols that work in 30 seconds. No meditation experience required.",
  },
  {
    icon: Brain,
    title: "On-Demand Clarity",
    description: "Sharpen your focus before high-stakes work, meetings, or deep concentration sessions.",
  },
  {
    icon: Target,
    title: "Decision Support",
    description: "Smart frameworks to cut through analysis paralysis and make better choices under pressure.",
  },
  {
    icon: Shield,
    title: "Non-Invasive",
    description: "No tracking, no wearables, no data collection. Just tools when you need them.",
  },
];

export function Features() {
  return (
    <section className="py-24 relative">
      <div className="container px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Built For <span className="text-gradient">High Performers</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            NeuroLoop Pro is designed for founders, executives, and ambitious professionals who treat their brain as their most valuable asset.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-glow animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
