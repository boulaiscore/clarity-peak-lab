import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Check, X, Trophy, Brain, Play } from "lucide-react";
import { cn } from "@/lib/utils";
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
  const [isExerciseActive, setIsExerciseActive] = useState(false);
  const [exerciseTimeLeft, setExerciseTimeLeft] = useState(30);

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

  // Exercise timer
  useEffect(() => {
    if (!isExerciseActive || exerciseTimeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setExerciseTimeLeft(prev => {
        if (prev <= 1) {
          // Time's up - auto complete with 0 score
          handleExerciseComplete(0, 0);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isExerciseActive, exerciseTimeLeft]);

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

  const handleStartExercise = () => {
    setIsExerciseActive(true);
    setExerciseTimeLeft(30);
  };

  const handleExerciseComplete = (score: number, correct: number) => {
    if (!currentExercise) return;
    
    setResponses(prev => {
      const updated = new Map(prev);
      updated.set(currentExercise.id, { score, correct });
      return updated;
    });
    
    setIsExerciseActive(false);
    
    // Auto advance after brief delay
    setTimeout(() => {
      handleNext();
    }, 800);
  };

  // Simple tap response for visual tasks
  const handleTap = () => {
    if (!isExerciseActive) return;
    
    // For now, simulate a correct tap (this will be replaced with actual drill logic)
    const response = responses.get(currentExercise?.id || "") || { score: 0, correct: 0 };
    setResponses(prev => {
      const updated = new Map(prev);
      updated.set(currentExercise?.id || "", { 
        score: response.score + 10, 
        correct: response.correct + 1 
      });
      return updated;
    });
  };

  const handleNext = async () => {
    if (currentIndex < sessionExercises.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsExerciseActive(false);
      setExerciseTimeLeft(30);
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

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setIsExerciseActive(false);
      setExerciseTimeLeft(30);
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
              {sessionScore.totalQuestions} exercises completed
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
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-6">
        <div className="max-w-lg mx-auto w-full text-center">
          {/* Timer */}
          {isExerciseActive && (
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border-4 border-primary">
                <span className="text-2xl font-bold">{exerciseTimeLeft}</span>
              </div>
            </div>
          )}
          
          <h2 className="text-xl font-semibold mb-3">{currentExercise.title}</h2>
          <p className="text-muted-foreground mb-8">{currentExercise.prompt}</p>
          
          {/* Exercise Area */}
          {!isExerciseActive ? (
            <Button 
              size="lg" 
              onClick={handleStartExercise}
              className="w-full max-w-xs mx-auto"
            >
              <Play className="w-5 h-5 mr-2" />
              Start Exercise (30s)
            </Button>
          ) : (
            <div 
              className="w-full aspect-square max-w-sm mx-auto rounded-2xl bg-card/50 border border-border/50 flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
              onClick={handleTap}
            >
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-green-500 mx-auto mb-4 animate-pulse" />
                <p className="text-sm text-muted-foreground">Tap when ready!</p>
              </div>
            </div>
          )}
          
          {/* Response indicator */}
          {responses.has(currentExercise.id) && !isExerciseActive && (
            <div className="mt-6 p-4 rounded-xl bg-primary/10 border border-primary/20">
              <p className="text-sm text-primary font-medium">
                Score: {responses.get(currentExercise.id)?.score || 0}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer Navigation */}
      <footer className="sticky bottom-0 bg-background/90 backdrop-blur-xl border-t border-border/30 px-4 py-4 safe-area-pb">
        <div className="flex gap-3 max-w-lg mx-auto">
          <Button 
            variant="outline" 
            onClick={handleBack}
            disabled={currentIndex === 0 || isExerciseActive}
            className="flex-1"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button 
            onClick={handleNext}
            disabled={isExerciseActive || !responses.has(currentExercise.id)}
            className="flex-1"
          >
            {currentIndex === sessionExercises.length - 1 ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Complete
              </>
            ) : (
              <>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </footer>
    </div>
  );
}
