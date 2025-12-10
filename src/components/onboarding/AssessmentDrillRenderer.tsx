// Dedicated drill renderer for Initial Assessment - 6 fixed 15-second exercises
import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

interface AssessmentDrillResult {
  score: number;
  correct: number;
  avgReactionTime?: number;
}

interface AssessmentDrillRendererProps {
  exerciseIndex: number;
  onComplete: (result: AssessmentDrillResult) => void;
}

// ============ EXERCISE 1: Dot Target (Focus Fast) ============
function DotTargetAssessment({ onComplete }: { onComplete: (result: AssessmentDrillResult) => void }) {
  const [dots, setDots] = useState<{ id: number; x: number; y: number; color: "green" | "red"; createdAt: number }[]>([]);
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [isRunning, setIsRunning] = useState(false);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const dotIdRef = useRef(0);
  const completedRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsRunning(true), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = 40 + Math.random() * (rect.width - 80);
      const y = 40 + Math.random() * (rect.height - 80);
      const color = Math.random() < 0.7 ? "green" : "red";
      const newDot = { id: dotIdRef.current++, x, y, color: color as "green" | "red", createdAt: Date.now() };
      setDots(prev => [...prev, newDot]);
      setTimeout(() => setDots(prev => prev.filter(d => d.id !== newDot.id)), 1200);
    }, 600);
    return () => clearInterval(interval);
  }, [isRunning]);

  useEffect(() => {
    if (!isRunning) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isRunning]);

  useEffect(() => {
    if (timeLeft === 0 && !completedRef.current) {
      completedRef.current = true;
      const total = correct + incorrect;
      const score = total > 0 ? Math.round((correct / Math.max(total, 1)) * 100) : 50;
      const avgRT = reactionTimes.length > 0 ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length : 0;
      onComplete({ score, correct, avgReactionTime: avgRT });
    }
  }, [timeLeft, correct, incorrect, reactionTimes, onComplete]);

  const handleDotTap = (dot: { id: number; color: "green" | "red"; createdAt: number }) => {
    const rt = Date.now() - dot.createdAt;
    if (dot.color === "green") {
      setCorrect(c => c + 1);
      setReactionTimes(prev => [...prev, rt]);
    } else {
      setIncorrect(i => i + 1);
    }
    setDots(prev => prev.filter(d => d.id !== dot.id));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between px-4 py-2 bg-card/30 text-sm">
        <span className="text-green-500">✓ {correct}</span>
        <span className={cn("font-mono", timeLeft <= 5 && "text-red-500")}>{timeLeft}s</span>
      </div>
      <div ref={containerRef} className="flex-1 relative bg-background/30 min-h-[280px]">
        {!isRunning && timeLeft === 15 && (
          <div className="absolute inset-0 flex items-center justify-center text-lg text-primary animate-pulse">Tap GREEN dots!</div>
        )}
        {dots.map(dot => (
          <button
            key={dot.id}
            onClick={() => handleDotTap(dot)}
            className={cn(
              "absolute w-12 h-12 rounded-full animate-in zoom-in-50 duration-100",
              dot.color === "green" ? "bg-green-500" : "bg-red-500"
            )}
            style={{ left: dot.x - 24, top: dot.y - 24 }}
          />
        ))}
      </div>
    </div>
  );
}

// ============ EXERCISE 2: Go/No-Go (Focus Slow) ============
function GoNoGoAssessment({ onComplete }: { onComplete: (result: AssessmentDrillResult) => void }) {
  const [trial, setTrial] = useState(0);
  const [stimulus, setStimulus] = useState<"go" | "nogo" | null>(null);
  const [hits, setHits] = useState(0);
  const [falseAlarms, setFalseAlarms] = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const stimulusTime = useRef(0);
  const responded = useRef(false);
  const completedRef = useRef(false);
  const TRIALS = 8;

  useEffect(() => {
    if (trial >= TRIALS) {
      if (!completedRef.current) {
        completedRef.current = true;
        const score = Math.round(((hits) / TRIALS) * 100);
        const avgRT = reactionTimes.length > 0 ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length : 0;
        onComplete({ score, correct: hits, avgReactionTime: avgRT });
      }
      return;
    }

    const delay = 400 + Math.random() * 600;
    const timeout = setTimeout(() => {
      const isGo = Math.random() < 0.65;
      setStimulus(isGo ? "go" : "nogo");
      stimulusTime.current = Date.now();
      responded.current = false;
      setFeedback(null);

      setTimeout(() => {
        if (!responded.current && isGo) setFeedback("Miss!");
        setTimeout(() => {
          setStimulus(null);
          setTrial(t => t + 1);
        }, 300);
      }, 800);
    }, delay);

    return () => clearTimeout(timeout);
  }, [trial, hits, reactionTimes, onComplete]);

  const handleTap = () => {
    if (!stimulus || responded.current) return;
    responded.current = true;
    const rt = Date.now() - stimulusTime.current;
    if (stimulus === "go") {
      setHits(h => h + 1);
      setReactionTimes(prev => [...prev, rt]);
      setFeedback("✓");
    } else {
      setFalseAlarms(f => f + 1);
      setFeedback("✗");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-4" onClick={handleTap}>
      <div className="text-sm text-muted-foreground mb-4">{Math.min(trial + 1, TRIALS)}/{TRIALS}</div>
      <div
        className={cn(
          "w-32 h-32 rounded-full flex items-center justify-center text-4xl transition-all",
          stimulus === "go" && "bg-green-500",
          stimulus === "nogo" && "bg-red-500",
          !stimulus && "bg-card/30 border-2 border-dashed border-border"
        )}
      >
        {stimulus === "go" && "→"}
        {stimulus === "nogo" && "×"}
        {!stimulus && !feedback && "..."}
      </div>
      {feedback && <div className={cn("mt-4 text-lg font-bold", feedback === "✓" ? "text-green-500" : "text-red-500")}>{feedback}</div>}
      <div className="mt-6 text-xs text-muted-foreground">
        <span className="text-green-500">TAP</span> green • <span className="text-red-500">IGNORE</span> red
      </div>
    </div>
  );
}

// ============ EXERCISE 3: Odd One Out (Reasoning Fast) ============
function OddOneOutAssessment({ onComplete }: { onComplete: (result: AssessmentDrillResult) => void }) {
  const PATTERNS = [
    { items: ["🍎", "🍊", "🍋", "🚗"], oddIndex: 3 },
    { items: ["⬛", "⬛", "⬜", "⬛"], oddIndex: 2 },
    { items: ["🔵", "🔴", "🔵", "🔵"], oddIndex: 1 },
    { items: ["🐕", "🐈", "🌳", "🐁"], oddIndex: 2 },
    { items: ["😀", "😊", "😢", "😁"], oddIndex: 2 },
  ];

  const [trial, setTrial] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<number | null>(null);
  const [puzzles] = useState(() => PATTERNS.sort(() => Math.random() - 0.5).slice(0, 5).map(p => {
    const oddIdx = Math.floor(Math.random() * 4);
    const items = [...p.items];
    const oddItem = items.splice(p.oddIndex, 1)[0];
    items.splice(oddIdx, 0, oddItem);
    return { items, oddIndex: oddIdx };
  }));
  const trialStart = useRef(Date.now());
  const completedRef = useRef(false);

  useEffect(() => {
    trialStart.current = Date.now();
  }, [trial]);

  const handleSelect = (index: number) => {
    if (feedback !== null) return;
    const rt = Date.now() - trialStart.current;
    setReactionTimes(prev => [...prev, rt]);
    setFeedback(index);
    if (index === puzzles[trial].oddIndex) setCorrect(c => c + 1);

    setTimeout(() => {
      if (trial + 1 >= puzzles.length) {
        if (!completedRef.current) {
          completedRef.current = true;
          const score = Math.round((correct + (index === puzzles[trial].oddIndex ? 1 : 0)) / puzzles.length * 100);
          const avgRT = reactionTimes.length > 0 ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length : 0;
          onComplete({ score, correct: correct + (index === puzzles[trial].oddIndex ? 1 : 0), avgReactionTime: avgRT });
        }
      } else {
        setTrial(t => t + 1);
        setFeedback(null);
      }
    }, 600);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-4">
      <div className="text-sm text-muted-foreground mb-4">{trial + 1}/{puzzles.length}</div>
      <p className="text-sm text-muted-foreground mb-6">Tap the odd one</p>
      <div className="grid grid-cols-2 gap-3">
        {puzzles[trial].items.map((item, i) => (
          <button
            key={i}
            onClick={() => handleSelect(i)}
            disabled={feedback !== null}
            className={cn(
              "w-20 h-20 rounded-xl text-4xl flex items-center justify-center border-2 transition-all",
              feedback !== null && i === puzzles[trial].oddIndex && "bg-green-500/20 border-green-500",
              feedback !== null && i !== puzzles[trial].oddIndex && "opacity-40",
              feedback === null && "bg-card border-border hover:border-primary"
            )}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============ EXERCISE 4: Sequence Logic (Reasoning Slow) ============
function SequenceAssessment({ onComplete }: { onComplete: (result: AssessmentDrillResult) => void }) {
  const generatePuzzle = () => {
    const patterns = [
      () => { const s = Math.floor(Math.random() * 5) + 1; const step = 2; return { seq: [s, s + step, s + step * 2], answer: s + step * 3 }; },
      () => { const s = Math.floor(Math.random() * 3) + 1; return { seq: [s, s * 2, s * 4], answer: s * 8 }; },
      () => { const s = Math.floor(Math.random() * 5) + 2; const step = 3; return { seq: [s, s + step, s + step * 2], answer: s + step * 3 }; },
    ];
    const { seq, answer } = patterns[Math.floor(Math.random() * patterns.length)]();
    const correctIdx = Math.floor(Math.random() * 4);
    const opts = [answer + 1, answer - 1, answer + 2].sort(() => Math.random() - 0.5).slice(0, 3);
    opts.splice(correctIdx, 0, answer);
    return { sequence: seq, options: opts, correctIndex: correctIdx };
  };

  const [puzzles] = useState(() => [generatePuzzle(), generatePuzzle(), generatePuzzle()]);
  const [trial, setTrial] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<number | null>(null);
  const trialStart = useRef(Date.now());
  const completedRef = useRef(false);

  useEffect(() => {
    trialStart.current = Date.now();
  }, [trial]);

  const handleSelect = (index: number) => {
    if (feedback !== null) return;
    const rt = Date.now() - trialStart.current;
    setReactionTimes(prev => [...prev, rt]);
    setFeedback(index);
    const isCorrect = index === puzzles[trial].correctIndex;
    if (isCorrect) setCorrect(c => c + 1);

    setTimeout(() => {
      if (trial + 1 >= puzzles.length) {
        if (!completedRef.current) {
          completedRef.current = true;
          const finalCorrect = correct + (isCorrect ? 1 : 0);
          const score = Math.round((finalCorrect / puzzles.length) * 100);
          const avgRT = reactionTimes.length > 0 ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length : 0;
          onComplete({ score, correct: finalCorrect, avgReactionTime: avgRT });
        }
      } else {
        setTrial(t => t + 1);
        setFeedback(null);
      }
    }, 800);
  };

  const puzzle = puzzles[trial];

  return (
    <div className="flex flex-col items-center justify-center h-full p-4">
      <div className="text-sm text-muted-foreground mb-4">{trial + 1}/{puzzles.length}</div>
      <p className="text-sm text-muted-foreground mb-4">What comes next?</p>
      <div className="flex items-center gap-2 mb-6">
        {puzzle.sequence.map((n, i) => (
          <div key={i} className="w-12 h-12 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center text-lg font-bold">{n}</div>
        ))}
        <div className="w-12 h-12 rounded-lg border-2 border-dashed border-primary/60 flex items-center justify-center text-lg font-bold text-primary">?</div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {puzzle.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleSelect(i)}
            disabled={feedback !== null}
            className={cn(
              "w-16 h-12 rounded-lg text-lg font-bold border-2 transition-all",
              feedback !== null && i === puzzle.correctIndex && "bg-green-500/20 border-green-500",
              feedback !== null && i !== puzzle.correctIndex && "opacity-40",
              feedback === null && "bg-card border-border hover:border-primary"
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============ EXERCISE 5: Rapid Association (Creativity Fast) ============
function RapidAssocAssessment({ onComplete }: { onComplete: (result: AssessmentDrillResult) => void }) {
  const SETS = [
    { trigger: "🔥", match: "🌶️", distractors: ["🧊", "💧", "❄️"] },
    { trigger: "💤", match: "🌙", distractors: ["☀️", "⚡", "🏃"] },
    { trigger: "⚡", match: "🏃", distractors: ["🐢", "🛋️", "😴"] },
    { trigger: "☀️", match: "😊", distractors: ["😢", "😴", "😡"] },
    { trigger: "🎵", match: "💃", distractors: ["📚", "💼", "🔧"] },
    { trigger: "💪", match: "🏆", distractors: ["🛋️", "😴", "📚"] },
    { trigger: "🌊", match: "🏄", distractors: ["🏔️", "🌵", "❄️"] },
    { trigger: "🍕", match: "😋", distractors: ["🤢", "😴", "😢"] },
  ];

  const [puzzles] = useState(() => SETS.sort(() => Math.random() - 0.5).slice(0, 8).map(s => {
    const idx = Math.floor(Math.random() * 4);
    const opts = [...s.distractors];
    opts.splice(idx, 0, s.match);
    return { trigger: s.trigger, options: opts, correctIndex: idx };
  }));
  const [trial, setTrial] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<number | null>(null);
  const trialStart = useRef(Date.now());
  const completedRef = useRef(false);

  useEffect(() => {
    trialStart.current = Date.now();
  }, [trial]);

  const handleSelect = (index: number) => {
    if (feedback !== null) return;
    const rt = Date.now() - trialStart.current;
    setReactionTimes(prev => [...prev, rt]);
    setFeedback(index);
    const isCorrect = index === puzzles[trial].correctIndex;
    if (isCorrect) setCorrect(c => c + 1);

    setTimeout(() => {
      if (trial + 1 >= puzzles.length) {
        if (!completedRef.current) {
          completedRef.current = true;
          const finalCorrect = correct + (isCorrect ? 1 : 0);
          const score = Math.round((finalCorrect / puzzles.length) * 100);
          const avgRT = reactionTimes.length > 0 ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length : 0;
          onComplete({ score, correct: finalCorrect, avgReactionTime: avgRT });
        }
      } else {
        setTrial(t => t + 1);
        setFeedback(null);
      }
    }, 350);
  };

  const puzzle = puzzles[trial];

  return (
    <div className="flex flex-col items-center justify-center h-full p-4">
      <div className="text-sm text-muted-foreground mb-2">{trial + 1}/{puzzles.length}</div>
      <p className="text-xs text-muted-foreground mb-4">Quick! What fits?</p>
      <div className="text-7xl mb-6 animate-pulse">{puzzle.trigger}</div>
      <div className="grid grid-cols-2 gap-3">
        {puzzle.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleSelect(i)}
            disabled={feedback !== null}
            className={cn(
              "w-16 h-16 rounded-xl text-3xl flex items-center justify-center border-2 transition-all",
              feedback !== null && i === puzzle.correctIndex && "bg-green-500/20 border-green-500",
              feedback !== null && i !== puzzle.correctIndex && "opacity-30",
              feedback === null && "bg-card border-border hover:border-primary active:scale-95"
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============ EXERCISE 6: Analogy Match (Creativity Slow) ============
function AnalogyAssessment({ onComplete }: { onComplete: (result: AssessmentDrillResult) => void }) {
  const ANALOGIES = [
    { a: "🐕", b: "🦴", c: "🐈", correct: "🐟", distractors: ["🌳", "🚗", "🎸"] },
    { a: "☀️", b: "🌅", c: "🌙", correct: "🌃", distractors: ["🌻", "🔥", "⭐"] },
    { a: "✏️", b: "📝", c: "🖌️", correct: "🎨", distractors: ["📚", "💻", "🔧"] },
  ];

  const [puzzles] = useState(() => ANALOGIES.map(a => {
    const idx = Math.floor(Math.random() * 4);
    const opts = [...a.distractors];
    opts.splice(idx, 0, a.correct);
    return { ...a, options: opts, correctIndex: idx };
  }));
  const [trial, setTrial] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<number | null>(null);
  const trialStart = useRef(Date.now());
  const completedRef = useRef(false);

  useEffect(() => {
    trialStart.current = Date.now();
  }, [trial]);

  const handleSelect = (index: number) => {
    if (feedback !== null) return;
    const rt = Date.now() - trialStart.current;
    setReactionTimes(prev => [...prev, rt]);
    setFeedback(index);
    const isCorrect = index === puzzles[trial].correctIndex;
    if (isCorrect) setCorrect(c => c + 1);

    setTimeout(() => {
      if (trial + 1 >= puzzles.length) {
        if (!completedRef.current) {
          completedRef.current = true;
          const finalCorrect = correct + (isCorrect ? 1 : 0);
          const score = Math.round((finalCorrect / puzzles.length) * 100);
          const avgRT = reactionTimes.length > 0 ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length : 0;
          onComplete({ score, correct: finalCorrect, avgReactionTime: avgRT });
        }
      } else {
        setTrial(t => t + 1);
        setFeedback(null);
      }
    }, 800);
  };

  const puzzle = puzzles[trial];

  return (
    <div className="flex flex-col items-center justify-center h-full p-4">
      <div className="text-sm text-muted-foreground mb-4">{trial + 1}/{puzzles.length}</div>
      <p className="text-xs text-muted-foreground mb-4">Complete the analogy</p>
      <div className="flex items-center gap-1 text-2xl mb-6 flex-wrap justify-center">
        <span>{puzzle.a}</span>
        <span className="text-sm text-muted-foreground">→</span>
        <span>{puzzle.b}</span>
        <span className="text-sm text-primary mx-2">::</span>
        <span>{puzzle.c}</span>
        <span className="text-sm text-muted-foreground">→</span>
        <span className="w-10 h-10 rounded border-2 border-dashed border-primary/60 flex items-center justify-center text-lg font-bold text-primary">?</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {puzzle.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleSelect(i)}
            disabled={feedback !== null}
            className={cn(
              "w-14 h-14 rounded-xl text-2xl flex items-center justify-center border-2 transition-all",
              feedback !== null && i === puzzle.correctIndex && "bg-green-500/20 border-green-500",
              feedback !== null && i !== puzzle.correctIndex && "opacity-40",
              feedback === null && "bg-card border-border hover:border-primary"
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============ MAIN RENDERER ============
export function AssessmentDrillRenderer({ exerciseIndex, onComplete }: AssessmentDrillRendererProps) {
  switch (exerciseIndex) {
    case 0: return <DotTargetAssessment onComplete={onComplete} />;
    case 1: return <GoNoGoAssessment onComplete={onComplete} />;
    case 2: return <OddOneOutAssessment onComplete={onComplete} />;
    case 3: return <SequenceAssessment onComplete={onComplete} />;
    case 4: return <RapidAssocAssessment onComplete={onComplete} />;
    case 5: return <AnalogyAssessment onComplete={onComplete} />;
    default: return null;
  }
}
