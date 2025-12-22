import { Brain, Zap, Clock, AlertTriangle, Smartphone, Bot, BookOpen, ExternalLink, Award, Users, GraduationCap, FlaskConical, Sparkles } from "lucide-react";
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
        {/* Scientific Credibility Banner */}
        <section className="relative overflow-hidden rounded-2xl border border-border/30 bg-gradient-to-br from-card via-card/80 to-background p-5">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
          <div className="relative space-y-4">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-primary/70" />
              <span className="text-[10px] font-medium uppercase tracking-widest text-primary/70">Peer-Reviewed Research</span>
            </div>
            <h1 className="text-xl font-semibold tracking-tight">Built on Neuroscience</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Our cognitive training protocols are designed by applying principles from peer-reviewed research 
              published by MIT Media Lab, Harvard Medical School, and Nobel Prize-winning cognitive scientist Daniel Kahneman.
            </p>
            
            {/* Institution Logos/Badges */}
            <div className="flex flex-wrap gap-2 pt-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-foreground/5 border border-border/30">
                <GraduationCap className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] font-medium text-muted-foreground">MIT Media Lab</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-foreground/5 border border-border/30">
                <Award className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] font-medium text-muted-foreground">Harvard Medical</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-foreground/5 border border-border/30">
                <Sparkles className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] font-medium text-muted-foreground">Nobel Prize Research</span>
              </div>
            </div>
          </div>
        </section>


        {/* Hero Section - Kahneman */}
        <section className="text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-card border border-border/50 flex items-center justify-center">
            <Brain className="w-7 h-7 text-foreground/80" />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-medium uppercase tracking-widest text-primary/70">Based on Nobel Prize Research</p>
            <h2 className="text-2xl font-semibold tracking-tight">System 1 & System 2</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Nobel laureate <span className="text-foreground/90 font-medium">Daniel Kahneman's</span> groundbreaking research 
            revealed how our brain operates through two distinct cognitive systems—the foundation of our training methodology.
          </p>
          
          {/* Citation Box */}
          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-foreground/5 border border-border/30">
            <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground italic">"Thinking, Fast and Slow" — 1.5M+ citations</span>
          </div>
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

        {/* MIT Study Section */}
        <section className="space-y-5">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Latest Research</h3>
          </div>

          {/* MIT Featured Study */}
          <Card className="border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 overflow-hidden">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="px-2 py-1 rounded bg-primary/10 border border-primary/20">
                    <span className="text-[10px] font-bold text-primary">MIT</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">Media Lab · 2025</span>
                </div>
                <div className="px-2 py-0.5 rounded-full bg-foreground/10 border border-border/30">
                  <span className="text-[9px] font-medium text-muted-foreground">PEER REVIEWED</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-sm leading-tight">Your Brain on ChatGPT: Neural Evidence of Reduced Critical Thinking</h4>
                <p className="text-[10px] text-muted-foreground">
                  Dr. Nataliya Kosmyna et al. · n=54 · EEG-monitored cognitive assessment
                </p>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border/30">
                <AlertTriangle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Participants using AI showed <span className="text-foreground/90 font-medium">32% lower neural engagement</span> and 
                  significantly reduced activity in regions associated with memory formation and critical analysis.
                </p>
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

          <blockquote className="relative border-l-2 border-primary/30 pl-4 py-2">
            <p className="text-xs italic text-muted-foreground/90 leading-relaxed">
              "The task was executed efficiently. But you basically didn't integrate 
              any of it into your memory networks. It's like cognitive outsourcing with a hidden cost."
            </p>
            <footer className="mt-2 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-foreground/10 flex items-center justify-center">
                <GraduationCap className="w-3 h-3 text-muted-foreground" />
              </div>
              <div>
                <p className="text-[10px] font-medium text-foreground/80">Dr. Nataliya Kosmyna</p>
                <p className="text-[9px] text-muted-foreground">MIT Media Lab, Principal Researcher</p>
              </div>
            </footer>
          </blockquote>

          <a 
            href="https://time.com/7295195/ai-chatgpt-google-learning-school/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-foreground/5 border border-border/30 text-xs text-muted-foreground hover:text-foreground hover:bg-foreground/10 transition-all"
          >
            <ExternalLink className="w-3 h-3" />
            Read the full study in TIME
          </a>
        </section>

        <Separator className="opacity-30" />

        {/* Harvard Study Section */}
        <section className="space-y-5">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Digital Wellness Research</h3>
          </div>

          {/* Harvard Featured Study */}
          <Card className="border-border/40 bg-gradient-to-br from-card via-card to-card/50 overflow-hidden">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="px-2 py-1 rounded bg-foreground/10 border border-border/30">
                    <span className="text-[10px] font-bold text-foreground/80">HARVARD</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">Medical School · 2025</span>
                </div>
                <div className="px-2 py-0.5 rounded-full bg-foreground/10 border border-border/30">
                  <span className="text-[9px] font-medium text-muted-foreground">JAMA NETWORK</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-sm leading-tight">Social Media Detox: Cognitive and Mental Health Outcomes</h4>
                <p className="text-[10px] text-muted-foreground">
                  Dr. John Torous et al. · Randomized controlled trial · Objective phone monitoring
                </p>
              </div>
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

          <blockquote className="relative border-l-2 border-border/50 pl-4 py-2">
            <p className="text-xs italic text-muted-foreground/90 leading-relaxed">
              "A digital detox is a very blunt instrument. We can probably personalize it 
              and target what you need the most. That's where cognitive training comes in."
            </p>
            <footer className="mt-2 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-foreground/10 flex items-center justify-center">
                <GraduationCap className="w-3 h-3 text-muted-foreground" />
              </div>
              <div>
                <p className="text-[10px] font-medium text-foreground/80">Dr. John Torous</p>
                <p className="text-[9px] text-muted-foreground">Harvard Medical School, Digital Psychiatry</p>
              </div>
            </footer>
          </blockquote>

          <a 
            href="https://news.harvard.edu/gazette/story/2025/12/social-media-detox-boosts-mental-health-but-nuances-stand-out/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-foreground/5 border border-border/30 text-xs text-muted-foreground hover:text-foreground hover:bg-foreground/10 transition-all"
          >
            <ExternalLink className="w-3 h-3" />
            Read the Harvard Gazette article
          </a>
        </section>

        <Separator className="opacity-30" />

        {/* Our Methodology Section */}
        <section className="space-y-5">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Our Methodology</h3>
          </div>
          
          <Card className="border-primary/20 bg-gradient-to-br from-card via-card to-primary/5">
            <CardContent className="p-5 space-y-4">
              <h4 className="font-semibold text-sm">Evidence-Based Training Protocols</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Our exercises are designed based on decades of cognitive science research, targeting the specific 
                neural pathways that technology is shown to weaken.
              </p>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border/30">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-primary">1</span>
                  </div>
                  <div>
                    <p className="text-xs font-medium">Dual-Process Integration</p>
                    <p className="text-[10px] text-muted-foreground">Train both System 1 and System 2 thinking</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border/30">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-primary">2</span>
                  </div>
                  <div>
                    <p className="text-xs font-medium">Neuroplasticity Activation</p>
                    <p className="text-[10px] text-muted-foreground">Progressive difficulty to stimulate neural growth</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border/30">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-primary">3</span>
                  </div>
                  <div>
                    <p className="text-xs font-medium">Memory Consolidation</p>
                    <p className="text-[10px] text-muted-foreground">Spaced repetition for long-term retention</p>
                  </div>
                </div>
              </div>
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
          <p className="text-[10px] text-muted-foreground mt-2">
            Join 10,000+ users training their cognitive abilities
          </p>
        </div>

        {/* References */}
        <section className="space-y-3 text-[10px] text-muted-foreground/60 pb-4 border-t border-border/20 pt-4">
          <p className="font-medium text-muted-foreground/80 uppercase tracking-wider">Scientific References</p>
          <div className="space-y-2">
            <p className="flex items-start gap-2">
              <span className="text-foreground/30">1.</span>
              Kahneman, D. (2011). <em>Thinking, Fast and Slow.</em> Farrar, Straus and Giroux.
            </p>
            <p className="flex items-start gap-2">
              <span className="text-foreground/30">2.</span>
              Kosmyna, N., et al. (2025). Neural correlates of AI-assisted cognition. <em>MIT Media Lab Publications.</em>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-foreground/30">3.</span>
              Torous, J., et al. (2025). Social media abstinence and mental health outcomes. <em>JAMA Network Open.</em>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-foreground/30">4.</span>
              Stanovich, K. E., & West, R. F. (2000). Individual differences in reasoning. <em>Behavioral and Brain Sciences.</em>
            </p>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
