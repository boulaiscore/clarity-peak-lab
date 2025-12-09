import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Clock, CheckCircle, Brain } from "lucide-react";

interface OpenReflectionDrillProps {
  title: string;
  prompt: string;
  duration: string; // "2min", "3min", "5min"
  onComplete: (result: { score: number; correct: number; wordCount: number }) => void;
}

function parseDurationToSeconds(duration: string): number {
  if (duration.includes("min")) {
    return parseInt(duration) * 60;
  }
  if (duration.includes("s")) {
    return parseInt(duration);
  }
  return 180; // Default 3 minutes
}

export function OpenReflectionDrill({ title, prompt, duration, onComplete }: OpenReflectionDrillProps) {
  const totalTime = parseDurationToSeconds(duration);
  const [timeLeft, setTimeLeft] = useState(totalTime);
  const [response, setResponse] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  
  const wordCount = response.trim().split(/\s+/).filter(w => w.length > 0).length;
  const charCount = response.trim().length;
  
  // Calculate score based on thoughtfulness of response
  const calculateScore = useCallback(() => {
    // Score based on word count (minimum 30 words for full score)
    const wordScore = Math.min(100, (wordCount / 30) * 100);
    // Bonus for longer, more thoughtful responses (up to 50 words)
    const depthBonus = wordCount >= 50 ? 10 : 0;
    return Math.min(100, Math.round(wordScore + depthBonus));
  }, [wordCount]);
  
  const handleComplete = useCallback(() => {
    if (isComplete) return;
    setIsComplete(true);
    const score = calculateScore();
    onComplete({ 
      score, 
      correct: wordCount >= 30 ? 1 : 0, 
      wordCount 
    });
  }, [isComplete, calculateScore, onComplete, wordCount]);
  
  // Timer countdown
  useEffect(() => {
    if (isComplete) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isComplete, handleComplete]);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  if (isComplete) {
    const score = calculateScore();
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-6 animate-in fade-in-50 duration-500">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-2xl font-semibold text-foreground">Riflessione Completata</h2>
        <div className="text-center space-y-2">
          <p className="text-muted-foreground">
            Parole scritte: <span className="text-foreground font-medium">{wordCount}</span>
          </p>
          <p className="text-muted-foreground">
            Punteggio: <span className="text-primary font-semibold text-xl">{score}%</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-4 space-y-4">
      {/* Header with timer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-primary">
          <Brain className="w-5 h-5" />
          <span className="text-sm font-medium">Slow Thinking</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span className="font-mono text-lg">{formatTime(timeLeft)}</span>
        </div>
      </div>
      
      {/* Progress bar */}
      <Progress value={progress} className="h-1" />
      
      {/* Title and prompt */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        <p className="text-muted-foreground leading-relaxed">{prompt}</p>
      </div>
      
      {/* Response textarea */}
      <div className="flex-1 min-h-0">
        <Textarea
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          placeholder="Scrivi la tua riflessione qui..."
          className="h-full min-h-[200px] resize-none text-base"
          autoFocus
        />
      </div>
      
      {/* Footer with word count and submit */}
      <div className="flex items-center justify-between pt-2">
        <div className="text-sm text-muted-foreground">
          <span className={wordCount >= 30 ? "text-primary" : ""}>
            {wordCount} parole
          </span>
          {wordCount < 30 && (
            <span className="ml-1">(min. 30 per punteggio pieno)</span>
          )}
        </div>
        <Button 
          onClick={handleComplete}
          disabled={charCount < 10}
          className="px-6"
        >
          Completa
        </Button>
      </div>
    </div>
  );
}
