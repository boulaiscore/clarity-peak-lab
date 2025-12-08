import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Check, Clock, Zap, Brain, Lightbulb, Target, FlaskConical, Workflow, Sparkles, Scale } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useGenerateTrainingSession, useSaveTrainingSession, useUpdateUserMetrics } from "@/hooks/useExercises";
import { 
  CognitiveExercise, 
  ExerciseCategory, 
  ExerciseDuration,
  CATEGORY_INFO,
  hasCorrectAnswer,
  calculateSessionScore,
  getMetricUpdates,
} from "@/lib/exercises";
import { markSessionCompleted } from "@/lib/notifications";
import { toast } from "@/hooks/use-toast";

const CATEGORY_ICONS: Record<ExerciseCategory, React.ElementType> = {
  reasoning: FlaskConical,
  clarity: Target,
  decision: Workflow,
  fast: Zap,
  slow: Brain,
  bias: Scale,
  logic_puzzle: Lightbulb,
  creative: Sparkles,
};

const DynamicTrainingRunner = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const category = (searchParams.get("category") as ExerciseCategory) || "reasoning";
  const duration = (searchParams.get("duration") as ExerciseDuration) || "2min";
  
  const generateSession = useGenerateTrainingSession();
  const saveSession = useSaveTrainingSession();
  const updateMetrics = useUpdateUserMetrics();
  
  const [exercises, setExercises] = useState<CognitiveExercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<Map<string, { selectedIndex?: number; text?: string }>>(new Map());
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [reflectionText, setReflectionText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [sessionScore, setSessionScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const currentExercise = exercises[currentIndex];
  const totalExercises = exercises.length;
  const progress = totalExercises > 0 ? ((currentIndex + 1) / totalExercises) * 100 : 0;
  
  const categoryInfo = CATEGORY_INFO[category];
  const CategoryIcon = CATEGORY_ICONS[category] || Brain;
  const isFastMode = category === "fast";
  
  // Generate exercises on mount
  useEffect(() => {
    const loadExercises = async () => {
      console.log("Loading exercises for category:", category, "duration:", duration);
      setIsLoading(true);
      setError(null);
      
      try {
        const result = await generateSession.mutateAsync({ category, duration });
        console.log("Loaded exercises:", result.length);
        
        if (!result || result.length === 0) {
          setError("No exercises available for this category.");
          setIsLoading(false);
          return;
        }
        
        setExercises(result);
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to load exercises:", err);
        setError("Failed to load exercises. Please try again.");
        setIsLoading(false);
      }
    };
    
    loadExercises();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, duration]);
  
  // Timer for timed exercises
  useEffect(() => {
    if (isFastMode && currentExercise && !isComplete) {
      setTimeLeft(15); // 15 seconds for fast thinking
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev === null || prev <= 0) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [currentIndex, isFastMode, isComplete]);
  
  const saveCurrentResponse = () => {
    if (!currentExercise) return;
    
    const newResponses = new Map(responses);
    newResponses.set(currentExercise.id, {
      selectedIndex: selectedOption ?? undefined,
      text: reflectionText || undefined,
    });
    setResponses(newResponses);
    return newResponses;
  };
  
  const handleNext = async () => {
    const updatedResponses = saveCurrentResponse();
    
    if (currentIndex < totalExercises - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setReflectionText("");
    } else {
      // Complete the session
      const { score, correctAnswers, totalQuestions } = calculateSessionScore(
        exercises,
        updatedResponses || responses
      );
      
      setSessionScore(score);
      setIsComplete(true);
      
      // Save session and update metrics
      if (user?.id) {
        try {
          await saveSession.mutateAsync({
            user_id: user.id,
            training_mode: category,
            duration_option: duration,
            exercises_used: exercises.map((e) => e.id),
            score,
            correct_answers: correctAnswers,
            total_questions: totalQuestions,
            completed_at: new Date().toISOString(),
          });
          
          const metricUpdates = getMetricUpdates(exercises, updatedResponses || responses);
          await updateMetrics.mutateAsync({
            userId: user.id,
            metricUpdates,
          });
          
          // Mark session completed for notification scheduling
          markSessionCompleted();
        } catch (error) {
          console.error("Failed to save session:", error);
        }
      }
    }
  };
  
  const handleBack = () => {
    if (currentIndex > 0) {
      saveCurrentResponse();
      setCurrentIndex((prev) => prev - 1);
      const prevExercise = exercises[currentIndex - 1];
      const prevResponse = responses.get(prevExercise.id);
      setSelectedOption(prevResponse?.selectedIndex ?? null);
      setReflectionText(prevResponse?.text || "");
    }
  };
  
  const canProceed = () => {
    if (!currentExercise) return false;
    if (currentExercise.type === "open_reflection") {
      return reflectionText.trim().length > 0;
    }
    if (hasCorrectAnswer(currentExercise.type)) {
      return selectedOption !== null;
    }
    return true;
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading exercises...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <p className="text-destructive mb-4 text-center">{error}</p>
        <Button onClick={() => navigate("/app")}>Back to Home</Button>
      </div>
    );
  }
  
  if (!currentExercise && !isComplete) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <p className="text-muted-foreground mb-4">No exercises available.</p>
        <Button onClick={() => navigate("/app")}>Back to Home</Button>
      </div>
    );
  }
  
  // Completion Screen
  if (isComplete) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          <div className={cn(
            "w-20 h-20 rounded-full flex items-center justify-center mb-6",
            isFastMode ? "bg-warning/10" : "bg-primary/10"
          )}>
            <Check className={cn("w-10 h-10", isFastMode ? "text-warning" : "text-primary")} />
          </div>
          
          <h1 className="text-2xl font-semibold text-foreground mb-2">Training Complete</h1>
          <p className="text-muted-foreground text-sm text-center mb-8">
            {categoryInfo.title} session finished
          </p>
          
          <div className="p-6 rounded-2xl bg-card border border-border/40 w-full max-w-sm mb-8">
            <p className="label-uppercase text-center mb-2">Session Score</p>
            <div className="flex items-center justify-center">
              <span className="text-5xl font-semibold text-foreground number-display">{sessionScore}</span>
              <span className="text-muted-foreground text-lg ml-1">/100</span>
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              {sessionScore >= 75
                ? "Excellent performance!"
                : sessionScore >= 50
                  ? "Good progress. Keep training."
                  : "Keep practicing to improve."}
            </p>
          </div>
          
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 w-full max-w-sm mb-8">
            <p className="text-[11px] text-muted-foreground text-center">
              <span className="text-primary font-medium">Your metrics have been updated.</span>
              <br />
              Exercise sets rotate and adapt over time.
            </p>
          </div>
          
          <div className="w-full max-w-sm space-y-3">
            <Button
              variant="premium"
              className="w-full"
              size="lg"
              onClick={() => navigate("/app/dashboard")}
            >
              View Dashboard
            </Button>
            <Button
              variant="subtle"
              className="w-full"
              size="lg"
              onClick={() => navigate("/app")}
            >
              Back to Home
            </Button>
          </div>
          
          <p className="text-[10px] text-muted-foreground/60 text-center mt-8 uppercase tracking-wider">
            Your brain is not fixed. It's trainable.
          </p>
        </div>
      </div>
    );
  }
  
  // Training UI
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border/30">
        <div className="container px-4 py-3">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon-sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2">
              <CategoryIcon className={cn("w-4 h-4", isFastMode ? "text-warning" : "text-primary")} />
              <span className="text-sm font-medium text-foreground">{categoryInfo.title}</span>
            </div>
            <div className="w-8" />
          </div>
          
          {/* Progress bar */}
          <div className="mt-3 h-1 bg-muted rounded-full overflow-hidden">
            <div
              className={cn("h-full transition-all duration-500", isFastMode ? "bg-warning" : "bg-primary")}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[10px] text-muted-foreground">
              Exercise {currentIndex + 1} of {totalExercises}
            </span>
            {timeLeft !== null && timeLeft > 0 && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <span className={cn(
                  "text-[10px]",
                  timeLeft <= 5 ? "text-destructive" : "text-muted-foreground"
                )}>
                  {timeLeft}s
                </span>
              </div>
            )}
          </div>
        </div>
      </header>
      
      {/* Content */}
      <main className="flex-1 container px-4 py-6 max-w-md mx-auto">
        {currentExercise && (
          <div className="animate-fade-in">
            <h2 className="text-lg font-semibold text-foreground mb-2">{currentExercise.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              {currentExercise.prompt}
            </p>
            
            {/* Multiple Choice / Scenario / Logic / Fallacy */}
            {hasCorrectAnswer(currentExercise.type) && currentExercise.options && (
              <div className="space-y-3">
                {currentExercise.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedOption(index)}
                    className={cn(
                      "w-full p-4 rounded-xl text-left transition-all active:scale-[0.98]",
                      "border",
                      selectedOption === index
                        ? isFastMode
                          ? "bg-warning/10 border-warning/50 text-foreground"
                          : "bg-primary/10 border-primary/50 text-foreground"
                        : "bg-card border-border/40 text-foreground hover:border-border"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0",
                        selectedOption === index
                          ? isFastMode ? "border-warning bg-warning" : "border-primary bg-primary"
                          : "border-muted-foreground/30"
                      )}>
                        {selectedOption === index && (
                          <Check className="w-3 h-3 text-primary-foreground" />
                        )}
                      </div>
                      <span className="text-sm">{option}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
            
            {/* Open Reflection */}
            {currentExercise.type === "open_reflection" && (
              <Textarea
                value={reflectionText}
                onChange={(e) => setReflectionText(e.target.value)}
                placeholder="Write your reflection here..."
                className="min-h-[160px] bg-card border-border/40 text-foreground placeholder:text-muted-foreground/50 resize-none"
              />
            )}
          </div>
        )}
      </main>
      
      {/* Footer Actions */}
      <footer className="sticky bottom-0 bg-background/95 backdrop-blur-xl border-t border-border/30 p-4 safe-area-pb">
        <div className="max-w-md mx-auto flex gap-3">
          {currentIndex > 0 && (
            <Button variant="subtle" onClick={handleBack} className="px-6">
              Back
            </Button>
          )}
          <Button
            variant="premium"
            className="flex-1"
            onClick={handleNext}
            disabled={!canProceed()}
          >
            {currentIndex < totalExercises - 1 ? "Next" : "Complete"}
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default DynamicTrainingRunner;
