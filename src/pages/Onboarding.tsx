import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth, TrainingGoal, SessionDuration, DailyTimeCommitment, Gender, WorkType } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Zap, Brain, Clock, Calendar, ArrowRight, User, Briefcase } from "lucide-react";

type Step = 1 | 2 | 3 | 4 | 5 | 6;

const Onboarding = () => {
  const navigate = useNavigate();
  const { updateUser, user } = useAuth();
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

  const handleComplete = async () => {
    await updateUser({
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
      description: "Improve intuition and quick reactions" 
    },
    { 
      value: "slow_thinking", 
      icon: Brain, 
      title: "Slow Thinking", 
      description: "Develop structured reasoning" 
    },
  ];

  const durationOptions: { value: SessionDuration; label: string; description: string }[] = [
    { value: "30s", label: "30 sec", description: "Quick reset" },
    { value: "2min", label: "2 min", description: "Focused" },
    { value: "5min", label: "5 min", description: "Deep practice" },
    { value: "7min", label: "7 min", description: "Comprehensive" },
  ];

  const dailyTimeOptions: { value: DailyTimeCommitment; label: string; description: string }[] = [
    { value: "3min", label: "3 min", description: "Micro-sessions" },
    { value: "10min", label: "10 min", description: "Daily habit" },
    { value: "30min", label: "30 min", description: "Deep commitment" },
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
      <div className="px-5 pt-6 pb-4">
        <div className="flex gap-1.5 max-w-[200px] mx-auto">
          {[1, 2, 3, 4, 5, 6].map((s) => (
            <div
              key={s}
              className={cn(
                "h-[3px] flex-1 rounded-full transition-all",
                s <= step ? "bg-primary" : "bg-muted/50"
              )}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-5 pb-6">
        <div className="w-full max-w-sm">
          {/* Step 1: Welcome */}
          {step === 1 && (
            <div className="text-center animate-fade-in">
              <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-6">
                <span className="text-foreground font-semibold text-xl">N</span>
              </div>
              <h1 className="text-2xl font-semibold mb-3 tracking-tight leading-tight">
                Welcome to NeuroLoop
              </h1>
              <p className="text-[15px] text-muted-foreground mb-2 leading-relaxed">
                Train your mind for elite reasoning.
              </p>
              <p className="text-sm text-muted-foreground/70 mb-10">
                Your thinking is your edge.
              </p>
              <Button onClick={handleNext} variant="hero" className="w-full h-[52px] text-[15px] font-medium">
                Get Started
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}

          {/* Step 2: Personal Data */}
          {step === 2 && (
            <div className="animate-fade-in">
              <div className="text-center mb-6">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <h1 className="text-xl font-semibold mb-1.5 tracking-tight">
                  About you
                </h1>
                <p className="text-muted-foreground text-[13px]">
                  Personalize your experience
                </p>
              </div>
              
              {/* Age */}
              <div className="mb-5">
                <label className="text-[13px] font-medium text-muted-foreground mb-2.5 block">Age</label>
                <div className="grid grid-cols-3 gap-2">
                  {ageOptions.map((option) => (
                    <button
                      key={option.label}
                      onClick={() => setAge(option.min)}
                      className={cn(
                        "py-2.5 px-3 rounded-xl border text-[13px] font-medium transition-all",
                        age !== undefined && age >= option.min && age <= option.max
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border/60 bg-card/50 text-muted-foreground hover:border-primary/40"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Gender */}
              <div className="mb-6">
                <label className="text-[13px] font-medium text-muted-foreground mb-2.5 block">Gender</label>
                <div className="grid grid-cols-2 gap-2">
                  {genderOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setGender(option.value)}
                      className={cn(
                        "py-2.5 px-3 rounded-xl border text-[13px] font-medium transition-all",
                        gender === option.value
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border/60 bg-card/50 text-muted-foreground hover:border-primary/40"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <Button onClick={handleNext} variant="hero" className="w-full h-[52px] text-[15px] font-medium">
                Continue
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}

          {/* Step 3: Work Type */}
          {step === 3 && (
            <div className="animate-fade-in">
              <div className="text-center mb-6">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Briefcase className="w-5 h-5 text-primary" />
                </div>
                <h1 className="text-xl font-semibold mb-1.5 tracking-tight">
                  Your work
                </h1>
              </div>
              
              <div className="space-y-2 mb-6">
                {workTypeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setWorkType(option.value)}
                    className={cn(
                      "w-full py-3 px-4 rounded-xl border text-left transition-all",
                      workType === option.value
                        ? "border-primary bg-primary/10"
                        : "border-border/60 bg-card/50 hover:border-primary/40"
                    )}
                  >
                    <span className="font-medium text-[14px] block">{option.label}</span>
                    <span className="text-[12px] text-muted-foreground">{option.description}</span>
                  </button>
                ))}
              </div>

              <Button 
                onClick={handleNext} 
                variant="hero" 
                className="w-full h-[52px] text-[15px] font-medium"
                disabled={!workType}
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}

          {/* Step 4: Training Goals */}
          {step === 4 && (
            <div className="animate-fade-in">
              <div className="text-center mb-6">
                <h1 className="text-xl font-semibold mb-1.5 tracking-tight">
                  Training focus
                </h1>
                <p className="text-muted-foreground text-[13px]">
                  Select one or both
                </p>
              </div>
              
              <div className="space-y-3 mb-6">
                {goalOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => toggleGoal(option.value)}
                    className={cn(
                      "w-full py-4 px-4 rounded-xl border text-left transition-all flex items-center gap-3.5",
                      trainingGoals.includes(option.value)
                        ? "border-primary bg-primary/10"
                        : "border-border/60 bg-card/50 hover:border-primary/40"
                    )}
                  >
                    <div className={cn(
                      "w-11 h-11 rounded-xl flex items-center justify-center shrink-0",
                      option.value === "fast_thinking" ? "bg-amber-500/15" : "bg-teal-500/15"
                    )}>
                      <option.icon className={cn(
                        "w-5 h-5",
                        option.value === "fast_thinking" ? "text-amber-400" : "text-teal-400"
                      )} />
                    </div>
                    <div>
                      <span className="font-semibold text-[14px] block mb-0.5">{option.title}</span>
                      <span className="text-[12px] text-muted-foreground leading-snug">{option.description}</span>
                    </div>
                  </button>
                ))}
              </div>

              <Button
                onClick={handleNext}
                variant="hero"
                className="w-full h-[52px] text-[15px] font-medium"
                disabled={trainingGoals.length === 0}
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}

          {/* Step 5: Session Duration */}
          {step === 5 && (
            <div className="animate-fade-in">
              <div className="text-center mb-6">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <h1 className="text-xl font-semibold mb-1.5 tracking-tight">
                  Session length
                </h1>
                <p className="text-muted-foreground text-[13px]">
                  Per exercise
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mb-6">
                {durationOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSessionDuration(option.value)}
                    className={cn(
                      "py-4 px-4 rounded-xl border text-center transition-all",
                      sessionDuration === option.value
                        ? "border-primary bg-primary/10"
                        : "border-border/60 bg-card/50 hover:border-primary/40"
                    )}
                  >
                    <span className="font-semibold text-[15px] block mb-0.5">{option.label}</span>
                    <span className="text-[11px] text-muted-foreground">{option.description}</span>
                  </button>
                ))}
              </div>

              <Button
                onClick={handleNext}
                variant="hero"
                className="w-full h-[52px] text-[15px] font-medium"
                disabled={!sessionDuration}
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}

          {/* Step 6: Daily Time Commitment */}
          {step === 6 && (
            <div className="animate-fade-in">
              <div className="text-center mb-6">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <h1 className="text-xl font-semibold mb-1.5 tracking-tight">
                  Daily commitment
                </h1>
                <p className="text-muted-foreground text-[13px]">
                  Time per day
                </p>
              </div>
              
              <div className="space-y-2 mb-6">
                {dailyTimeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setDailyTimeCommitment(option.value)}
                    className={cn(
                      "w-full py-4 px-4 rounded-xl border text-center transition-all",
                      dailyTimeCommitment === option.value
                        ? "border-primary bg-primary/10"
                        : "border-border/60 bg-card/50 hover:border-primary/40"
                    )}
                  >
                    <span className="font-semibold text-[15px] block mb-0.5">{option.label}</span>
                    <span className="text-[11px] text-muted-foreground">{option.description}</span>
                  </button>
                ))}
              </div>

              <Button
                onClick={handleComplete}
                variant="hero"
                className="w-full h-[52px] text-[15px] font-medium"
                disabled={!dailyTimeCommitment}
              >
                Start Training
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Tagline */}
      <div className="py-4 text-center">
        <p className="text-[11px] text-muted-foreground/60 tracking-wide uppercase">
          Cognitive Performance System
        </p>
      </div>
    </div>
  );
};

export default Onboarding;
