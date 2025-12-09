import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth, TrainingGoal, SessionDuration, DailyTimeCommitment, Gender, WorkType } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Zap, Brain, Clock, Calendar, ArrowRight, User, Briefcase } from "lucide-react";

type Step = 1 | 2 | 3 | 4 | 5 | 6;

const Onboarding = () => {
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const [step, setStep] = useState<Step>(1);
  
  // Personal data
  const [age, setAge] = useState<number | undefined>(undefined);
  const [gender, setGender] = useState<Gender | undefined>(undefined);
  const [workType, setWorkType] = useState<WorkType | undefined>(undefined);
  
  // Training preferences
  const [trainingGoals, setTrainingGoals] = useState<TrainingGoal[]>([]);
  const [sessionDuration, setSessionDuration] = useState<SessionDuration | undefined>(undefined);
  const [dailyTimeCommitment, setDailyTimeCommitment] = useState<DailyTimeCommitment | undefined>(undefined);

  const handleNext = () => {
    if (step < 6) {
      setStep((s) => (s + 1) as Step);
    }
  };

  const handleComplete = () => {
    updateUser({
      age,
      gender,
      workType,
      trainingGoals,
      sessionDuration,
      dailyTimeCommitment,
      onboardingCompleted: true,
    });
    navigate("/app");
  };

  const toggleGoal = (goal: TrainingGoal) => {
    setTrainingGoals(prev => 
      prev.includes(goal) 
        ? prev.filter(g => g !== goal)
        : [...prev, goal]
    );
  };

  const genderOptions: { value: Gender; label: string }[] = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "other", label: "Other" },
    { value: "prefer_not_to_say", label: "Prefer not to say" },
  ];

  const workTypeOptions: { value: WorkType; label: string; description: string }[] = [
    { value: "knowledge", label: "Knowledge Work", description: "Research, analysis, consulting" },
    { value: "creative", label: "Creative", description: "Design, writing, art" },
    { value: "technical", label: "Technical", description: "Engineering, development" },
    { value: "management", label: "Management", description: "Leadership, strategy" },
    { value: "student", label: "Student", description: "Learning, studying" },
    { value: "other", label: "Other", description: "Something else" },
  ];

  const goalOptions: { value: TrainingGoal; icon: React.ElementType; title: string; description: string }[] = [
    { 
      value: "fast_thinking", 
      icon: Zap, 
      title: "Fast Thinking", 
      description: "Improve intuition, snap judgments, and quick reactions" 
    },
    { 
      value: "slow_thinking", 
      icon: Brain, 
      title: "Slow Thinking", 
      description: "Develop structured reasoning and deeper analysis" 
    },
  ];

  const durationOptions: { value: SessionDuration; label: string; description: string }[] = [
    { value: "30s", label: "30 seconds", description: "Quick cognitive reset" },
    { value: "2min", label: "2 minutes", description: "Focused training" },
    { value: "5min", label: "5 minutes", description: "Deep practice" },
    { value: "7min", label: "7 minutes", description: "Comprehensive session" },
  ];

  const dailyTimeOptions: { value: DailyTimeCommitment; label: string; description: string }[] = [
    { value: "3min", label: "3 minutes", description: "Micro-sessions" },
    { value: "10min", label: "10 minutes", description: "Daily habit" },
    { value: "30min", label: "30 minutes", description: "Deep commitment" },
  ];

  const ageOptions = [
    { min: 18, max: 25, label: "18-25" },
    { min: 26, max: 35, label: "26-35" },
    { min: 36, max: 45, label: "36-45" },
    { min: 46, max: 55, label: "46-55" },
    { min: 56, max: 65, label: "56-65" },
    { min: 66, max: 100, label: "65+" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress indicator */}
      <div className="p-6">
        <div className="flex gap-2 max-w-xs mx-auto">
          {[1, 2, 3, 4, 5, 6].map((s) => (
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
                Get Started
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          )}

          {/* Step 2: Personal Data */}
          {step === 2 && (
            <div className="animate-fade-in">
              <div className="text-center mb-8">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-2xl font-semibold mb-2 tracking-tight">
                  Tell us about yourself
                </h1>
                <p className="text-muted-foreground text-sm">
                  This helps personalize your training experience
                </p>
              </div>
              
              {/* Age */}
              <div className="mb-6">
                <label className="text-sm font-medium mb-3 block">Age Range</label>
                <div className="grid grid-cols-3 gap-2">
                  {ageOptions.map((option) => (
                    <button
                      key={option.label}
                      onClick={() => setAge(option.min)}
                      className={cn(
                        "p-3 rounded-xl border text-sm transition-all",
                        age !== undefined && age >= option.min && age <= option.max
                          ? "border-primary bg-primary/8"
                          : "border-border bg-card hover:border-primary/30"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Gender */}
              <div className="mb-8">
                <label className="text-sm font-medium mb-3 block">Gender (optional)</label>
                <div className="grid grid-cols-2 gap-2">
                  {genderOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setGender(option.value)}
                      className={cn(
                        "p-3 rounded-xl border text-sm transition-all",
                        gender === option.value
                          ? "border-primary bg-primary/8"
                          : "border-border bg-card hover:border-primary/30"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <Button onClick={handleNext} variant="hero" className="w-full min-h-[56px]">
                Continue
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          )}

          {/* Step 3: Work Type */}
          {step === 3 && (
            <div className="animate-fade-in">
              <div className="text-center mb-8">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-2xl font-semibold mb-2 tracking-tight">
                  What kind of work do you do?
                </h1>
              </div>
              
              <div className="space-y-2 mb-8">
                {workTypeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setWorkType(option.value)}
                    className={cn(
                      "w-full p-4 rounded-xl border text-left transition-all",
                      workType === option.value
                        ? "border-primary bg-primary/8"
                        : "border-border bg-card hover:border-primary/30"
                    )}
                  >
                    <span className="font-medium block">{option.label}</span>
                    <span className="text-sm text-muted-foreground">{option.description}</span>
                  </button>
                ))}
              </div>

              <Button 
                onClick={handleNext} 
                variant="hero" 
                className="w-full min-h-[56px]"
                disabled={!workType}
              >
                Continue
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          )}

          {/* Step 4: Training Goals */}
          {step === 4 && (
            <div className="animate-fade-in">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-semibold mb-2 tracking-tight">
                  What do you want to improve?
                </h1>
                <p className="text-muted-foreground text-sm">
                  Select one or both
                </p>
              </div>
              
              <div className="space-y-3 mb-8">
                {goalOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => toggleGoal(option.value)}
                    className={cn(
                      "w-full p-5 rounded-xl border text-left transition-all flex items-start gap-4",
                      trainingGoals.includes(option.value)
                        ? "border-primary bg-primary/8"
                        : "border-border bg-card hover:border-primary/30"
                    )}
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                      option.value === "fast_thinking" ? "bg-warning/10" : "bg-primary/10"
                    )}>
                      <option.icon className={cn(
                        "w-6 h-6",
                        option.value === "fast_thinking" ? "text-warning" : "text-primary"
                      )} />
                    </div>
                    <div>
                      <span className="font-semibold block mb-1">{option.title}</span>
                      <span className="text-sm text-muted-foreground">{option.description}</span>
                    </div>
                  </button>
                ))}
              </div>

              <Button
                onClick={handleNext}
                variant="hero"
                className="w-full min-h-[56px]"
                disabled={trainingGoals.length === 0}
              >
                Continue
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          )}

          {/* Step 5: Session Duration */}
          {step === 5 && (
            <div className="animate-fade-in">
              <div className="text-center mb-8">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-2xl font-semibold mb-2 tracking-tight">
                  Preferred exercise duration
                </h1>
                <p className="text-muted-foreground text-sm">
                  How long should each exercise be?
                </p>
              </div>
              
              <div className="space-y-2 mb-8">
                {durationOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSessionDuration(option.value)}
                    className={cn(
                      "w-full p-4 rounded-xl border text-left transition-all flex items-center justify-between",
                      sessionDuration === option.value
                        ? "border-primary bg-primary/8"
                        : "border-border bg-card hover:border-primary/30"
                    )}
                  >
                    <div>
                      <span className="font-semibold block">{option.label}</span>
                      <span className="text-sm text-muted-foreground">{option.description}</span>
                    </div>
                    <Clock className="w-5 h-5 text-muted-foreground" />
                  </button>
                ))}
              </div>

              <Button
                onClick={handleNext}
                variant="hero"
                className="w-full min-h-[56px]"
                disabled={!sessionDuration}
              >
                Continue
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          )}

          {/* Step 6: Daily Time Commitment */}
          {step === 6 && (
            <div className="animate-fade-in">
              <div className="text-center mb-8">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-2xl font-semibold mb-2 tracking-tight">
                  Daily training time
                </h1>
                <p className="text-muted-foreground text-sm">
                  How much time can you dedicate each day?
                </p>
              </div>
              
              <div className="space-y-2 mb-8">
                {dailyTimeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setDailyTimeCommitment(option.value)}
                    className={cn(
                      "w-full p-4 rounded-xl border text-left transition-all flex items-center justify-between",
                      dailyTimeCommitment === option.value
                        ? "border-primary bg-primary/8"
                        : "border-border bg-card hover:border-primary/30"
                    )}
                  >
                    <div>
                      <span className="font-semibold block">{option.label}</span>
                      <span className="text-sm text-muted-foreground">{option.description}</span>
                    </div>
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                  </button>
                ))}
              </div>

              <Button
                onClick={handleComplete}
                variant="hero"
                className="w-full min-h-[56px]"
                disabled={!dailyTimeCommitment}
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
