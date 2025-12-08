import { MousePointerClick, ListChecks, Rocket } from "lucide-react";

const steps = [
  {
    icon: MousePointerClick,
    step: "01",
    title: "Open When It Matters",
    description: "Before a big meeting, during a stressful moment, or when you need peak clarity.",
  },
  {
    icon: ListChecks,
    step: "02",
    title: "Choose Your Protocol",
    description: "Stress reduction, mental clarity, or decision support. Pick what you need now.",
  },
  {
    icon: Rocket,
    step: "03",
    title: "Get Back to Peak",
    description: "Run a 30-second to 5-minute protocol and return to high performance.",
  },
];

export function HowItWorks() {
  return (
    <section id="protocols" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      
      <div className="container px-4 relative">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            How It <span className="text-gradient">Works</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Three simple steps to unlock your mental edge. No setup, no learning curve.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="relative text-center animate-fade-in-up"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-1/2 w-full h-px bg-gradient-to-r from-primary/50 to-primary/0" />
              )}
              
              {/* Step number */}
              <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-card border border-border mb-6">
                <span className="absolute -top-3 -right-3 text-xs font-bold text-primary bg-background px-2 py-1 rounded-lg border border-primary/20">
                  {step.step}
                </span>
                <step.icon className="w-10 h-10 text-primary" />
              </div>
              
              <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
