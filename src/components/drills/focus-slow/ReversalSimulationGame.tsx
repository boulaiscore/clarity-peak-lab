import { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, Check, ArrowRight, Sparkles, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  onComplete: (result: { score: number; correct: boolean }) => void;
}

// Scenario-specific reversal consequences - keyed by a unique identifier from options
const SCENARIO_CONSEQUENCES: Record<string, Record<string, { impact: string; detail: string }>> = {
  // Scenario: Performance slowdown analysis (Dashboard color, Goal clarity, Team mood, Meeting room)
  "Dashboard color|Goal clarity|Team mood|Meeting room": {
    "Dashboard color": { 
      impact: "No meaningful impact", 
      detail: "UI appearance changes but workflows remain identical" 
    },
    "Goal clarity": { 
      impact: "Team loses shared direction", 
      detail: "Priorities misalign. Execution velocity collapses" 
    },
    "Team mood": { 
      impact: "Morale shifts but processes stay functional", 
      detail: "Local effect, minimal systemic change" 
    },
    "Meeting room": { 
      impact: "Convenience changes slightly", 
      detail: "No effect on decisions or execution" 
    },
  },
  // Scenario: Project delay analysis
  "Stakeholder alignment|Resource availability|Team expertise|Office location": {
    "Stakeholder alignment": { 
      impact: "Conflicting priorities emerge", 
      detail: "Decisions stall. Rework cycles multiply" 
    },
    "Resource availability": { 
      impact: "Bottlenecks form immediately", 
      detail: "Critical path blocked. Timeline extends" 
    },
    "Team expertise": { 
      impact: "Quality and speed both suffer", 
      detail: "Learning curve slows all deliverables" 
    },
    "Office location": { 
      impact: "Minor logistical adjustment", 
      detail: "No impact on project fundamentals" 
    },
  },
  // Scenario: Customer churn analysis
  "Product pricing|Core feature reliability|Support response time|Brand logo design": {
    "Product pricing": { 
      impact: "Budget calculations shift", 
      detail: "Some customers reconsider, but value proposition intact" 
    },
    "Core feature reliability": { 
      impact: "Trust foundation collapses", 
      detail: "Users cannot depend on product. Exodus begins" 
    },
    "Support response time": { 
      impact: "Frustration increases locally", 
      detail: "Issue resolution slows but product still works" 
    },
    "Brand logo design": { 
      impact: "Visual identity changes", 
      detail: "Zero functional impact on user experience" 
    },
  },
  // Scenario: Innovation stagnation
  "R&D budget|Psychological safety|Office furniture|Competitor monitoring": {
    "R&D budget": { 
      impact: "New initiatives pause", 
      detail: "Exploration slows but existing products continue" 
    },
    "Psychological safety": { 
      impact: "Risk-taking disappears", 
      detail: "Ideas stay hidden. Innovation culture dies" 
    },
    "Office furniture": { 
      impact: "Comfort level shifts", 
      detail: "No impact on creative output or collaboration" 
    },
    "Competitor monitoring": { 
      impact: "Strategic awareness decreases", 
      detail: "Reactive but doesn't block internal innovation" 
    },
  },
  // Scenario: Decision quality decline
  "Data accuracy|Meeting frequency|Decision authority clarity|Snack options": {
    "Data accuracy": { 
      impact: "Wrong inputs lead to wrong outputs", 
      detail: "All decisions built on faulty foundation" 
    },
    "Meeting frequency": { 
      impact: "Communication rhythm changes", 
      detail: "Adjustable without affecting decision quality" 
    },
    "Decision authority clarity": { 
      impact: "Accountability gaps form", 
      detail: "Decisions delayed or duplicated across teams" 
    },
    "Snack options": { 
      impact: "Minor comfort change", 
      detail: "Zero impact on cognitive or process quality" 
    },
  },
  // Scenario: Team productivity drop
  "Clear priorities|Tool stack|Work-life balance|Desk arrangement": {
    "Clear priorities": { 
      impact: "Efforts scatter across low-value work", 
      detail: "Energy spent on wrong things. Output quality drops" 
    },
    "Tool stack": { 
      impact: "Workflow friction increases", 
      detail: "Slowdown but fundamentals still possible" 
    },
    "Work-life balance": { 
      impact: "Burnout risk rises over time", 
      detail: "Long-term issue but short-term output stable" 
    },
    "Desk arrangement": { 
      impact: "Physical layout shifts", 
      detail: "No meaningful impact on actual work output" 
    },
  },
  // Scenario: Communication breakdown
  "Shared context|Channel choice|Feedback loops|Email signature style": {
    "Shared context": { 
      impact: "Misunderstandings multiply", 
      detail: "Every message requires clarification. Trust erodes" 
    },
    "Channel choice": { 
      impact: "Message delivery path changes", 
      detail: "Adaptable preference, not structural blocker" 
    },
    "Feedback loops": { 
      impact: "Course corrections slow", 
      detail: "Problems persist longer but still detectable" 
    },
    "Email signature style": { 
      impact: "Visual formatting shifts", 
      detail: "Zero impact on information exchange" 
    },
  },
  // Scenario: Strategy execution failure
  "Strategic clarity|Execution discipline|Market conditions|Company swag": {
    "Strategic clarity": { 
      impact: "Actions diverge from goals", 
      detail: "Teams optimize locally, miss global objective" 
    },
    "Execution discipline": { 
      impact: "Plans stay plans", 
      detail: "Ideas never reach implementation. Gap widens" 
    },
    "Market conditions": { 
      impact: "External pressure shifts", 
      detail: "Reactive adjustment needed but controllable" 
    },
    "Company swag": { 
      impact: "Branded items change", 
      detail: "No connection to strategy or execution" 
    },
  },
  // Scenario: Learning velocity decline
  "Curiosity culture|Knowledge sharing systems|Learning time allocation|Office plant selection": {
    "Curiosity culture": { 
      impact: "Questions stop being asked", 
      detail: "Stagnation sets in. Growth mindset disappears" 
    },
    "Knowledge sharing systems": { 
      impact: "Information silos form", 
      detail: "Relearning same lessons. Efficiency drops" 
    },
    "Learning time allocation": { 
      impact: "Development slows", 
      detail: "Skills plateau but existing capability remains" 
    },
    "Office plant selection": { 
      impact: "Aesthetic environment shifts", 
      detail: "No impact on learning or knowledge transfer" 
    },
  },
  // Scenario: Quality degradation
  "Quality standards|Review processes|Automation coverage|Desk nameplate font": {
    "Quality standards": { 
      impact: "Bar drops system-wide", 
      detail: "What's acceptable expands. Excellence becomes rare" 
    },
    "Review processes": { 
      impact: "Errors slip through more often", 
      detail: "Detection delayed but still possible downstream" 
    },
    "Automation coverage": { 
      impact: "Manual work increases", 
      detail: "Slower but quality still achievable" 
    },
    "Desk nameplate font": { 
      impact: "Visual identifier changes", 
      detail: "Zero connection to output quality" 
    },
  },
};

// Fallback consequences if scenario not found - still specific but generic enough
const FALLBACK_CONSEQUENCES = [
  { impact: "Significant structural change", detail: "Core system dynamics affected" },
  { impact: "Moderate local effect", detail: "Some processes impacted" },
  { impact: "Minor adjustment needed", detail: "Limited downstream effects" },
  { impact: "Negligible impact", detail: "No meaningful change to system" },
];

export const ReversalSimulationGame = ({ prompt, options, correctIndex, explanation, onComplete }: Props) => {
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const resultRef = useRef<{ score: number; correct: boolean } | null>(null);

  // Get scenario-specific consequences based on options
  const cardConsequences = useMemo(() => {
    const scenarioKey = options.join("|");
    const scenarioConsequences = SCENARIO_CONSEQUENCES[scenarioKey];
    
    if (scenarioConsequences) {
      return options.map(option => scenarioConsequences[option] || FALLBACK_CONSEQUENCES[0]);
    }
    
    // Fallback: assign consequences based on position (correct answer gets "significant" consequence)
    return options.map((_, i) => {
      if (i === correctIndex) return FALLBACK_CONSEQUENCES[0];
      return FALLBACK_CONSEQUENCES[Math.min(i + 1, FALLBACK_CONSEQUENCES.length - 1)];
    });
  }, [options, correctIndex]);

  const handleFlip = (index: number) => {
    if (showResult) return;
    const newFlipped = new Set(flippedCards);
    if (newFlipped.has(index)) {
      newFlipped.delete(index);
    } else {
      newFlipped.add(index);
    }
    setFlippedCards(newFlipped);
  };

  const handleSelect = (index: number) => {
    if (showResult) return;
    setSelectedIndex(index);
  };

  const handleConfirm = () => {
    if (selectedIndex === null) return;
    setShowResult(true);
    const isCorrect = selectedIndex === correctIndex;
    resultRef.current = { score: isCorrect ? 100 : 0, correct: isCorrect };
  };

  const handleNext = () => {
    if (resultRef.current) {
      onComplete(resultRef.current);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-4"
      >
        <div className="flex items-center justify-center gap-2 mb-3">
          <RotateCcw className="w-5 h-5 text-primary" />
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Reversal Simulation</span>
        </div>
        <p className="text-foreground text-sm max-w-md mb-3">{prompt}</p>
      </motion.div>

      {/* Context Section */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-sm mb-4 p-3 rounded-lg bg-muted/30 border border-border/50"
      >
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-xs font-medium text-foreground mb-1">Context</div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              You are analyzing a system where performance has slowed down. Your goal is to identify which underlying factor, if reversed, would create the largest structural change in the situation. Each card represents a condition in the current state. Flip the cards to see the reversal effect—what would happen if its opposite were true—and choose the factor whose reversal produces the most significant systemic shift.
            </p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 gap-3 w-full max-w-sm mb-6">
        {options.map((option, index) => {
          const isFlipped = flippedCards.has(index);
          const isSelected = selectedIndex === index;
          const consequence = cardConsequences[index];
          const isCorrectAndRevealed = showResult && index === correctIndex;
          const isWrongAndSelected = showResult && isSelected && index !== correctIndex;
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 + 0.2 }}
            >
              {/* Card container with proper 3D flip */}
              <div
                className={`relative w-full h-28 cursor-pointer rounded-xl ${
                  isSelected && !showResult ? "ring-2 ring-primary" : ""
                } ${isCorrectAndRevealed ? "ring-2 ring-green-500" : ""}
                  ${isWrongAndSelected ? "ring-2 ring-destructive" : ""}`}
                style={{ perspective: "1000px" }}
                onClick={() => handleFlip(index)}
              >
                {/* Front - visible when not flipped */}
                <motion.div
                  className={`absolute inset-0 flex flex-col items-center justify-center p-3 rounded-xl border transition-colors ${
                    isSelected && !showResult
                      ? "bg-primary/20 border-primary"
                      : isCorrectAndRevealed
                      ? "bg-green-500/20 border-green-500"
                      : isWrongAndSelected
                      ? "bg-destructive/20 border-destructive"
                      : "bg-card border-border/50 hover:border-border"
                  }`}
                  initial={false}
                  animate={{ 
                    rotateY: isFlipped ? 180 : 0,
                    opacity: isFlipped ? 0 : 1,
                    zIndex: isFlipped ? 0 : 1
                  }}
                  transition={{ duration: 0.3 }}
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <span className="text-xs text-center text-foreground">{option}</span>
                  <span className="text-[10px] text-muted-foreground mt-2">Tap to flip</span>
                </motion.div>

                {/* Back - visible when flipped, neutral color */}
                <motion.div
                  className={`absolute inset-0 flex flex-col items-center justify-center p-3 rounded-xl border ${
                    isCorrectAndRevealed
                      ? "bg-green-500/20 border-green-500"
                      : isWrongAndSelected
                      ? "bg-destructive/20 border-destructive"
                      : "bg-muted/80 border-border"
                  }`}
                  initial={false}
                  animate={{ 
                    rotateY: isFlipped ? 0 : -180,
                    opacity: isFlipped ? 1 : 0,
                    zIndex: isFlipped ? 1 : 0
                  }}
                  transition={{ duration: 0.3 }}
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <RotateCcw className="w-3 h-3 text-muted-foreground" />
                      <span className="text-muted-foreground text-[10px] font-medium">If reversed:</span>
                    </div>
                    <span className="text-foreground text-xs font-medium">{consequence.impact}</span>
                    <div className="text-[10px] text-muted-foreground mt-1">{consequence.detail}</div>
                  </div>
                </motion.div>
              </div>
              
              {/* Select button */}
              {!showResult && (
                <motion.button
                  className={`w-full mt-2 py-1.5 rounded-lg text-xs transition-colors ${
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(index);
                  }}
                >
                  {isSelected ? "Selected" : "Select"}
                </motion.button>
              )}

              {/* Result indicator */}
              {showResult && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mt-2 py-1 rounded-lg text-xs text-center ${
                    index === correctIndex
                      ? "bg-green-500/20 text-green-400"
                      : isSelected
                      ? "bg-destructive/20 text-destructive"
                      : "bg-muted/20 text-muted-foreground"
                  }`}
                >
                  {index === correctIndex ? "✓ Biggest impact" : isSelected ? "✗ Your choice" : ""}
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {!showResult && selectedIndex !== null && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleConfirm}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium"
        >
          <Check className="w-4 h-4" />
          Confirm Choice
        </motion.button>
      )}

      {!showResult && selectedIndex === null && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-muted-foreground text-xs text-center"
        >
          Flip cards to explore, then select your answer
        </motion.p>
      )}

      <AnimatePresence>
        {showResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 w-full max-w-sm"
          >
            {/* Insight Card */}
            <motion.div 
              className={`p-4 rounded-xl border mb-4 relative overflow-hidden ${
                selectedIndex === correctIndex
                  ? "bg-green-500/10 border-green-500/30"
                  : "bg-destructive/10 border-destructive/30"
              }`}
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
            >
              <motion.div
                className="absolute top-2 right-2"
                animate={{ rotate: [0, 180, 360] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-4 h-4 text-primary/40" />
              </motion.div>
              
              <div className="text-xs font-medium mb-2 text-foreground">
                {selectedIndex === correctIndex ? "✓ Correct!" : "✗ Not quite"}
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="text-foreground font-medium">"{options[correctIndex]}"</span> — {explanation}
              </p>
            </motion.div>
            
            <Button 
              onClick={handleNext}
              variant="hero"
              className="w-full h-12"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
