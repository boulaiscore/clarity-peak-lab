import { Zap, Brain, Target, ExternalLink, Gamepad2, BookOpen, Smartphone, Star } from "lucide-react";
import { Link } from "react-router-dom";

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

const trainingPillars = [
  {
    icon: Gamepad2,
    title: "Cognitive Games",
    description: "Science-backed drills across 3 strategic domains. Each session adapts to your performance level.",
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
    stats: "5-8 exercises per session",
    domains: [
      { name: "Focus Arena", desc: "Sustained attention, cognitive control" },
      { name: "Critical Reasoning", desc: "Logic, bias resistance, analysis" },
      { name: "Creativity Hub", desc: "Divergent thinking, insight" },
    ],
  },
  {
    icon: BookOpen,
    title: "Deep Content",
    description: "Curated podcasts, readings, and book excerpts that prime your mind for deep thinking. Content that challenges, not entertains.",
    color: "text-purple-400",
    bgColor: "bg-purple-400/10",
    stats: "MIT, HBR, academic sources",
  },
  {
    icon: Smartphone,
    title: "Digital Detox",
    description: "Structured breaks from distracting apps. Earn XP for focused offline time. Reclaim your attention span.",
    color: "text-green-400",
    bgColor: "bg-green-400/10",
    stats: "1-3 hours weekly target",
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
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed mb-4">
            The modern mind is fragmented. AI makes thinking easier but weaker. 
            Elite performers train deep reasoning and strategic clarity daily.
          </p>
          <Link 
            to="/brain-science" 
            className="inline-flex items-center gap-2 text-primary text-sm font-medium hover:underline"
          >
            <ExternalLink className="w-4 h-4" />
            Deep dive: AI, Social Media & Your Brain
          </Link>
        </div>

        {/* Two Systems */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-20">
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

        {/* Three Training Pillars - NEW */}
        <div className="mb-20">
          <div className="text-center mb-10">
            <h3 className="text-2xl sm:text-3xl font-semibold mb-3">
              Your Weekly Training System
            </h3>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Three pillars that work together to build cognitive fitness. 
              Each earns XP toward your weekly goal.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {trainingPillars.map((pillar, index) => (
              <div
                key={pillar.title}
                className="relative p-6 rounded-xl bg-card border border-border hover:border-primary/20 transition-all duration-300 animate-fade-in-up shadow-card group"
                style={{ animationDelay: `${0.2 + index * 0.1}s` }}
              >
                <div className={`w-12 h-12 rounded-xl ${pillar.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <pillar.icon className={`w-6 h-6 ${pillar.color}`} />
                </div>
                
                <h4 className="text-lg font-semibold mb-2">{pillar.title}</h4>
                <p className="text-muted-foreground text-sm leading-relaxed mb-3">{pillar.description}</p>
                
                {/* Show domains for Cognitive Games */}
                {'domains' in pillar && pillar.domains && (
                  <div className="space-y-1.5 mb-4">
                    {pillar.domains.map((domain) => (
                      <div key={domain.name} className="flex items-center gap-2 text-xs">
                        <Target className="w-3 h-3 text-primary" />
                        <span className="font-medium">{domain.name}</span>
                        <span className="text-muted-foreground">· {domain.desc}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${pillar.bgColor} ${pillar.color}`}>
                  <Star className="w-3 h-3" />
                  {pillar.stats}
                </div>
              </div>
            ))}
          </div>

          {/* XP Explainer */}
          <div className="mt-8 max-w-2xl mx-auto">
            <div className="p-5 rounded-xl bg-primary/5 border border-primary/10 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Star className="w-5 h-5 text-amber-400" />
                <span className="font-semibold">Weekly XP Goals</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Choose your intensity: <span className="text-emerald-400 font-medium">Light (100 XP)</span>, 
                <span className="text-blue-400 font-medium"> Expert (150 XP)</span>, or 
                <span className="text-red-400 font-medium"> Superhuman (250 XP)</span> per week. 
                Games, content, and detox all contribute to your target.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
