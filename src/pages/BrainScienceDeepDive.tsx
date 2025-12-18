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
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
            <Brain className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-3xl font-bold">System 1 & System 2</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Nobel laureate Daniel Kahneman's groundbreaking research revealed how our brain operates 
            through two distinct cognitive systems—and why modern technology may be weakening both.
          </p>
        </section>

        {/* EEG Brain Image */}
        <div className="relative rounded-2xl overflow-hidden border border-border/40">
          <img 
            src={eegBrainScan} 
            alt="EEG Brain Scan Visualization" 
            className="w-full h-auto"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background to-transparent p-4">
            <p className="text-xs text-muted-foreground text-center">
              EEG brain activity patterns reveal distinct neural signatures for different cognitive modes
            </p>
          </div>
        </div>

        {/* Kahneman's Theory */}
        <section className="space-y-6">
          <h3 className="text-2xl font-semibold flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            Kahneman's Dual-Process Theory
          </h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* System 1 */}
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">System 1</h4>
                    <p className="text-sm text-amber-500">Fast Thinking</p>
                  </div>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Automatic and effortless</li>
                  <li>• Intuitive pattern recognition</li>
                  <li>• Emotional and instinctive</li>
                  <li>• Always active, never "off"</li>
                  <li>• Prone to cognitive biases</li>
                </ul>
                <p className="text-sm">
                  <strong>Examples:</strong> Recognizing faces, driving on an empty road, 
                  understanding simple sentences, detecting hostility in a voice.
                </p>
              </CardContent>
            </Card>

            {/* System 2 */}
            <Card className="border-cyan-500/30 bg-cyan-500/5">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-cyan-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">System 2</h4>
                    <p className="text-sm text-cyan-500">Slow Thinking</p>
                  </div>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Deliberate and effortful</li>
                  <li>• Logical analysis and reasoning</li>
                  <li>• Self-aware and controlled</li>
                  <li>• Limited capacity, easily fatigued</li>
                  <li>• Required for complex decisions</li>
                </ul>
                <p className="text-sm">
                  <strong>Examples:</strong> Solving complex math, comparing products, 
                  filling out tax forms, checking the validity of arguments.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Dual Brain Systems Image */}
        <div className="relative rounded-2xl overflow-hidden border border-border/40">
          <img 
            src={dualBrainSystems} 
            alt="Dual Brain Systems Visualization" 
            className="w-full h-auto"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background to-transparent p-4">
            <p className="text-xs text-muted-foreground text-center">
              System 1 (fast, intuitive) and System 2 (slow, deliberate) work together but can be disrupted
            </p>
          </div>
        </div>

        <Separator />

        {/* AI Impact Section */}
        <section className="space-y-6">
          <h3 className="text-2xl font-semibold flex items-center gap-2">
            <Bot className="w-6 h-6 text-destructive" />
            How AI Is Affecting Your Brain
          </h3>

          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-destructive shrink-0 mt-1" />
                <div className="space-y-3">
                  <h4 className="font-semibold">MIT Study: ChatGPT Erodes Critical Thinking</h4>
                  <p className="text-sm text-muted-foreground">
                    A 2025 study from MIT Media Lab used EEG to measure brain activity across 54 subjects 
                    writing essays with ChatGPT, Google Search, or their brain alone.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center space-y-2">
                <div className="text-3xl font-bold text-destructive">↓ 32%</div>
                <p className="text-sm text-muted-foreground">Lower brain engagement with ChatGPT users</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center space-y-2">
                <div className="text-3xl font-bold text-amber-500">↓ Alpha</div>
                <p className="text-sm text-muted-foreground">Reduced alpha waves (creativity & memory)</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center space-y-2">
                <div className="text-3xl font-bold text-cyan-500">↓ Theta</div>
                <p className="text-sm text-muted-foreground">Weaker theta waves (learning & recall)</p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">Key findings:</strong> ChatGPT users showed the lowest 
              neural connectivity and produced essays that teachers called "soulless." By the third essay, 
              most simply copied and pasted AI output. When asked to rewrite without AI, they remembered 
              almost nothing—evidence that information wasn't integrated into memory networks.
            </p>
            <p>
              <strong className="text-foreground">The Google group performed better:</strong> Those using 
              traditional search showed high satisfaction and active brain function, highlighting that 
              searching for information engages the brain differently than having answers generated.
            </p>
            <blockquote className="border-l-2 border-primary pl-4 italic">
              "The task was executed efficiently and conveniently. But you basically didn't integrate 
              any of it into your memory networks."
              <footer className="text-xs mt-1 not-italic">— Dr. Nataliya Kosmyna, MIT Media Lab</footer>
            </blockquote>
          </div>

          <a 
            href="https://time.com/7295195/ai-chatgpt-google-learning-school/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <ExternalLink className="w-4 h-4" />
            Read the full TIME article
          </a>
        </section>

        <Separator />

        {/* Social Media Impact Section */}
        <section className="space-y-6">
          <h3 className="text-2xl font-semibold flex items-center gap-2">
            <Smartphone className="w-6 h-6 text-purple-500" />
            Social Media's Impact on Mental Health
          </h3>

          <Card className="border-purple-500/30 bg-purple-500/5">
            <CardContent className="p-6 space-y-4">
              <h4 className="font-semibold">Harvard Study: One-Week Detox Results</h4>
              <p className="text-sm text-muted-foreground">
                A 2025 study published in JAMA Network Open measured young adults during a 
                one-week social media detox using objective phone data instead of self-reports.
              </p>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-3 gap-4">
            <Card className="bg-green-500/5 border-green-500/30">
              <CardContent className="p-4 text-center space-y-2">
                <div className="text-3xl font-bold text-green-500">-24.8%</div>
                <p className="text-sm text-muted-foreground">Depression symptoms reduction</p>
              </CardContent>
            </Card>
            <Card className="bg-green-500/5 border-green-500/30">
              <CardContent className="p-4 text-center space-y-2">
                <div className="text-3xl font-bold text-green-500">-16.1%</div>
                <p className="text-sm text-muted-foreground">Anxiety symptoms reduction</p>
              </CardContent>
            </Card>
            <Card className="bg-green-500/5 border-green-500/30">
              <CardContent className="p-4 text-center space-y-2">
                <div className="text-3xl font-bold text-green-500">-14.5%</div>
                <p className="text-sm text-muted-foreground">Insomnia symptoms reduction</p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">Surprising finding:</strong> Total screen time stayed 
              the same during detox—people just shifted to other activities. Instagram and Snapchat 
              were the hardest platforms to resist.
            </p>
            <p>
              <strong className="text-foreground">Individual responses varied wildly:</strong> Some 
              experienced dramatic improvement, others saw no change. Some turned to exercise and 
              left home more often. This suggests the need for personalized approaches rather than 
              blanket bans.
            </p>
            <blockquote className="border-l-2 border-purple-500 pl-4 italic">
              "The average misses the individual response. A digital detox is a very blunt instrument. 
              We can probably personalize it and target what you need the most."
              <footer className="text-xs mt-1 not-italic">— Dr. John Torous, Harvard Medical School</footer>
            </blockquote>
          </div>

          <a 
            href="https://news.harvard.edu/gazette/story/2025/12/social-media-detox-boosts-mental-health-but-nuances-stand-out/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <ExternalLink className="w-4 h-4" />
            Read the full Harvard Gazette article
          </a>
        </section>

        <Separator />

        {/* Why This Matters Section */}
        <section className="space-y-6">
          <h3 className="text-2xl font-semibold">Why This Matters for Cognitive Training</h3>
          
          <div className="space-y-4 text-muted-foreground">
            <p>
              Both AI and social media are essentially <strong className="text-foreground">outsourcing 
              cognitive work</strong> that our brains evolved to do. When we let AI think for us, we 
              bypass the neural pathways responsible for critical thinking, creativity, and memory 
              formation. When we scroll social media, we fragment our attention and disrupt the 
              slow, deliberate processing that System 2 requires.
            </p>
            <p>
              <strong className="text-foreground">The solution isn't to abandon technology</strong>—it's 
              to deliberately train the cognitive abilities that technology is eroding. NeuroLoop Pro 
              is designed to strengthen both System 1 (fast pattern recognition, intuitive judgment) 
              and System 2 (deliberate reasoning, critical analysis) through targeted exercises.
            </p>
          </div>

          <Card className="bg-primary/5 border-primary/30">
            <CardContent className="p-6 space-y-4">
              <h4 className="font-semibold text-primary">What You Can Do</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ Practice active thinking before reaching for AI</li>
                <li>✓ Take regular breaks from social media</li>
                <li>✓ Engage in deliberate cognitive training daily</li>
                <li>✓ Read deeply rather than skimming content</li>
                <li>✓ Challenge your brain with problems that require reasoning</li>
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* CTA */}
        <div className="text-center py-8">
          <Button 
            size="lg" 
            onClick={() => navigate("/neuro-lab")}
            className="px-8"
          >
            Start Training Your Brain
          </Button>
        </div>

        {/* References */}
        <section className="space-y-4 text-xs text-muted-foreground">
          <h4 className="font-semibold text-sm">References</h4>
          <ul className="space-y-1">
            <li>• Kahneman, D. (2011). Thinking, Fast and Slow. Farrar, Straus and Giroux.</li>
            <li>• Kosmyna, N. et al. (2025). Your Brain on ChatGPT. MIT Media Lab.</li>
            <li>• Torous, J. et al. (2025). Social Media Detox and Mental Health. JAMA Network Open.</li>
          </ul>
        </section>
      </div>
    </AppShell>
  );
}
