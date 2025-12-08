import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSession } from "@/contexts/SessionContext";
import { useAuth } from "@/contexts/AuthContext";
import { getProtocol, type Protocol, type ProtocolStep } from "@/lib/protocols";
import { cn } from "@/lib/utils";
import { ArrowRight, Check, X, Star } from "lucide-react";

export function ProtocolRunner() {
  const navigate = useNavigate();
  const { currentSession, completeSession, clearCurrentSession } = useSession();
  const { user } = useAuth();
  const [protocol, setProtocol] = useState<Protocol | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [rating, setRating] = useState<number | null>(null);

  useEffect(() => {
    if (currentSession?.type && currentSession?.durationOption) {
      const p = getProtocol(currentSession.type, currentSession.durationOption);
      if (p) {
        setProtocol(p);
      }
    }
  }, [currentSession]);

  const handleNextStep = () => {
    if (protocol && currentStepIndex < protocol.steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      setIsComplete(true);
    }
  };

  const handleComplete = () => {
    if (user) {
      completeSession(user.id, rating ?? undefined);
    }
    navigate("/app");
  };

  const handleCancel = () => {
    clearCurrentSession();
    navigate("/app");
  };

  if (!protocol || !currentSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card variant="elevated" className="p-8 text-center max-w-md">
          <p className="text-muted-foreground mb-4">No active session found.</p>
          <Button onClick={() => navigate("/app")}>Return Home</Button>
        </Card>
      </div>
    );
  }

  const currentStep = protocol.steps[currentStepIndex];
  const progress = ((currentStepIndex + 1) / protocol.steps.length) * 100;

  if (isComplete) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md animate-scale-in">
          <Card variant="glow" className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Session Complete</h2>
            <p className="text-muted-foreground mb-8">
              You completed the {protocol.title} protocol.
            </p>

            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">How do you feel now?</p>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={cn(
                      "p-2 rounded-lg transition-all",
                      rating && rating >= star
                        ? "text-primary"
                        : "text-muted-foreground hover:text-primary/50"
                    )}
                  >
                    <Star className={cn("w-8 h-8", rating && rating >= star && "fill-primary")} />
                  </button>
                ))}
              </div>

              <Button onClick={handleComplete} variant="hero" className="w-full mt-6">
                Done
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-4 flex items-center justify-between">
        <button
          onClick={handleCancel}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <span className="text-sm text-muted-foreground">
          Step {currentStepIndex + 1} of {protocol.steps.length}
        </span>
        <div className="w-9" /> {/* Spacer */}
      </header>

      {/* Progress bar */}
      <div className="px-4">
        <div className="h-1 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-primary transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg animate-fade-in" key={currentStepIndex}>
          <Card variant="elevated" className="p-8">
            <div className="text-center">
              <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                {protocol.title}
              </span>
              
              <h2 className="text-2xl font-bold mb-4">{currentStep.title}</h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                {currentStep.description}
              </p>

              <div className="mt-8 pt-8 border-t border-border">
                <span className="text-sm text-muted-foreground">
                  ~{currentStep.durationSeconds} seconds
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4">
        <Button onClick={handleNextStep} variant="hero" size="xl" className="w-full">
          {currentStepIndex < protocol.steps.length - 1 ? (
            <>
              Next Step
              <ArrowRight className="w-5 h-5" />
            </>
          ) : (
            <>
              Complete
              <Check className="w-5 h-5" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
