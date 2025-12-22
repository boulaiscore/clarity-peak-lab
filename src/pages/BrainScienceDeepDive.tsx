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
          
          <p className="text-xs text-muted-foreground leading-relaxed">
            Kahneman's Nobel Prize-winning research revealed that our brain uses two fundamentally different modes of thinking. 
            Understanding this distinction is crucial for cognitive training—and for recognizing how technology can disrupt this delicate balance.
          </p>
          
          <div className="space-y-4">
            {/* System 1 */}
            <Card className="border-border/40 bg-card/50">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-foreground/5 border border-border/30 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-foreground/70" />
                  </div>
                  <div>
                    <h4 className="font-semibold">System 1: Thinking Fast</h4>
                    <p className="text-xs text-muted-foreground">Automatic · Intuitive · Associative</p>
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground leading-relaxed">
                  System 1 operates automatically and rapidly, with little conscious effort. It generates your feelings, 
                  intuitions, and first impressions through <span className="text-foreground/80 font-medium">associative thinking</span>—rapidly 
                  connecting what you experience to patterns stored in memory.
                </p>
                
                <div className="space-y-2">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Examples</p>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    <li className="flex items-start gap-2"><span className="text-primary/60">→</span> Detecting emotions in facial expressions</li>
                    <li className="flex items-start gap-2"><span className="text-primary/60">→</span> Driving on an empty road</li>
                    <li className="flex items-start gap-2"><span className="text-primary/60">→</span> Reading simple sentences</li>
                    <li className="flex items-start gap-2"><span className="text-primary/60">→</span> Answering "2+2 = ?"</li>
                  </ul>
                </div>
                
                <div className="p-3 rounded-lg bg-background/50 border border-border/30">
                  <p className="text-[10px] text-muted-foreground/80">
                    <span className="text-foreground/60 font-medium">Limitation:</span> System 1 is impulsive and prone to 
                    cognitive biases. It often jumps to conclusions based on incomplete information—an evolutionary advantage 
                    for survival, but a liability for complex modern decisions.
                  </p>
                </div>
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
                    <h4 className="font-semibold">System 2: Thinking Slow</h4>
                    <p className="text-xs text-muted-foreground">Deliberate · Analytical · Effortful</p>
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground leading-relaxed">
                  System 2 allocates attention to effortful mental activities. It activates when System 1 encounters 
                  something it cannot resolve automatically, converting intuitions into beliefs and impulses into 
                  <span className="text-foreground/80 font-medium"> voluntary, reasoned actions</span>.
                </p>
                
                <div className="space-y-2">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Examples</p>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    <li className="flex items-start gap-2"><span className="text-primary/60">→</span> Parallel parking in a tight space</li>
                    <li className="flex items-start gap-2"><span className="text-primary/60">→</span> Calculating 17 × 24</li>
                    <li className="flex items-start gap-2"><span className="text-primary/60">→</span> Comparing products for value</li>
                    <li className="flex items-start gap-2"><span className="text-primary/60">→</span> Checking the validity of an argument</li>
                  </ul>
                </div>
                
                <div className="p-3 rounded-lg bg-background/50 border border-border/30">
                  <p className="text-[10px] text-muted-foreground/80">
                    <span className="text-foreground/60 font-medium">Limitation:</span> System 2 is "lazy"—it requires 
                    significant mental energy and your brain instinctively conserves resources. When tired or stressed, 
                    you default to System 1, often without questioning its conclusions.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* The Problem */}
          <Card className="border-destructive/20 bg-gradient-to-br from-card via-card to-destructive/5">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive/60" />
                <p className="text-xs font-medium text-foreground/80">The Technology Problem</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                AI assistants and social media are designed to give you instant answers and constant stimulation—they 
                <span className="text-foreground/80 font-medium"> bypass System 2 entirely</span>. Over time, this can 
                weaken your capacity for deliberate, analytical thinking. Our training is designed to reverse this trend.
              </p>
            </CardContent>
          </Card>
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
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">MIT Media Lab Research</h3>
          </div>

          {/* MIT Featured Study */}
          <Card className="border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 overflow-hidden">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="px-2 py-1 rounded bg-primary/10 border border-primary/20">
                    <span className="text-[10px] font-bold text-primary">MIT</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">Media Lab · June 2025</span>
                </div>
                <div className="px-2 py-0.5 rounded-full bg-foreground/10 border border-border/30">
                  <span className="text-[9px] font-medium text-muted-foreground">arXiv PREPRINT</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-sm leading-tight">Your Brain on ChatGPT: Accumulation of Cognitive Debt when Using an AI Assistant</h4>
                <p className="text-[10px] text-muted-foreground">
                  Dr. Nataliya Kosmyna et al. · n=54 participants · 4 sessions over 4 months · EEG brain monitoring
                </p>
              </div>
              
              <p className="text-xs text-muted-foreground leading-relaxed">
                Researchers assigned participants to three groups: <span className="text-foreground/80 font-medium">LLM group</span>, 
                <span className="text-foreground/80 font-medium"> Search Engine group</span>, and 
                <span className="text-foreground/80 font-medium"> Brain-only group</span> for an essay writing task. 
                Using electroencephalography (EEG), they measured neural connectivity patterns during the task.
              </p>
            </CardContent>
          </Card>
          
          {/* Key Finding */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-destructive/5 via-card to-card border border-destructive/20">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <span className="text-foreground/80 font-medium">Critical Finding:</span> Brain connectivity 
              <span className="text-foreground/80 font-medium"> systematically scaled down</span> with external support. 
              The Brain-only group exhibited the strongest neural networks, Search Engine showed intermediate engagement, 
              and LLM assistance produced the <span className="text-foreground/80 font-medium">weakest overall neural coupling</span>.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-card/30 border border-border/30 text-center">
              <div className="text-lg font-semibold text-foreground/80">54</div>
              <p className="text-[10px] text-muted-foreground mt-1">Participants</p>
            </div>
            <div className="p-3 rounded-lg bg-card/30 border border-border/30 text-center">
              <div className="text-lg font-semibold text-foreground/80">4 mo</div>
              <p className="text-[10px] text-muted-foreground mt-1">Study duration</p>
            </div>
            <div className="p-3 rounded-lg bg-card/30 border border-border/30 text-center">
              <div className="text-lg font-semibold text-foreground/80">EEG</div>
              <p className="text-[10px] text-muted-foreground mt-1">Brain monitoring</p>
            </div>
          </div>
          
          {/* More findings */}
          <Card className="border-border/30 bg-card/30">
            <CardContent className="p-4 space-y-3">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Additional Findings</p>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary/60">→</span> 
                  LLM users showed <span className="text-foreground/80 font-medium">weaker alpha and beta networks</span>—linked to creativity and active processing
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary/60">→</span> 
                  Participants reported <span className="text-foreground/80 font-medium">lower ownership</span> of essays written with AI assistance
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary/60">→</span> 
                  LLM group <span className="text-foreground/80 font-medium">could not recall content</span> from essays written just minutes prior
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary/60">→</span> 
                  Over 4 sessions, LLM group performed <span className="text-foreground/80 font-medium">worse at all levels</span>: neural, linguistic, and scoring
                </li>
              </ul>
            </CardContent>
          </Card>

          <blockquote className="relative border-l-2 border-primary/30 pl-4 py-2">
            <p className="text-xs italic text-muted-foreground/90 leading-relaxed">
              "The task was executed efficiently. But you basically did not integrate 
              any of it into your memory networks. It is like cognitive outsourcing with a hidden cost."
            </p>
            <footer className="mt-2 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-foreground/10 flex items-center justify-center">
                <GraduationCap className="w-3 h-3 text-muted-foreground" />
              </div>
              <div>
                <p className="text-[10px] font-medium text-foreground/80">Dr. Nataliya Kosmyna</p>
                <p className="text-[9px] text-muted-foreground">MIT Media Lab, Fluid Interfaces Group</p>
              </div>
            </footer>
          </blockquote>

          <div className="flex flex-wrap gap-2">
            <a 
              href="https://www.media.mit.edu/projects/your-brain-on-chatgpt/overview/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-foreground/5 border border-border/30 text-xs text-muted-foreground hover:text-foreground hover:bg-foreground/10 transition-all"
            >
              <ExternalLink className="w-3 h-3" />
              MIT Media Lab Project
            </a>
            <a 
              href="https://arxiv.org/abs/2506.08872" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-foreground/5 border border-border/30 text-xs text-muted-foreground hover:text-foreground hover:bg-foreground/10 transition-all"
            >
              <BookOpen className="w-3 h-3" />
              Read the Paper (arXiv)
            </a>
          </div>
        </section>

        <Separator className="opacity-30" />

        {/* Harvard Study Section */}
        <section className="space-y-5">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Harvard Medical School Research</h3>
          </div>

          {/* Harvard Featured Study */}
          <Card className="border-border/40 bg-gradient-to-br from-card via-card to-card/50 overflow-hidden">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="px-2 py-1 rounded bg-foreground/10 border border-border/30">
                    <span className="text-[10px] font-bold text-foreground/80">HARVARD</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">Medical School · December 2025</span>
                </div>
                <div className="px-2 py-0.5 rounded-full bg-foreground/10 border border-border/30">
                  <span className="text-[9px] font-medium text-muted-foreground">JAMA NETWORK OPEN</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-sm leading-tight">Social Media Detox and Youth Mental Health</h4>
                <p className="text-[10px] text-muted-foreground">
                  Dr. John Torous et al. · Beth Israel Deaconess Medical Center · Randomized controlled trial
                </p>
              </div>
              
              <p className="text-xs text-muted-foreground leading-relaxed">
                Unlike previous research relying on self-reported data, this study used 
                <span className="text-foreground/80 font-medium"> objective phone monitoring</span> to measure real-time changes 
                in social media usage and mental health outcomes during a one-week detox period.
              </p>
            </CardContent>
          </Card>
          
          {/* Study Design */}
          <div className="p-4 rounded-xl bg-card/30 border border-border/30">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-3">Study Protocol</p>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-primary">1</span>
                </div>
                <span>2 weeks baseline measurement of natural usage</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-primary">2</span>
                </div>
                <span>1 week voluntary social media detox</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-primary">3</span>
                </div>
                <span>Objective phone data + mental health assessments</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-card/30 border border-border/30 text-center">
              <div className="text-lg font-semibold text-foreground/80">-24.8%</div>
              <p className="text-[10px] text-muted-foreground mt-1">Depression symptoms</p>
            </div>
            <div className="p-3 rounded-lg bg-card/30 border border-border/30 text-center">
              <div className="text-lg font-semibold text-foreground/80">-16.1%</div>
              <p className="text-[10px] text-muted-foreground mt-1">Anxiety symptoms</p>
            </div>
            <div className="p-3 rounded-lg bg-card/30 border border-border/30 text-center">
              <div className="text-lg font-semibold text-foreground/80">-14.5%</div>
              <p className="text-[10px] text-muted-foreground mt-1">Insomnia symptoms</p>
            </div>
          </div>
          
          {/* Key Insights */}
          <Card className="border-border/30 bg-card/30">
            <CardContent className="p-4 space-y-3">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Key Insights</p>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary/60">→</span> 
                  Social media time dropped from <span className="text-foreground/80 font-medium">1.9 hours to 30 minutes</span> daily
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary/60">→</span> 
                  Total screen time stayed the same—users <span className="text-foreground/80 font-medium">replaced social media with other activities</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary/60">→</span> 
                  <span className="text-foreground/80 font-medium">Instagram and Snapchat</span> were the hardest platforms to resist
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary/60">→</span> 
                  Some participants showed <span className="text-foreground/80 font-medium">increased physical activity</span> and left their homes more often
                </li>
              </ul>
            </CardContent>
          </Card>

          <blockquote className="relative border-l-2 border-border/50 pl-4 py-2">
            <p className="text-xs italic text-muted-foreground/90 leading-relaxed">
              "A digital detox is a very blunt instrument. What we are saying is that we can probably personalize it 
              and target what you need the most. For some people, social media does help with loneliness."
            </p>
            <footer className="mt-2 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-foreground/10 flex items-center justify-center">
                <GraduationCap className="w-3 h-3 text-muted-foreground" />
              </div>
              <div>
                <p className="text-[10px] font-medium text-foreground/80">Dr. John Torous</p>
                <p className="text-[9px] text-muted-foreground">Associate Professor, Harvard Medical School · Director of Digital Psychiatry, BIDMC</p>
              </div>
            </footer>
          </blockquote>

          <div className="flex flex-wrap gap-2">
            <a 
              href="https://news.harvard.edu/gazette/story/2025/12/social-media-detox-boosts-mental-health-but-nuances-stand-out/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-foreground/5 border border-border/30 text-xs text-muted-foreground hover:text-foreground hover:bg-foreground/10 transition-all"
            >
              <ExternalLink className="w-3 h-3" />
              Harvard Gazette Article
            </a>
            <a 
              href="https://jamanetwork.com/journals/jamanetworkopen/fullarticle/2841773" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-foreground/5 border border-border/30 text-xs text-muted-foreground hover:text-foreground hover:bg-foreground/10 transition-all"
            >
              <BookOpen className="w-3 h-3" />
              JAMA Network Open Paper
            </a>
          </div>
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
