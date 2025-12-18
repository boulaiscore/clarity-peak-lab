import { Brain, Zap, Clock, AlertTriangle, Smartphone, Bot, BookOpen, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AppShell } from "@/components/app/AppShell";
import eegBrainScan from "@/assets/eeg-brain-scan-1.png";
import dualBrainSystems from "@/assets/dual-brain-systems.png";

export default function BrainScienceDeepDive() {
  const navigate = useNavigate();

  return (
    <AppShell>
      <div className="px-4 py-6 max-w-lg mx-auto space-y-8">
        {/* Hero Section */}
        <section className="text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-card border border-border/50 flex items-center justify-center">
            <Brain className="w-7 h-7 text-foreground/80" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">System 1 & System 2</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Nobel laureate Daniel Kahneman's research revealed how our brain operates 
            through two distinct cognitive systems—and why modern technology may be weakening both.
          </p>
        </section>

        {/* EEG Brain Image */}
        <div className="relative rounded-xl overflow-hidden border border-border/30">
          <img 
            src={eegBrainScan} 
            alt="EEG Brain Scan Visualization" 
            className="w-full h-auto opacity-90"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/80 to-transparent p-3">
            <p className="text-[10px] text-muted-foreground/70 text-center">
              EEG patterns reveal distinct neural signatures for different cognitive modes
            </p>
          </div>
        </div>

        {/* Kahneman's Theory */}
        <section className="space-y-5">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Dual-Process Theory</h3>
          </div>
          
          <div className="space-y-4">
            {/* System 1 */}
            <Card className="border-border/40 bg-card/50">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-foreground/5 border border-border/30 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-foreground/70" />
                  </div>
                  <div>
                    <h4 className="font-semibold">System 1</h4>
                    <p className="text-xs text-muted-foreground">Fast · Intuitive · Automatic</p>
                  </div>
                </div>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2"><span className="text-foreground/40">·</span> Automatic and effortless</li>
                  <li className="flex items-start gap-2"><span className="text-foreground/40">·</span> Intuitive pattern recognition</li>
                  <li className="flex items-start gap-2"><span className="text-foreground/40">·</span> Emotional and instinctive</li>
                  <li className="flex items-start gap-2"><span className="text-foreground/40">·</span> Prone to cognitive biases</li>
                </ul>
              </CardContent>
            </Card>

            {/* System 2 */}
            <Card className="border-border/40 bg-card/50">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-foreground/5 border border-border/30 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-foreground/70" />
                  </div>
                  <div>
                    <h4 className="font-semibold">System 2</h4>
                    <p className="text-xs text-muted-foreground">Slow · Deliberate · Controlled</p>
                  </div>
                </div>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2"><span className="text-foreground/40">·</span> Deliberate and effortful</li>
                  <li className="flex items-start gap-2"><span className="text-foreground/40">·</span> Logical analysis and reasoning</li>
                  <li className="flex items-start gap-2"><span className="text-foreground/40">·</span> Self-aware and controlled</li>
                  <li className="flex items-start gap-2"><span className="text-foreground/40">·</span> Required for complex decisions</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Dual Brain Systems Image */}
        <div className="relative rounded-xl overflow-hidden border border-border/30">
          <img 
            src={dualBrainSystems} 
            alt="Dual Brain Systems Visualization" 
            className="w-full h-auto opacity-90"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/80 to-transparent p-3">
            <p className="text-[10px] text-muted-foreground/70 text-center">
              System 1 and System 2 work together but can be disrupted by technology
            </p>
          </div>
        </div>

        <Separator className="opacity-30" />

        {/* AI Impact Section */}
        <section className="space-y-5">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">AI & Your Brain</h3>
          </div>

          <Card className="border-border/40 bg-card/50">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">MIT Study: ChatGPT Erodes Critical Thinking</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    A 2025 study from MIT Media Lab used EEG to measure brain activity across 54 subjects 
                    writing essays with ChatGPT, Google Search, or their brain alone.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-card/30 border border-border/30 text-center">
              <div className="text-lg font-semibold text-foreground/80">↓32%</div>
              <p className="text-[10px] text-muted-foreground mt-1">Brain engagement</p>
            </div>
            <div className="p-3 rounded-lg bg-card/30 border border-border/30 text-center">
              <div className="text-lg font-semibold text-foreground/80">↓Alpha</div>
              <p className="text-[10px] text-muted-foreground mt-1">Creativity waves</p>
            </div>
            <div className="p-3 rounded-lg bg-card/30 border border-border/30 text-center">
              <div className="text-lg font-semibold text-foreground/80">↓Theta</div>
              <p className="text-[10px] text-muted-foreground mt-1">Learning waves</p>
            </div>
          </div>

          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              <span className="text-foreground/90">Key finding:</span> ChatGPT users showed the lowest 
              neural connectivity and produced essays teachers called "soulless." When asked to rewrite 
              without AI, they remembered almost nothing.
            </p>
            <blockquote className="border-l border-border/50 pl-3 text-xs italic text-muted-foreground/80">
              "The task was executed efficiently. But you basically didn't integrate 
              any of it into your memory networks."
              <footer className="mt-1 not-italic text-[10px]">— Dr. Nataliya Kosmyna, MIT</footer>
            </blockquote>
          </div>

          <a 
            href="https://time.com/7295195/ai-chatgpt-google-learning-school/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Read the TIME article
          </a>
        </section>

        <Separator className="opacity-30" />

        {/* Social Media Impact Section */}
        <section className="space-y-5">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Social Media Impact</h3>
          </div>

          <Card className="border-border/40 bg-card/50">
            <CardContent className="p-5 space-y-2">
              <h4 className="font-semibold text-sm">Harvard Study: One-Week Detox Results</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                A 2025 study published in JAMA Network Open measured young adults during a 
                one-week social media detox using objective phone data.
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-card/30 border border-border/30 text-center">
              <div className="text-lg font-semibold text-foreground/80">-25%</div>
              <p className="text-[10px] text-muted-foreground mt-1">Depression</p>
            </div>
            <div className="p-3 rounded-lg bg-card/30 border border-border/30 text-center">
              <div className="text-lg font-semibold text-foreground/80">-16%</div>
              <p className="text-[10px] text-muted-foreground mt-1">Anxiety</p>
            </div>
            <div className="p-3 rounded-lg bg-card/30 border border-border/30 text-center">
              <div className="text-lg font-semibold text-foreground/80">-15%</div>
              <p className="text-[10px] text-muted-foreground mt-1">Insomnia</p>
            </div>
          </div>

          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              <span className="text-foreground/90">Key finding:</span> Individual responses varied wildly. 
              Some experienced dramatic improvement, others saw no change. This suggests the need for 
              personalized approaches rather than blanket bans.
            </p>
            <blockquote className="border-l border-border/50 pl-3 text-xs italic text-muted-foreground/80">
              "A digital detox is a very blunt instrument. We can probably personalize it 
              and target what you need the most."
              <footer className="mt-1 not-italic text-[10px]">— Dr. John Torous, Harvard</footer>
            </blockquote>
          </div>

          <a 
            href="https://news.harvard.edu/gazette/story/2025/12/social-media-detox-boosts-mental-health-but-nuances-stand-out/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Read the Harvard article
          </a>
        </section>

        <Separator className="opacity-30" />

        {/* Why This Matters Section */}
        <section className="space-y-5">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Why This Matters</h3>
          
          <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>
              Both AI and social media are <span className="text-foreground/90">outsourcing 
              cognitive work</span> that our brains evolved to do. When we let AI think for us, we 
              bypass neural pathways responsible for critical thinking and memory formation.
            </p>
            <p>
              <span className="text-foreground/90">The solution</span> isn't to abandon technology—it's 
              to deliberately train the cognitive abilities that technology is eroding.
            </p>
          </div>

          <Card className="border-border/40 bg-card/50">
            <CardContent className="p-5 space-y-3">
              <h4 className="font-semibold text-sm">What You Can Do</h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex items-start gap-2"><span className="text-foreground/50">→</span> Practice active thinking before reaching for AI</li>
                <li className="flex items-start gap-2"><span className="text-foreground/50">→</span> Take regular breaks from social media</li>
                <li className="flex items-start gap-2"><span className="text-foreground/50">→</span> Engage in deliberate cognitive training daily</li>
                <li className="flex items-start gap-2"><span className="text-foreground/50">→</span> Read deeply rather than skimming content</li>
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* CTA */}
        <div className="text-center pt-4 pb-2">
          <Button 
            onClick={() => navigate("/neuro-lab")}
            className="w-full"
          >
            Start Training
          </Button>
        </div>

        {/* References */}
        <section className="space-y-2 text-[10px] text-muted-foreground/60 pb-4">
          <p className="font-medium text-muted-foreground/80">References</p>
          <p>Kahneman, D. (2011). Thinking, Fast and Slow.</p>
          <p>Kosmyna, N. et al. (2025). Your Brain on ChatGPT. MIT.</p>
          <p>Torous, J. et al. (2025). Social Media Detox. JAMA Network Open.</p>
        </section>
      </div>
    </AppShell>
  );
}
