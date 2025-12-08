import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useSession } from "@/contexts/SessionContext";
import { feelingOptions, durationOptions, type FeelingOption, type DurationOption } from "@/lib/protocols";
import { cn } from "@/lib/utils";
import { ArrowRight, Clock } from "lucide-react";

interface SessionStartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStart: () => void;
}

export function SessionStartModal({ open, onOpenChange, onStart }: SessionStartModalProps) {
  const { currentSession, setSessionParams } = useSession();
  const [step, setStep] = useState<"feeling" | "duration">("feeling");
  const [selectedFeeling, setSelectedFeeling] = useState<FeelingOption | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<DurationOption | null>(null);

  const handleFeelingSelect = (feeling: FeelingOption) => {
    setSelectedFeeling(feeling);
    setSessionParams({ feelingBefore: feeling });
    setStep("duration");
  };

  const handleDurationSelect = (duration: DurationOption) => {
    setSelectedDuration(duration);
    setSessionParams({ durationOption: duration });
  };

  const handleStart = () => {
    if (selectedFeeling && selectedDuration) {
      onStart();
      // Reset for next time
      setStep("feeling");
      setSelectedFeeling(null);
      setSelectedDuration(null);
    }
  };

  const getTitle = () => {
    switch (currentSession?.type) {
      case "stress":
        return "Reduce Stress";
      case "clarity":
        return "Boost Clarity";
      case "decision":
        return "Decision Pro";
      default:
        return "Start Session";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl">{getTitle()}</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {step === "feeling" ? (
            <div className="space-y-4">
              <p className="text-muted-foreground">How do you feel right now?</p>
              <div className="grid grid-cols-2 gap-3">
                {feelingOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleFeelingSelect(option.value)}
                    className={cn(
                      "p-4 rounded-xl border text-left transition-all",
                      selectedFeeling === option.value
                        ? "border-primary bg-primary/10"
                        : "border-border bg-secondary/50 hover:border-primary/50"
                    )}
                  >
                    <span className="text-2xl mb-2 block">{option.emoji}</span>
                    <span className="text-sm font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setStep("feeling")}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Back
                </button>
              </div>
              <p className="text-muted-foreground">How much time do you have?</p>
              <div className="space-y-3">
                {durationOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleDurationSelect(option.value)}
                    className={cn(
                      "w-full p-4 rounded-xl border flex items-center justify-between transition-all",
                      selectedDuration === option.value
                        ? "border-primary bg-primary/10"
                        : "border-border bg-secondary/50 hover:border-primary/50"
                    )}
                  >
                    <span className="font-medium">{option.label}</span>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">{option.minutes}</span>
                    </div>
                  </button>
                ))}
              </div>

              <Button
                onClick={handleStart}
                disabled={!selectedDuration}
                variant="hero"
                className="w-full mt-4"
              >
                Start Protocol
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
