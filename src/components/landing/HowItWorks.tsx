import { Zap, Brain, Target } from "lucide-react";

const systems = [
  {
    icon: Zap,
    title: "System 1: Intuitive",
    subtitle: "Pattern Recognition",
    description: "Train rapid pattern recognition and intuitive judgment. Build faster decision-making under pressure through strategic drills that sharpen automatic processing.",
    color: "text-amber-400",
    bgColor: "bg-amber-400/10",
    borderColor: "hover:border-amber-400/25",
  },
  {
    icon: Brain,
    title: "System 2: Deliberate",
    subtitle: "Strategic Analysis",
    description: "Develop deep analytical reasoning and bias resistance. Strengthen critical thinking, strategic clarity, and high-quality decision-making through structured exercises.",
    color: "text-teal-400",
    bgColor: "bg-teal-400/10",
    borderColor: "hover:border-teal-400/25",
  },
];

const areas = [
  {
    icon: Target,
    title: "Focus Arena",
    description: "Sustained attention, cognitive control",
  },
  {
    icon: Target,
    title: "Critical Reasoning",
    description: "Logic, bias resistance, strategic analysis",
  },
  {
    icon: Target,
    title: "Creativity Hub",
    description: "Divergent thinking, insight, innovation",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 sm:py-32 relative">
      <div className="absolute inset-0 bg-gradient-subtle" />
      
      <div className="container px-6 relative">
        <div className="text-center mb-16">
          <p className="text-primary text-sm font-medium tracking-wider uppercase mb-3">
            Based on Kahneman's Dual-Process Theory
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold mb-5">
            Train <span className="text-gradient">Strategic Thinking</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            The modern mind is fragmented. AI makes thinking easier but weaker. 
            Elite performers train deep reasoning and strategic clarity daily.
          </p>
        </div>

        {/* Two Systems */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-16">
          {systems.map((system, index) => (
            <div
              key={system.title}
              className={`relative p-8 rounded-xl bg-card border border-border ${system.borderColor} transition-all duration-300 animate-fade-in-up shadow-card`}
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              <div className={`w-14 h-14 rounded-xl ${system.bgColor} flex items-center justify-center mb-6`}>
                <system.icon className={`w-7 h-7 ${system.color}`} />
              </div>
              
              <p className={`text-xs font-medium ${system.color} tracking-wider uppercase mb-2`}>
                {system.subtitle}
              </p>
              <h3 className="text-2xl font-semibold mb-3">{system.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{system.description}</p>
            </div>
          ))}
        </div>

        {/* Three Gym Areas */}
        <div className="text-center mb-8">
          <h3 className="text-xl font-semibold text-muted-foreground">
            3 Strategic Training Domains
          </h3>
        </div>
        
        <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto">
          {areas.map((area, index) => (
            <div
              key={area.title}
              className="p-5 rounded-lg bg-card/50 border border-border/50 text-center animate-fade-in-up"
              style={{ animationDelay: `${0.3 + index * 0.1}s` }}
            >
              <h4 className="font-semibold mb-1">{area.title}</h4>
              <p className="text-muted-foreground text-xs">{area.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
