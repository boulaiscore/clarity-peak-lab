import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Brain, Target, TrendingUp, Shield, Zap, Moon } from "lucide-react";

const CognitiveAgeExplained = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container px-4 py-4 flex items-center gap-4">
          <Link to="/app/dashboard">
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold text-foreground">Cognitive Age Explained</h1>
        </div>
      </header>

      <main className="container px-4 py-8 max-w-lg mx-auto space-y-8">
        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center mx-auto shadow-glow">
            <Brain className="w-8 h-8 text-foreground" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">What is Cognitive Age?</h2>
          <p className="text-text-secondary text-sm">
            A training index, not a medical diagnosis.
          </p>
        </div>

        {/* Section 1 */}
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Target className="w-5 h-5 text-accent-primary" />
            How We Estimate Cognitive Age
          </h3>
          <div className="p-4 rounded-xl bg-surface/50 border border-border/30 space-y-3">
            <p className="text-sm text-foreground/90 leading-relaxed">
              Your Cognitive Age is calculated using multiple mental performance metrics, compared 
              to your personal baselines and general normative ranges:
            </p>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-accent-primary mt-0.5 shrink-0" />
                <span><strong className="text-foreground">Reasoning Speed</strong> — How quickly you process and analyze information</span>
              </li>
              <li className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-accent-primary mt-0.5 shrink-0" />
                <span><strong className="text-foreground">Logical Accuracy</strong> — Precision in identifying fallacies and valid arguments</span>
              </li>
              <li className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-accent-primary mt-0.5 shrink-0" />
                <span><strong className="text-foreground">Clarity of Thought</strong> — Ability to decompose problems and structure thinking</span>
              </li>
              <li className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-accent-primary mt-0.5 shrink-0" />
                <span><strong className="text-foreground">Focus Stability</strong> — Sustained attention and cognitive control</span>
              </li>
            </ul>
            <p className="text-xs text-text-secondary/60 pt-2">
              The formula combines these into a Cognitive Performance Score (CPS), which is then 
              mapped to an age-equivalent index.
            </p>
          </div>
        </section>

        {/* Section 2 */}
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-400" />
            What Cognitive Age is NOT
          </h3>
          <div className="p-4 rounded-xl bg-surface/50 border border-border/30 space-y-3">
            <ul className="space-y-3 text-sm text-foreground/90">
              <li className="flex items-start gap-3">
                <span className="text-amber-400">✗</span>
                <span>Not a medical brain scan or neuroimaging result</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-amber-400">✗</span>
                <span>Not a clinical diagnosis or health assessment</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-amber-400">✗</span>
                <span>Not a guarantee of biological brain age</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-amber-400">✗</span>
                <span>Not a replacement for professional cognitive evaluation</span>
              </li>
            </ul>
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 mt-4">
              <p className="text-xs text-foreground/80 leading-relaxed">
                <strong>Important:</strong> Cognitive Age is designed to give you a meaningful, 
                motivating way to track how your thinking skills evolve over time. It's a 
                training signal, not a clinical measurement.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3 */}
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-success" />
            How to Improve Your Cognitive Age
          </h3>
          <div className="p-4 rounded-xl bg-surface/50 border border-border/30 space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-accent-primary">1</span>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Reasoning Workout™</h4>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Train critical thinking and logical analysis 3–4 times per week.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-accent-primary">2</span>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Clarity Lab™</h4>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Develop structured thinking and problem decomposition skills.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-accent-primary">3</span>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Decision Studio™</h4>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Upgrade your judgment and decision-making under uncertainty.
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-border/30 pt-4">
              <div className="flex items-start gap-2">
                <Moon className="w-4 h-4 text-accent-secondary mt-0.5" />
                <p className="text-xs text-text-secondary">
                  <strong className="text-foreground">Optional optimizers:</strong> Quality sleep, 
                  regular movement, and recovery practices support cognitive performance.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="pt-4 pb-8">
          <Link to="/app/dashboard">
            <Button className="w-full rounded-xl h-12 text-sm font-semibold">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default CognitiveAgeExplained;
