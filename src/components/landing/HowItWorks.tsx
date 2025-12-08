import { FlaskConical, Target, Workflow } from "lucide-react";

const modules = [
  {
    icon: FlaskConical,
    title: "Reasoning Workout™",
    description: "Drills for critical thinking and analytical sharpness. Spot fallacies, test assumptions, and strengthen logical reasoning.",
  },
  {
    icon: Target,
    title: "Clarity Lab™",
    description: "Exercises for conceptual precision and structured thought. Decompose complexity into actionable clarity.",
  },
  {
    icon: Workflow,
    title: "Decision Studio™",
    description: "Frameworks for strategic decision-making under uncertainty. Reduce bias, evaluate options, act with conviction.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 sm:py-32 relative">
      <div className="absolute inset-0 bg-gradient-subtle" />
      
      <div className="container px-6 relative">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-5">
            How NeuroLoop <span className="text-gradient">Works</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            Three specialized modules targeting different cognitive capabilities. Each session is 30 seconds to 5 minutes.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {modules.map((module, index) => (
            <div
              key={module.title}
              className="relative p-8 rounded-2xl bg-card border border-border hover:border-primary/25 transition-all duration-300 animate-fade-in-up"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              {/* Module number */}
              <span className="absolute top-6 right-6 text-xs font-bold text-primary/40 tracking-wider">
                0{index + 1}
              </span>
              
              <div className="w-14 h-14 rounded-xl bg-primary/8 flex items-center justify-center mb-6">
                <module.icon className="w-7 h-7 text-primary" />
              </div>
              
              <h3 className="text-xl font-semibold mb-3">{module.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{module.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}