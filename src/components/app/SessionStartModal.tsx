import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useSession } from "@/contexts/SessionContext";
import { mindsetOptions, durationOptions, protocolTypeLabels, type MindsetOption, type DurationOption } from "@/lib/protocols";
import { cn } from "@/lib/utils";
import { ArrowRight, Clock } from "lucide-react";

interface SessionStartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStart: () => void;
}

export function SessionStartModal({ open, onOpenChange, onStart }: SessionStartModalProps) {
  const { currentSession, setSessionParams } = useSession();
  const [step, setStep] = useState<"mindset" | "duration">("mindset");
  const [selectedMindset, setSelectedMindset] = useState<MindsetOption | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<DurationOption | null>(null);

  const handleMindsetSelect = (mindset: MindsetOption) => {
    setSelectedMindset(mindset);
    setSessionParams({ feelingBefore: mindset });
    setStep("duration");
  };

  const handleDurationSelect = (duration: DurationOption) => {
    setSelectedDuration(duration);
    setSessionParams({ durationOption: duration });
  };

  const handleStart = () => {
    if (selectedMindset && selectedDuration) {
      onStart();
      // Reset for next time
      setStep("mindset");
      setSelectedMindset(null);
      setSelectedDuration(null);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setStep("mindset");
      setSelectedMindset(null);
      setSelectedDuration(null);
    }
    onOpenChange(open);
  };

  const moduleInfo = currentSession?.type ? protocolTypeLabels[currentSession.type] : null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl">{moduleInfo?.title || "Start Session"}</DialogTitle>
          {moduleInfo && (
            <p className="text-sm text-muted-foreground mt-1">{moduleInfo.subtitle}</p>
          )}
        </DialogHeader>

        <div className="py-4">
          {step === "mindset" ? (
            <div className="space-y-4">
              <p className="text-muted-foreground text-sm">Current cognitive state:</p>
              <div className="space-y-2">
                {mindsetOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleMindsetSelect(option.value)}
                    className={cn(
                      "w-full p-4 rounded-xl border text-left transition-all min-h-[60px]",
                      selectedMindset === option.value
                        ? "border-primary bg-primary/8"
                        : "border-border bg-secondary/30 hover:border-primary/30"
                    )}
                  >
                    <span className="font-medium block">{option.label}</span>
                    <span className="text-xs text-muted-foreground">{option.description}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setStep("mindset")}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Back
                </button>
              </div>
              <p className="text-muted-foreground text-sm">Session duration:</p>
              <div className="space-y-2">
                {durationOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleDurationSelect(option.value)}
                    className={cn(
                      "w-full p-4 rounded-xl border flex items-center justify-between transition-all min-h-[60px]",
                      selectedDuration === option.value
                        ? "border-primary bg-primary/8"
                        : "border-border bg-secondary/30 hover:border-primary/30"
                    )}
                  >
                    <span className="font-medium">{option.label}</span>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-mono">{option.minutes}</span>
                    </div>
                  </button>
                ))}
              </div>

              <Button
                onClick={handleStart}
                disabled={!selectedDuration}
                variant="hero"
                className="w-full mt-4 min-h-[52px]"
              >
                Begin Training
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}