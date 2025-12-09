import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Check, X, Trophy, Brain, Play } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useExercises, useUpdateUserMetrics } from "@/hooks/useExercises";
import { useSaveNeuroGymSession } from "@/hooks/useNeuroGym";
import { 
  NeuroGymArea, 
  NeuroGymDuration, 
  NEURO_GYM_AREAS,
  generateNeuroGymSession,
} from "@/lib/neuroGym";
import { CognitiveExercise, getMetricUpdates } from "@/lib/exercises";
import { toast } from "sonner";

// Generic visual drill component for Focus Arena exercises
function FocusDrill({ 
  exercise, 
  onComplete 
}: { 
  exercise: CognitiveExercise; 
  onComplete: (result: { score: number; correct: number }) => void;
}) {
  const [timeLeft, setTimeLeft] = useState(30);
  const [isActive, setIsActive] = useState(false);
  const [targets, setTargets] = useState<Array<{ id: number; x: number; y: number; isGreen: boolean; visible: boolean }>>([]);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [missed, setMissed] = useState(0);
  const [nextTargetId, setNextTargetId] = useState(0);

  // Start the exercise
  const startExercise = useCallback(() => {
    setIsActive(true);
    setTimeLeft(30);
    setScore(0);
    setCorrect(0);
    setMissed(0);
    setTargets([]);
    setNextTargetId(0);
  }, []);

  // Timer countdown
  useEffect(() => {
    if (!isActive || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, timeLeft]);

  // Complete when time runs out
  useEffect(() => {
    if (timeLeft === 0 && !isActive) {
      const finalScore = Math.max(0, Math.min(100, Math.round((correct / Math.max(1, correct + missed)) * 100)));
      onComplete({ score: finalScore, correct });
    }
  }, [timeLeft, isActive, correct, missed, onComplete]);

  // Spawn targets periodically
  useEffect(() => {
    if (!isActive) return;

    const spawnTarget = () => {
      const isGreen = Math.random() > 0.3; // 70% green targets
      const newTarget = {
        id: nextTargetId,
        x: 10 + Math.random() * 80, // 10-90% of container width
        y: 10 + Math.random() * 80, // 10-90% of container height
        isGreen,
        visible: true,
      };
      
      setTargets(prev => [...prev.slice(-5), newTarget]); // Keep max 6 targets
      setNextTargetId(prev => prev + 1);

      // Auto-remove target after 1.5s if not tapped
      setTimeout(() => {
        setTargets(prev => {
          const target = prev.find(t => t.id === newTarget.id);
          if (target?.visible && target.isGreen) {
            setMissed(m => m + 1);
          }
          return prev.filter(t => t.id !== newTarget.id);
        });
      }, 1500);
    };

    // Spawn first target immediately
    spawnTarget();
    
    // Then spawn every 800ms
    const interval = setInterval(spawnTarget, 800);
    return () => clearInterval(interval);
  }, [isActive, nextTargetId]);

  // Handle target tap
  const handleTargetTap = (targetId: number, isGreen: boolean) => {
    if (isGreen) {
      setScore(prev => prev + 10);
      setCorrect(prev => prev + 1);
    } else {
      setScore(prev => Math.max(0, prev - 5));
    }
    
    setTargets(prev => prev.filter(t => t.id !== targetId));
  };

  if (!isActive && timeLeft === 30) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <h2 className="text-xl font-semibold mb-3">{exercise.title}</h2>
        <p className="text-muted-foreground text-center mb-8 max-w-sm">{exercise.prompt}</p>
        
        <Button size="lg" onClick={startExercise} className="w-full max-w-xs">
          <Play className="w-5 h-5 mr-2" />
          Start (30s)
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col px-4 py-4">
      {/* Stats bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{timeLeft}</p>
            <p className="text-xs text-muted-foreground">seconds</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-lg font-semibold text-green-500">{correct}</p>
            <p className="text-xs text-muted-foreground">hits</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold">{score}</p>
            <p className="text-xs text-muted-foreground">score</p>
          </div>
        </div>
      </div>

      {/* Game area */}
      <div 
        className="flex-1 relative rounded-2xl bg-card/30 border border-border/50 overflow-hidden min-h-[300px]"
        style={{ touchAction: 'none' }}
      >
        {targets.map(target => (
          <button
            key={target.id}
            onClick={() => handleTargetTap(target.id, target.isGreen)}
            className={`absolute w-12 h-12 rounded-full transform -translate-x-1/2 -translate-y-1/2 transition-all duration-100 active:scale-90 ${
              target.isGreen 
                ? 'bg-green-500 hover:bg-green-400 shadow-lg shadow-green-500/30' 
                : 'bg-red-500 hover:bg-red-400 shadow-lg shadow-red-500/30'
            }`}
            style={{
              left: `${target.x}%`,
              top: `${target.y}%`,
            }}
          />
        ))}
        
        {targets.length === 0 && isActive && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-muted-foreground text-sm">Targets incoming...</p>
          </div>
        )}
      </div>

      <p className="text-center text-sm text-muted-foreground mt-4">
        Tap green targets! Avoid red ones.
      </p>
    </div>
  );
}

export default function NeuroGymSessionRunner() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const area = searchParams.get("area") as NeuroGymArea;
  const duration = searchParams.get("duration") as NeuroGymDuration;
  
  const { data: allExercises, isLoading: exercisesLoading } = useExercises();
  const saveSession = useSaveNeuroGymSession();
  const updateMetrics = useUpdateUserMetrics();
  
  const [sessionExercises, setSessionExercises] = useState<CognitiveExercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<Map<string, { score: number; correct: number }>>(new Map());
  const [isComplete, setIsComplete] = useState(false);
  const [sessionScore, setSessionScore] = useState({ score: 0, correctAnswers: 0, totalQuestions: 0 });

  // Generate session exercises with trainingGoals filtering
  useEffect(() => {
    if (allExercises && allExercises.length > 0 && area) {
      const exercises = generateNeuroGymSession(
        area, 
        duration || "2min", 
        allExercises,
        user?.trainingGoals
      );
      setSessionExercises(exercises);
    }
  }, [allExercises, area, duration, user?.trainingGoals]);

  const areaConfig = useMemo(() => {
    if (area === "neuro-activation") {
      return {
        title: "Neuro Activation Session™",
        subtitle: "Complete Cognitive Activation Protocol",
        description: "A complete cognitive warm-up protocol"
      };
    }
    const found = NEURO_GYM_AREAS.find(a => a.id === area);
    if (!found) {
      return {
        title: "Cognitive Training",
        subtitle: "Training Session",
        description: "Cognitive training exercises"
      };
    }
    return found;
  }, [area]);

  const currentExercise = sessionExercises[currentIndex];
  const progress = sessionExercises.length > 0 ? ((currentIndex + 1) / sessionExercises.length) * 100 : 0;

  const handleExerciseComplete = useCallback((result: { score: number; correct: number }) => {
    if (!currentExercise) return;
    
    setResponses(prev => {
      const updated = new Map(prev);
      updated.set(currentExercise.id, result);
      return updated;
    });
    
    // Auto advance after brief delay
    setTimeout(() => {
      handleNext();
    }, 1000);
  }, [currentExercise]);

  const handleNext = async () => {
    if (currentIndex < sessionExercises.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Complete session
      let totalScore = 0;
      let totalCorrect = 0;
      
      responses.forEach(response => {
        totalScore += response.score;
        totalCorrect += response.correct;
      });
      
      const averageScore = sessionExercises.length > 0 
        ? Math.round(totalScore / sessionExercises.length) 
        : 0;
      
      setSessionScore({ 
        score: averageScore, 
        correctAnswers: totalCorrect, 
        totalQuestions: sessionExercises.length 
      });
      setIsComplete(true);
      
      // Save session
      if (user) {
        try {
          await saveSession.mutateAsync({
            user_id: user.id,
            area: area,
            duration_option: duration || "2min",
            exercises_used: sessionExercises.map(e => e.id),
            score: averageScore,
            correct_answers: totalCorrect,
            total_questions: sessionExercises.length,
            completed_at: new Date().toISOString(),
          });
          
          const metricUpdates = getMetricUpdates(sessionExercises, responses);
          await updateMetrics.mutateAsync({ userId: user.id, metricUpdates });
          
          toast.success("Session completed!");
        } catch (error) {
          console.error("Error saving session:", error);
          toast.error("Failed to save session");
        }
      }
    }
  };

  if (!area) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-muted-foreground">Invalid session parameters</p>
          <Button variant="ghost" onClick={() => navigate("/neuro-gym")} className="mt-4">
            Back to Neuro Gym
          </Button>
        </div>
      </div>
    );
  }

  if (exercisesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading exercises...</p>
        </div>
      </div>
    );
  }

  if (!exercisesLoading && sessionExercises.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold mb-2">No Exercises Available</h2>
          <p className="text-muted-foreground text-sm mb-6">
            This training area doesn't have exercises yet. Check back soon!
          </p>
          <Button onClick={() => navigate("/neuro-gym")} className="w-full">
            Back to Neuro Gym
          </Button>
        </div>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-6">
          <Trophy className="w-10 h-10 text-primary" />
        </div>
        
        <h1 className="text-2xl font-bold mb-2">Session Complete!</h1>
        <p className="text-muted-foreground text-center mb-6">
          {area === "neuro-activation" 
            ? "Your brain is primed for deep work."
            : `Great work training your ${areaConfig?.title}!`
          }
        </p>
        
        <div className="p-6 rounded-xl bg-card/50 border border-border/50 mb-6 w-full max-w-sm">
          <div className="text-center">
            <p className="text-4xl font-bold text-primary">{sessionScore.score}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Average Score
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {sessionScore.correctAnswers} targets hit across {sessionScore.totalQuestions} exercises
            </p>
          </div>
        </div>
        
        <div className="flex flex-col gap-3 w-full max-w-sm">
          <Button onClick={() => navigate("/app/dashboard")} className="w-full">
            View Dashboard
          </Button>
          <Button variant="outline" onClick={() => navigate("/neuro-gym")} className="w-full">
            Back to Neuro Gym
          </Button>
        </div>
      </div>
    );
  }

  if (!currentExercise) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">No exercise found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border/30 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => navigate("/neuro-gym")} className="text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium">
            {areaConfig?.title}
          </span>
          <span className="text-xs text-muted-foreground">
            {currentIndex + 1}/{sessionExercises.length}
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="h-1 bg-border/30 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      {/* Exercise Content */}
      <FocusDrill 
        key={currentExercise.id}
        exercise={currentExercise} 
        onComplete={handleExerciseComplete} 
      />
    </div>
  );
}
