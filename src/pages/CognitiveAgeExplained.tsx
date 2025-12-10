import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Brain, Target, TrendingUp, Shield, Zap, BarChart3 } from "lucide-react";

const SCIExplained = () => {
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
          <h1 className="text-sm font-semibold text-foreground">Strategic Cognitive Index</h1>
        </div>
      </header>

      <main className="container px-4 py-6 max-w-md mx-auto space-y-6">
        {/* Hero */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <BarChart3 className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">What is the SCI?</h2>
          <p className="label-uppercase">Strategic Performance Index</p>
        </div>

        {/* Section 1 */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">How We Calculate It</h3>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border/30 space-y-3">
            <p className="text-[11px] text-foreground/80 leading-relaxed">
              Your Strategic Cognitive Index measures how efficiently your mind operates compared to trained strategic thinkers:
            </p>
            <div className="space-y-2">
              {[
                { label: "Reasoning Speed", desc: "Processing and analytical efficiency" },
                { label: "Decision Clarity", desc: "Quality of strategic judgment" },
                { label: "Bias Resistance", desc: "Ability to overcome cognitive traps" },
                { label: "Focus Stability", desc: "Sustained attention under pressure" },
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

        {/* Section 2 - What it represents */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Strategic Thinking Framework</h3>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border/30">
            <p className="text-[11px] text-foreground/80 leading-relaxed mb-3">
              The SCI is based on Kahneman's dual-process theory, measuring both:
            </p>
            <ul className="space-y-2 text-[11px] text-foreground/80">
              {[
                "System 1: Intuitive pattern recognition speed",
                "System 2: Deliberate analytical reasoning",
                "Integration: How well both systems work together",
                "Adaptability: Response to novel challenges",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="text-primary text-xs">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-warning" />
            <h3 className="text-sm font-semibold text-foreground">What It Is NOT</h3>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border/30">
            <ul className="space-y-2 text-[11px] text-foreground/80">
              {[
                "Not a medical brain assessment",
                "Not an IQ or intelligence test",
                "Not a clinical diagnosis",
                "Not a predictor of professional success",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="text-warning text-xs">✗</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
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

export default SCIExplained;
