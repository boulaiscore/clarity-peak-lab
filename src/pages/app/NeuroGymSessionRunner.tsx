import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ArrowRight, Check, X, Trophy, Brain, Gamepad2 } from "lucide-react";
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
import { 
  CognitiveExercise, 
  hasCorrectAnswer, 
  getMetricUpdates 
} from "@/lib/exercises";
import { getVisualConfig, isVisualDrill } from "@/data/visual_exercises";
import { VisualDrillRenderer } from "@/components/drills/VisualDrillRenderer";
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
  const [responses, setResponses] = useState<Map<string, { selectedIndex?: number; text?: string; visualResult?: any }>>(new Map());
  const [isComplete, setIsComplete] = useState(false);
  const [sessionScore, setSessionScore] = useState({ score: 0, correctAnswers: 0, totalQuestions: 0 });

  // Generate session exercises with trainingGoals filtering
  useEffect(() => {
    if (allExercises && allExercises.length > 0 && area) {
      const exercises = generateNeuroGymSession(
        area, 
        duration || "2min", 
        allExercises,
        user?.trainingGoals // Pass user's training goals for filtering
      );
      setSessionExercises(exercises);
    }
  }, [allExercises, area, duration, user?.trainingGoals]);

  const areaConfig = useMemo(() => {
    if (area === "neuro-activation") {
      return {
        title: "Neuro Activation Session™",
        subtitle: "Complete Cognitive Activation Protocol"
      };
    }
    return NEURO_GYM_AREAS.find(a => a.id === area);
  }, [area]);

  const currentExercise = sessionExercises[currentIndex];
  const progress = sessionExercises.length > 0 ? ((currentIndex + 1) / sessionExercises.length) * 100 : 0;

  // Check if current exercise is a visual drill
  const isCurrentVisualDrill = currentExercise && isVisualDrill(currentExercise.id);
  const visualConfig = isCurrentVisualDrill ? getVisualConfig(currentExercise.id) : null;

  const handleSelectOption = (optionIndex: number) => {
    if (!currentExercise) return;
    
    setResponses(prev => {
      const updated = new Map(prev);
      updated.set(currentExercise.id, { 
        ...updated.get(currentExercise.id), 
        selectedIndex: optionIndex 
      });
      return updated;
    });
  };

  const handleTextChange = (text: string) => {
    if (!currentExercise) return;
    
    setResponses(prev => {
      const updated = new Map(prev);
      updated.set(currentExercise.id, { 
        ...updated.get(currentExercise.id), 
        text 
      });
      return updated;
    });
  };

  const handleVisualDrillComplete = (result: any) => {
    if (!currentExercise) return;
    
    setResponses(prev => {
      const updated = new Map(prev);
      updated.set(currentExercise.id, { 
        visualResult: result 
      });
      return updated;
    });
    
    // Auto-advance after visual drill
    setTimeout(() => {
      handleNext();
    }, 500);
  };

  const canProceed = () => {
    if (!currentExercise) return false;
    
    const response = responses.get(currentExercise.id);
    
    // Visual drills auto-complete
    if (isCurrentVisualDrill) {
      return response?.visualResult !== undefined;
    }
    
    if (currentExercise.type === "open_reflection") {
      return response?.text && response.text.trim().length > 5;
    }
    
    return response?.selectedIndex !== undefined;
  };

  const handleNext = async () => {
    if (currentIndex < sessionExercises.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Complete session - calculate score including visual drills
      let totalScore = 0;
      let totalCorrect = 0;
      let totalQuestions = 0;
      
      sessionExercises.forEach(ex => {
        const response = responses.get(ex.id);
        
        if (isVisualDrill(ex.id) && response?.visualResult) {
          // Use visual drill result
          const vr = response.visualResult;
          if (vr.score !== undefined) totalScore += vr.score;
          if (vr.correct !== undefined) totalCorrect += vr.correct;
          if (vr.totalCorrect !== undefined) totalCorrect += vr.totalCorrect;
          totalQuestions += 1;
        } else if (hasCorrectAnswer(ex.type) && response?.selectedIndex !== undefined) {
          totalQuestions++;
          if (response.selectedIndex === ex.correct_option_index) {
            totalCorrect++;
          }
        }
      });
      
      const finalScore = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : totalScore;
      setSessionScore({ score: finalScore, correctAnswers: totalCorrect, totalQuestions });
      setIsComplete(true);
      
      // Save session and update metrics
      if (user) {
        try {
          await saveSession.mutateAsync({
            user_id: user.id,
            area: area,
            duration_option: duration || "2min",
            exercises_used: sessionExercises.map(e => e.id),
            score: finalScore,
            correct_answers: totalCorrect,
            total_questions: totalQuestions,
            completed_at: new Date().toISOString(),
          });
          
          const metricUpdates = getMetricUpdates(sessionExercises, responses);
          await updateMetrics.mutateAsync({ userId: user.id, metricUpdates });
          
          toast.success("Session completed! Metrics updated.");
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

  if (exercisesLoading || sessionExercises.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
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
            ? "You've completed a full Neuro Activation Session. Your brain is primed for deep work and high-stakes decisions."
            : area === "visual_game"
            ? "Excellent visual training! Your visual processing and reaction speed are improving."
            : `Great work training your ${areaConfig?.title || "cognitive abilities"}!`
          }
        </p>
        
        {sessionScore.totalQuestions > 0 && (
          <div className="p-6 rounded-xl bg-card/50 border border-border/50 mb-6 w-full max-w-sm">
            <div className="text-center">
              <p className="text-4xl font-bold text-primary">{sessionScore.score}%</p>
              <p className="text-sm text-muted-foreground mt-1">
                {sessionScore.correctAnswers} of {sessionScore.totalQuestions} correct
              </p>
            </div>
          </div>
        )}

        {area === "neuro-activation" && (
          <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 mb-6 w-full max-w-sm">
            <div className="flex items-center gap-3 mb-2">
              <Brain className="w-5 h-5 text-primary" />
              <span className="font-semibold text-sm">Cognitive Activation</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Focus, Working Memory, Executive Control, Creativity, and Reasoning 
              have all been activated in this session.
            </p>
          </div>
        )}

        {area === "visual_game" && (
          <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 mb-6 w-full max-w-sm">
            <div className="flex items-center gap-3 mb-2">
              <Gamepad2 className="w-5 h-5 text-primary" />
              <span className="font-semibold text-sm">Visual Training Complete</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Visual Processing, Reaction Speed, and Focus Stability 
              have been trained in this session.
            </p>
          </div>
        )}
        
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

  // Render Visual Drill
  if (isCurrentVisualDrill && visualConfig) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border/30 px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => navigate("/neuro-gym")} className="text-muted-foreground">
              <X className="w-5 h-5" />
            </button>
            <span className="text-sm font-medium">
              {currentExercise.title}
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

        {/* Visual Drill Content */}
        <main className="flex-1 flex flex-col">
          <VisualDrillRenderer 
            config={visualConfig} 
            onComplete={handleVisualDrillComplete} 
          />
        </main>
      </div>
    );
  }

  // Render Standard Exercise
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border/30 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => navigate("/neuro-gym")} className="text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium">
            {areaConfig?.title} – {duration || "2min"}
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
      <main className="flex-1 px-4 py-6 overflow-y-auto">
        <div className="max-w-lg mx-auto">
          <h2 className="text-lg font-semibold mb-2">{currentExercise.title}</h2>
          <p className="text-muted-foreground mb-6">{currentExercise.prompt}</p>
          
          {/* Multiple Choice Options */}
          {currentExercise.options && currentExercise.options.length > 0 && (
            <div className="grid gap-3">
              {currentExercise.options.map((option, idx) => {
                const isSelected = responses.get(currentExercise.id)?.selectedIndex === idx;
                
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(idx)}
                    className={cn(
                      "w-full p-4 rounded-xl border text-left transition-all duration-200",
                      isSelected 
                        ? "bg-primary/20 border-primary text-foreground" 
                        : "bg-card/50 border-border/50 hover:border-primary/40"
                    )}
                  >
                    <span className="text-sm">{option}</span>
                  </button>
                );
              })}
            </div>
          )}
          
          {/* Open Reflection */}
          {currentExercise.type === "open_reflection" && (
            <Textarea
              placeholder="Write your reflection here..."
              value={responses.get(currentExercise.id)?.text || ""}
              onChange={(e) => handleTextChange(e.target.value)}
              className="min-h-[150px] bg-card/50 border-border/50"
            />
          )}
        </div>
      </main>

      {/* Footer Navigation */}
      <footer className="sticky bottom-0 bg-background/90 backdrop-blur-xl border-t border-border/30 px-4 py-4 safe-area-pb">
        <div className="flex gap-3 max-w-lg mx-auto">
          <Button 
            variant="outline" 
            onClick={handleBack}
            disabled={currentIndex === 0}
            className="flex-1"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button 
            onClick={handleNext}
            disabled={!canProceed()}
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
