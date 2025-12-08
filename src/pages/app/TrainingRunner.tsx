import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Check, Clock, Zap, Brain } from "lucide-react";
import {
  getTrainingById,
  calculateFastThinkingScore,
  calculateSlowThinkingScore,
  TrainingResponse,
  TrainingStep,
} from "@/lib/trainings";
import { cn } from "@/lib/utils";

const TrainingRunner = () => {
  const { trainingId } = useParams<{ trainingId: string }>();
  const navigate = useNavigate();
  
  const training = getTrainingById(trainingId || "");
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [responses, setResponses] = useState<TrainingResponse[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [reflectionText, setReflectionText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const currentStep = training?.steps[currentStepIndex];
  const totalSteps = training?.steps.length || 0;
  const progress = ((currentStepIndex + 1) / totalSteps) * 100;
  const isFast = training?.mode === "fast";

  // Timer for steps with time hints
  useEffect(() => {
    if (currentStep?.timeHintSeconds && !isComplete) {
      setTimeLeft(currentStep.timeHintSeconds);
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
  }, [currentStepIndex, currentStep, isComplete]);

  if (!training) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Training not found</p>
      </div>
    );
  }

  const handleNext = () => {
    // Save response
    if (currentStep) {
      const response: TrainingResponse = {
        stepId: currentStep.id,
      };

      if (currentStep.type === "multiple_choice" && selectedOption !== null) {
        response.selectedOptionIndex = selectedOption;
        response.isCorrect = selectedOption === currentStep.correctOptionIndex;
      } else if (currentStep.type === "open_reflection") {
        response.reflectionText = reflectionText;
      }

      setResponses((prev) => [...prev.filter((r) => r.stepId !== currentStep.id), response]);
    }

    // Move to next step or complete
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex((prev) => prev + 1);
      setSelectedOption(null);
      setReflectionText("");
    } else {
      // Calculate score and complete
      const finalResponses = [
        ...responses.filter((r) => r.stepId !== currentStep?.id),
        {
          stepId: currentStep?.id || "",
          selectedOptionIndex: selectedOption ?? undefined,
          reflectionText: currentStep?.type === "open_reflection" ? reflectionText : undefined,
          isCorrect: currentStep?.type === "multiple_choice" 
            ? selectedOption === currentStep?.correctOptionIndex 
            : undefined,
        },
      ];

      const calculatedScore = isFast
        ? calculateFastThinkingScore(finalResponses, training)
        : calculateSlowThinkingScore(finalResponses, training);
      
      setScore(calculatedScore);
      setIsComplete(true);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
      const prevStep = training.steps[currentStepIndex - 1];
      const prevResponse = responses.find((r) => r.stepId === prevStep.id);
      if (prevResponse) {
        setSelectedOption(prevResponse.selectedOptionIndex ?? null);
        setReflectionText(prevResponse.reflectionText || "");
      }
    }
  };

  const canProceed = () => {
    if (!currentStep) return false;
    if (currentStep.type === "info") return true;
    if (currentStep.type === "multiple_choice") return selectedOption !== null;
    if (currentStep.type === "open_reflection") return reflectionText.trim().length > 0;
    return true;
  };

  // Completion Screen
  if (isComplete) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          <div className={cn(
            "w-20 h-20 rounded-full flex items-center justify-center mb-6",
            isFast ? "bg-warning/10" : "bg-primary/10"
          )}>
            <Check className={cn("w-10 h-10", isFast ? "text-warning" : "text-primary")} />
          </div>

          <h1 className="text-2xl font-semibold text-foreground mb-2">Training Complete</h1>
          <p className="text-muted-foreground text-sm text-center mb-8">
            {isFast 
              ? "Your fast thinking skills are sharpening."
              : "Your structured reasoning is improving."}
          </p>

          <div className="p-6 rounded-2xl bg-card border border-border/40 w-full max-w-sm mb-8">
            <p className="label-uppercase text-center mb-2">
              {isFast ? "Fast Thinking Score" : "Slow Thinking Score"}
            </p>
            <div className="flex items-center justify-center">
              <span className="text-5xl font-semibold text-foreground number-display">{score}</span>
              <span className="text-muted-foreground text-lg ml-1">/100</span>
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              {score >= 75 
                ? "Excellent performance!" 
                : score >= 50 
                  ? "Good progress. Keep training." 
                  : "Keep practicing to improve."}
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
              onClick={() => navigate(`/app/trainings?mode=${training.mode}`)}
            >
              More Trainings
            </Button>
          </div>

          <p className="text-[10px] text-muted-foreground/60 text-center mt-8 uppercase tracking-wider">
            Your brain is not fixed. It's trainable.
          </p>
        </div>
      </div>
    );
  }

  // Training Step UI
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
              {isFast ? (
                <Zap className="w-4 h-4 text-warning" />
              ) : (
                <Brain className="w-4 h-4 text-primary" />
              )}
              <span className="text-sm font-medium text-foreground">{training.title}</span>
            </div>
            <div className="w-8" />
          </div>
          
          {/* Progress bar */}
          <div className="mt-3 h-1 bg-muted rounded-full overflow-hidden">
            <div
              className={cn("h-full transition-all duration-500", isFast ? "bg-warning" : "bg-primary")}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[10px] text-muted-foreground">
              Step {currentStepIndex + 1} of {totalSteps}
            </span>
            {timeLeft !== null && timeLeft > 0 && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">{timeLeft}s</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 container px-4 py-6 max-w-md mx-auto">
        {currentStep && (
          <div className="animate-fade-in">
            <h2 className="text-lg font-semibold text-foreground mb-2">{currentStep.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              {currentStep.instruction}
            </p>

            {/* Multiple Choice */}
            {currentStep.type === "multiple_choice" && currentStep.options && (
              <div className="space-y-3">
                {currentStep.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedOption(index)}
                    className={cn(
                      "w-full p-4 rounded-xl text-left transition-all active:scale-[0.98]",
                      "border",
                      selectedOption === index
                        ? isFast
                          ? "bg-warning/10 border-warning/50 text-foreground"
                          : "bg-primary/10 border-primary/50 text-foreground"
                        : "bg-card border-border/40 text-foreground hover:border-border"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0",
                        selectedOption === index
                          ? isFast ? "border-warning bg-warning" : "border-primary bg-primary"
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
            {currentStep.type === "open_reflection" && (
              <Textarea
                value={reflectionText}
                onChange={(e) => setReflectionText(e.target.value)}
                placeholder={currentStep.reflectionPlaceholder}
                className="min-h-[160px] bg-card border-border/40 text-foreground placeholder:text-muted-foreground/50 resize-none"
              />
            )}

            {/* Info - no input needed */}
            {currentStep.type === "info" && (
              <div className="p-4 rounded-xl bg-card/50 border border-border/30">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider text-center">
                  Take a moment to absorb this concept
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer Actions */}
      <footer className="sticky bottom-0 bg-background/95 backdrop-blur-xl border-t border-border/30 p-4 safe-area-pb">
        <div className="max-w-md mx-auto flex gap-3">
          {currentStepIndex > 0 && (
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
            {currentStepIndex < totalSteps - 1 ? "Next" : "Complete"}
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default TrainingRunner;