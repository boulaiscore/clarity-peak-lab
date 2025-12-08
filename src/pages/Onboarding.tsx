import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { FlaskConical, Target, Workflow, Clock, ArrowRight } from "lucide-react";

type Step = 1 | 2 | 3 | 4;

const Onboarding = () => {
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<string | null>(null);

  const handleNext = () => {
    if (step < 4) {
      setStep((s) => (s + 1) as Step);
    }
  };

  const handleComplete = () => {
    if (selectedMode) {
      updateUser({ goal: selectedMode as any });
    }
    if (selectedDuration) {
      updateUser({ timePreference: selectedDuration as any });
    }
    localStorage.setItem("neuroloop_onboarded", "true");
    navigate("/app");
  };

  const modes = [
    {
      id: "reasoning",
      icon: FlaskConical,
      title: "Reasoning Workout",
      description: "Strengthen analytical and critical thinking.",
    },
    {
      id: "clarity",
      icon: Target,
      title: "Clarity Lab",
      description: "Develop structured, precise, conceptual clarity.",
    },
    {
      id: "decision",
      icon: Workflow,
      title: "Decision Studio",
      description: "Upgrade strategic decision-making under uncertainty.",
    },
  ];

  const durations = [
    { id: "30s", label: "30 seconds", description: "Quick cognitive reset" },
    { id: "2min", label: "2 minutes", description: "Focused training" },
    { id: "5min", label: "5 minutes", description: "Deep practice" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress indicator */}
      <div className="p-6">
        <div className="flex gap-2 max-w-xs mx-auto">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={cn(
                "h-1 flex-1 rounded-full transition-all",
                s <= step ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6 pb-16">
        <div className="w-full max-w-md">
          {/* Step 1: Welcome */}
          {step === 1 && (
            <div className="text-center animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-8">
                <span className="text-foreground font-bold text-2xl">N</span>
              </div>
              <h1 className="text-3xl font-semibold mb-4 tracking-tight">
                Welcome to NeuroLoop Pro
              </h1>
              <p className="text-lg text-muted-foreground mb-3">
                Train your mind for elite reasoning and cognitive longevity.
              </p>
              <p className="text-muted-foreground mb-12">
                You think for a living. Your mind is your edge. Let's strengthen it.
              </p>
              <Button onClick={handleNext} variant="hero" className="w-full min-h-[56px]">
                Continue
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          )}

          {/* Step 2: Why This Matters */}
          {step === 2 && (
            <div className="text-center animate-fade-in">
              <h1 className="text-3xl font-semibold mb-6 tracking-tight">
                Your thinking is your competitive advantage.
              </h1>
              <p className="text-muted-foreground mb-12 leading-relaxed">
                Reasoning, clarity, and strategic judgment are skills — and they compound. 
                NeuroLoop Pro trains your cognitive fitness with short, high-impact sessions.
              </p>
              <Button onClick={handleNext} variant="hero" className="w-full min-h-[56px]">
                Next
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          )}

          {/* Step 3: Choose Mode */}
          {step === 3 && (
            <div className="animate-fade-in">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-semibold mb-2 tracking-tight">
                  Choose your primary training mode.
                </h1>
              </div>
              <div className="space-y-3 mb-8">
                {modes.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setSelectedMode(mode.id)}
                    className={cn(
                      "w-full p-5 rounded-xl border text-left transition-all flex items-start gap-4",
                      selectedMode === mode.id
                        ? "border-primary bg-primary/8"
                        : "border-border bg-card hover:border-primary/30"
                    )}
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <mode.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <span className="font-semibold block mb-1">{mode.title}</span>
                      <span className="text-sm text-muted-foreground">{mode.description}</span>
                    </div>
                  </button>
                ))}
              </div>
              <Button
                onClick={handleNext}
                variant="hero"
                className="w-full min-h-[56px]"
                disabled={!selectedMode}
              >
                Continue
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          )}

          {/* Step 4: Duration */}
          {step === 4 && (
            <div className="animate-fade-in">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-semibold mb-2 tracking-tight">
                  Small sessions. Big cognitive gains.
                </h1>
                <p className="text-muted-foreground">
                  Just like muscles grow with training, your cognitive capacity improves through consistent practice.
                </p>
              </div>
              <div className="space-y-3 mb-8">
                {durations.map((duration) => (
                  <button
                    key={duration.id}
                    onClick={() => setSelectedDuration(duration.id)}
                    className={cn(
                      "w-full p-5 rounded-xl border text-left transition-all flex items-center justify-between",
                      selectedDuration === duration.id
                        ? "border-primary bg-primary/8"
                        : "border-border bg-card hover:border-primary/30"
                    )}
                  >
                    <div>
                      <span className="font-semibold block mb-1">{duration.label}</span>
                      <span className="text-sm text-muted-foreground">{duration.description}</span>
                    </div>
                    <Clock className="w-5 h-5 text-muted-foreground" />
                  </button>
                ))}
              </div>
              <Button
                onClick={handleComplete}
                variant="hero"
                className="w-full min-h-[56px]"
                disabled={!selectedDuration}
              >
                Start Training
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Tagline */}
      <div className="p-6 text-center">
        <p className="text-xs text-muted-foreground">
          Train your mind for elite reasoning.
        </p>
      </div>
    </div>
  );
};

export default Onboarding;
