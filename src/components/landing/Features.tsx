import { Crosshair, Gauge, Brain, Lightbulb } from "lucide-react";

const features = [
  {
    icon: Crosshair,
    title: "Think Clearly Under Pressure",
    description: "Structured protocols that cut through cognitive noise when stakes are highest.",
  },
  {
    icon: Gauge,
    title: "Improve Reasoning Speed",
    description: "Train faster, more accurate analysis without sacrificing quality.",
  },
  {
    icon: Brain,
    title: "Build Cognitive Fitness",
    description: "Consistent practice that compounds into long-term mental sharpness.",
  },
  {
    icon: Lightbulb,
    title: "Better Decisions, Less Noise",
    description: "Evidence-based frameworks that reduce bias and improve outcomes.",
  },
];

export function Features() {
  return (
    <section className="py-24 sm:py-32 relative">
      <div className="container px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-semibold mb-5">
            The <span className="text-gradient">Cognitive Edge</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            Your thinking is your competitive advantage. NeuroLoop Pro trains it systematically.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group p-6 sm:p-8 rounded-xl bg-card border border-border hover:border-primary/25 transition-all duration-300 animate-fade-in-up shadow-card"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-12 h-12 rounded-xl bg-primary/8 flex items-center justify-center mb-5 group-hover:bg-primary/15 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
