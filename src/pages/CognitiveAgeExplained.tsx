import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Brain, Target, TrendingUp, Shield, Zap, Moon } from "lucide-react";

const CognitiveAgeExplained = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border/30">
        <div className="container px-4 py-3 flex items-center gap-3">
          <Link to="/app/dashboard">
            <Button variant="ghost" size="icon-sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-sm font-semibold text-foreground">Cognitive Age</h1>
        </div>
      </header>

      <main className="container px-4 py-6 max-w-md mx-auto space-y-6">
        {/* Hero */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Brain className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">What is Cognitive Age?</h2>
          <p className="label-uppercase">Training index · Not medical</p>
        </div>

        {/* Section 1 */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">How We Calculate It</h3>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border/30 space-y-3">
            <p className="text-[11px] text-foreground/80 leading-relaxed">
              Your Cognitive Age is calculated using multiple performance metrics compared to your personal baselines:
            </p>
            <div className="space-y-2">
              {[
                { label: "Reasoning Speed", desc: "Processing and analysis time" },
                { label: "Logical Accuracy", desc: "Fallacy identification precision" },
                { label: "Clarity of Thought", desc: "Problem decomposition ability" },
                { label: "Focus Stability", desc: "Sustained cognitive control" },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-2">
                  <Zap className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[11px] font-medium text-foreground">{item.label}</span>
                    <span className="text-[10px] text-muted-foreground ml-1.5">{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-warning" />
            <h3 className="text-sm font-semibold text-foreground">What It Is NOT</h3>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border/30">
            <ul className="space-y-2 text-[11px] text-foreground/80">
              {[
                "Not a medical brain scan",
                "Not a clinical diagnosis",
                "Not biological age guarantee",
                "Not professional evaluation",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="text-warning text-xs">✗</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">How to Improve</h3>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border/30 space-y-3">
            {[
              { num: "1", title: "Reasoning Workout", desc: "3-4x weekly" },
              { num: "2", title: "Clarity Lab", desc: "Structured thinking" },
              { num: "3", title: "Decision Studio", desc: "Better judgment" },
            ].map((item) => (
              <div key={item.num} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-semibold text-primary">{item.num}</span>
                </div>
                <div>
                  <span className="text-[11px] font-medium text-foreground">{item.title}</span>
                  <span className="text-[10px] text-muted-foreground ml-1.5">{item.desc}</span>
                </div>
              </div>
            ))}
            
            <div className="pt-2 border-t border-border/30 flex items-start gap-2">
              <Moon className="w-3 h-3 text-muted-foreground mt-0.5" />
              <p className="text-[10px] text-muted-foreground">
                Quality sleep and movement support cognitive performance.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="pt-2 pb-6">
          <Link to="/app/dashboard">
            <Button variant="subtle" className="w-full" size="lg">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default CognitiveAgeExplained;