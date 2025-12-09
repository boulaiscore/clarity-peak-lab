import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

interface Dot {
  id: number;
  x: number;
  y: number;
  color: "green" | "red" | "yellow";
  createdAt: number;
}

interface DotTargetDrillProps {
  config: {
    targetColor: string;
    distractorColors: string[];
    dotSize: number;
    spawnInterval: number;
    dotLifetime: number;
  };
  timeLimit: number;
  onComplete: (result: { score: number; correct: number; incorrect: number; missed: number; reactionTimes: number[] }) => void;
}

export function DotTargetDrill({ config, timeLimit, onComplete }: DotTargetDrillProps) {
  const [dots, setDots] = useState<Dot[]>([]);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [missed, setMissed] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [isRunning, setIsRunning] = useState(false);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const dotIdRef = useRef(0);

  const colors: ("green" | "red" | "yellow")[] = ["green", "red", "yellow"];

  const spawnDot = useCallback(() => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const padding = 60;
    const x = padding + Math.random() * (rect.width - padding * 2);
    const y = padding + Math.random() * (rect.height - padding * 2);
    
    // 60% green (target), 20% red, 20% yellow
    const rand = Math.random();
    const color = rand < 0.6 ? "green" : rand < 0.8 ? "red" : "yellow";
    
    const newDot: Dot = {
      id: dotIdRef.current++,
      x,
      y,
      color,
      createdAt: Date.now()
    };
    
    setDots(prev => [...prev, newDot]);
    
    // Remove dot after lifetime if not tapped
    setTimeout(() => {
      setDots(prev => {
        const dot = prev.find(d => d.id === newDot.id);
        if (dot && dot.color === "green") {
          setMissed(m => m + 1);
        }
        return prev.filter(d => d.id !== newDot.id);
      });
    }, config.dotLifetime);
  }, [config.dotLifetime]);

  const handleDotTap = (dot: Dot) => {
    const reactionTime = Date.now() - dot.createdAt;
    
    if (dot.color === "green") {
      setCorrect(c => c + 1);
      setScore(s => s + 10);
      setReactionTimes(prev => [...prev, reactionTime]);
    } else {
      setIncorrect(i => i + 1);
      setScore(s => Math.max(0, s - 5));
    }
    
    setDots(prev => prev.filter(d => d.id !== dot.id));
  };

  // Start game
  useEffect(() => {
    const startDelay = setTimeout(() => {
      setIsRunning(true);
    }, 1000);
    
    return () => clearTimeout(startDelay);
  }, []);

  // Spawn dots
  useEffect(() => {
    if (!isRunning) return;
    
    const interval = setInterval(spawnDot, config.spawnInterval);
    return () => clearInterval(interval);
  }, [isRunning, spawnDot, config.spawnInterval]);

  // Timer
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

  // Complete
  useEffect(() => {
    if (timeLeft === 0 && !isRunning) {
      onComplete({ score, correct, incorrect, missed, reactionTimes });
    }
  }, [timeLeft, isRunning, score, correct, incorrect, missed, reactionTimes, onComplete]);

  const getColorClass = (color: "green" | "red" | "yellow") => {
    switch (color) {
      case "green": return "bg-green-500 shadow-green-500/50";
      case "red": return "bg-red-500 shadow-red-500/50";
      case "yellow": return "bg-yellow-500 shadow-yellow-500/50";
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Stats Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-card/50 border-b border-border/30">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Score</p>
            <p className="text-lg font-bold text-primary">{score}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Correct</p>
            <p className="text-lg font-bold text-green-500">{correct}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Missed</p>
            <p className="text-lg font-bold text-red-500">{incorrect + missed}</p>
          </div>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Time</p>
          <p className={cn("text-lg font-bold", timeLeft <= 5 ? "text-red-500" : "text-foreground")}>
            {timeLeft}s
          </p>
        </div>
      </div>

      {/* Game Area */}
      <div 
        ref={containerRef}
        className="flex-1 relative bg-background/50 overflow-hidden touch-none min-h-[300px]"
      >
        {!isRunning && timeLeft === timeLimit && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary animate-pulse">Get Ready...</p>
              <p className="text-sm text-muted-foreground mt-2">Tap GREEN dots only!</p>
            </div>
          </div>
        )}
        
        {dots.map(dot => (
          <button
            key={dot.id}
            onClick={() => handleDotTap(dot)}
            className={cn(
              "absolute rounded-full transition-transform active:scale-90 shadow-lg animate-in zoom-in-50 duration-150",
              getColorClass(dot.color)
            )}
            style={{
              width: config.dotSize,
              height: config.dotSize,
              left: dot.x - config.dotSize / 2,
              top: dot.y - config.dotSize / 2,
            }}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 px-4 py-3 bg-card/30 border-t border-border/30">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-green-500" />
          <span className="text-xs text-muted-foreground">TAP</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-red-500" />
          <span className="text-xs text-muted-foreground">AVOID</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-yellow-500" />
          <span className="text-xs text-muted-foreground">AVOID</span>
        </div>
      </div>
    </div>
  );
}
