// Go/No-Go Drill - Tap green, ignore red
import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

interface GoNoGoDrillProps {
  config: {
    goColor: string;
    noGoColor: string;
    trialsCount: number;
    displayTime: number;
    goProbability: number;
  };
  timeLimit: number;
  onComplete: (result: { 
    hits: number; 
    misses: number; 
    falseAlarms: number; 
    avgReactionTime: number 
  }) => void;
}

export function GoNoGoDrill({ config, timeLimit, onComplete }: GoNoGoDrillProps) {
  const [trial, setTrial] = useState(0);
  const [currentStimulus, setCurrentStimulus] = useState<"go" | "nogo" | null>(null);
  const [showStimulus, setShowStimulus] = useState(false);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [falseAlarms, setFalseAlarms] = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<"hit" | "miss" | "false_alarm" | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [canRespond, setCanRespond] = useState(false);
  
  const stimulusShownAt = useRef(0);
  const respondedThisTrial = useRef(false);

  const goColor = config.goColor || "#22c55e";
  const noGoColor = config.noGoColor || "#ef4444";
  const trialsCount = config.trialsCount || 20;
  const displayTime = config.displayTime || 1000;
  const goProbability = config.goProbability || 0.7;

  const runTrial = useCallback(() => {
    // Check if all trials are complete BEFORE running
    if (trial >= trialsCount) {
      return; // Don't run more trials, completion is handled by effect
    }

    // Random inter-trial interval
    const iti = 500 + Math.random() * 1000;
    
    setTimeout(() => {
      if (trial >= trialsCount) return; // Double-check in timeout
      
      const isGo = Math.random() < goProbability;
      setCurrentStimulus(isGo ? "go" : "nogo");
      setShowStimulus(true);
      setCanRespond(true);
      respondedThisTrial.current = false;
      stimulusShownAt.current = Date.now();
      setFeedback(null);

      // End of stimulus display
      setTimeout(() => {
        setShowStimulus(false);
        setCanRespond(false);

        // If it was a GO trial and no response, mark as miss
        if (!respondedThisTrial.current && isGo) {
          setMisses(prev => prev + 1);
          setFeedback("miss");
        }

        // Move to next trial after brief delay
        setTimeout(() => {
          setTrial(prev => prev + 1);
          setFeedback(null);
        }, 300);
      }, displayTime);
    }, iti);
  }, [trial, trialsCount, goProbability, displayTime]);

  // Handle completion separately
  useEffect(() => {
    if (trial >= trialsCount && !isComplete) {
      setIsComplete(true);
      const avgRT = reactionTimes.length > 0 
        ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
        : 0;
      onComplete({ hits, misses, falseAlarms, avgReactionTime: avgRT });
    }
  }, [trial, trialsCount, isComplete, hits, misses, falseAlarms, reactionTimes, onComplete]);

  useEffect(() => {
    if (!isComplete && trial < trialsCount && !showStimulus && feedback === null) {
      runTrial();
    }
  }, [trial, isComplete, showStimulus, feedback, runTrial, trialsCount]);

  const handleTap = () => {
    if (!canRespond || respondedThisTrial.current) return;
    respondedThisTrial.current = true;

    const rt = Date.now() - stimulusShownAt.current;

    if (currentStimulus === "go") {
      setHits(prev => prev + 1);
      setReactionTimes(prev => [...prev, rt]);
      setFeedback("hit");
    } else {
      setFalseAlarms(prev => prev + 1);
      setFeedback("false_alarm");
    }
  };

  if (isComplete) {
    const accuracy = trialsCount > 0 
      ? Math.round(((hits + (trialsCount - hits - misses - falseAlarms)) / trialsCount) * 100) 
      : 0;
    
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="text-6xl mb-4">⚡</div>
        <p className="text-xl font-semibold">Drill Complete!</p>
        <div className="mt-4 text-center space-y-1">
          <p className="text-muted-foreground">Hits: <span className="text-green-500 font-semibold">{hits}</span></p>
          <p className="text-muted-foreground">Misses: <span className="text-yellow-500 font-semibold">{misses}</span></p>
          <p className="text-muted-foreground">False Alarms: <span className="text-red-500 font-semibold">{falseAlarms}</span></p>
          <p className="text-muted-foreground mt-2">
            Avg RT: <span className="text-primary font-semibold">
              {reactionTimes.length > 0 ? Math.round(reactionTimes.reduce((a,b) => a+b, 0) / reactionTimes.length) : 0}ms
            </span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="flex-1 flex flex-col items-center justify-center p-6 select-none"
      onClick={handleTap}
    >
      {/* Progress */}
      <div className="w-full max-w-xs mb-8">
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>Trial {Math.min(trial + 1, trialsCount)} / {trialsCount}</span>
          <span>Hits: {hits}</span>
        </div>
        <div className="h-2 bg-border rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all"
            style={{ width: `${(trial / trialsCount) * 100}%` }}
          />
        </div>
      </div>

      {/* Stimulus Area */}
      <div className={cn(
        "w-48 h-48 rounded-full flex items-center justify-center transition-all duration-100 cursor-pointer",
        showStimulus && currentStimulus === "go" && "scale-100",
        showStimulus && currentStimulus === "nogo" && "scale-100",
        !showStimulus && "bg-card/30 border-2 border-dashed border-border"
      )}
      style={{
        backgroundColor: showStimulus 
          ? (currentStimulus === "go" ? goColor : noGoColor)
          : undefined
      }}>
        {showStimulus && (
          <span className="text-6xl text-white font-bold animate-scale-in">
            {currentStimulus === "go" ? "→" : "×"}
          </span>
        )}
        {!showStimulus && !feedback && (
          <span className="text-muted-foreground">Wait...</span>
        )}
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={cn(
          "mt-4 px-4 py-2 rounded-full text-sm font-medium",
          feedback === "hit" && "bg-green-500/20 text-green-500",
          feedback === "miss" && "bg-yellow-500/20 text-yellow-500",
          feedback === "false_alarm" && "bg-red-500/20 text-red-500"
        )}>
          {feedback === "hit" && "Hit! ✓"}
          {feedback === "miss" && "Missed!"}
          {feedback === "false_alarm" && "False alarm!"}
        </div>
      )}

      {/* Instructions */}
      <div className="mt-8 text-center">
        <p className="text-sm text-muted-foreground">
          <span className="inline-block w-3 h-3 rounded-full mr-1" style={{ backgroundColor: goColor }} /> TAP when green
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          <span className="inline-block w-3 h-3 rounded-full mr-1" style={{ backgroundColor: noGoColor }} /> IGNORE when red
        </p>
      </div>
    </div>
  );
}