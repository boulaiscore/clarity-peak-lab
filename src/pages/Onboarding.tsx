import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format, differenceInYears } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth, TrainingGoal, Gender, WorkType, EducationLevel, DegreeDiscipline } from "@/contexts/AuthContext";
import { useUpdateUserMetrics } from "@/hooks/useExercises";
import { cn } from "@/lib/utils";
import { Zap, Brain, Calendar as CalendarIcon, ArrowRight, User, Briefcase, GraduationCap, Bell, Leaf, Target, Flame } from "lucide-react";
import { InitialAssessment } from "@/components/onboarding/InitialAssessment";
import { useSaveBaseline } from "@/hooks/useBadges";
import { TRAINING_PLANS, TrainingPlanId } from "@/lib/trainingPlans";

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

const Onboarding = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { updateUser, user } = useAuth();
  const updateMetrics = useUpdateUserMetrics();
  const saveBaseline = useSaveBaseline();
  
  // Check if coming from reset assessment
  const isResetAssessment = searchParams.get("step") === "assessment";
  const [step, setStep] = useState<Step>(isResetAssessment ? 9 : 1);
  
  // Personal data
  const [birthDate, setBirthDate] = useState<Date | undefined>(undefined);
  const [gender, setGender] = useState<Gender | undefined>(undefined);
  const [workType, setWorkType] = useState<WorkType | undefined>(undefined);
  const [educationLevel, setEducationLevel] = useState<EducationLevel | undefined>(undefined);
  const [degreeDiscipline, setDegreeDiscipline] = useState<DegreeDiscipline | undefined>(undefined);
  
  const [trainingGoals, setTrainingGoals] = useState<TrainingGoal[]>([]);
  const [trainingPlan, setTrainingPlan] = useState<TrainingPlanId>("light");
  const [reminderTime, setReminderTime] = useState<string>("08:00");
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Calculate age from birth date or use existing user age for reset
  const calculatedAge = birthDate 
    ? differenceInYears(new Date(), birthDate) 
    : (isResetAssessment && user?.age ? user.age : undefined);

  const handleNext = () => {
    if (step < 9) {
      setStep((s) => (s + 1) as Step);
    }
  };

  const handleAssessmentComplete = async (
    results: {
      fastScore: number;
      slowScore: number;
      focusScore: number;
      reasoningScore: number;
      creativityScore: number;
      overallScore: number;
      cognitiveAge: number;
    },
    skipped: boolean = false
  ) => {
    try {
      if (user?.id && !skipped) {
        await updateMetrics.mutateAsync({
          userId: user.id,
          metricUpdates: {
            fast_thinking: results.fastScore,
            slow_thinking: results.slowScore,
            focus_stability: results.focusScore,
            reasoning_accuracy: results.reasoningScore,
            creativity: results.creativityScore,
          },
        });
  
        await saveBaseline.mutateAsync({
          userId: user.id,
          fastThinking: results.fastScore,
          slowThinking: results.slowScore,
          focus: results.focusScore,
          reasoning: results.reasoningScore,
          creativity: results.creativityScore,
          cognitiveAge: results.cognitiveAge,
        });
      }
  
      if (isResetAssessment) {
        navigate("/app/dashboard");
        return;
      }
  
      await updateUser({
        age: calculatedAge,
        birthDate: birthDate ? format(birthDate, "yyyy-MM-dd") : undefined,
        gender,
        workType,
        educationLevel,
        degreeDiscipline,
        trainingGoals,
        sessionDuration: "2min",
        trainingPlan,
        reminderEnabled: true,
        reminderTime,
        onboardingCompleted: true,
      });
  
      navigate("/app");
    } catch (err) {
      console.error("[Onboarding] handleAssessmentComplete FAILED", err);
    }
  };

  const handleAssessmentSkipped = async () => {
    try {
      if (isResetAssessment) {
        navigate("/app/dashboard");
        return;
      }
  
      await updateUser({
        age: calculatedAge,
        birthDate: birthDate ? format(birthDate, "yyyy-MM-dd") : undefined,
        gender,
        workType,
        educationLevel,
        degreeDiscipline,
        trainingGoals,
        sessionDuration: "2min",
        trainingPlan,
        reminderEnabled: true,
        reminderTime,
        onboardingCompleted: true,
      });
  
      navigate("/app");
    } catch (err) {
      console.error("[Onboarding] handleAssessmentSkipped FAILED", err);
    }
  };


  const handleComplete = async () => {
    // Move to reminder time step
    setStep(8);
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
    { value: "management", label: "Leadership", description: "Strategy, management, C-suite" },
    { value: "student", label: "Academic", description: "PhD, research, graduate studies" },
    { value: "other", label: "Other", description: "Something else" },
  ];

  const educationOptions: { value: EducationLevel; label: string; description: string }[] = [
    { value: "high_school", label: "High School", description: "Diploma or equivalent" },
    { value: "bachelor", label: "Bachelor's Degree", description: "Undergraduate degree" },
    { value: "master", label: "Master's Degree", description: "Graduate degree" },
    { value: "phd", label: "PhD / Doctorate", description: "Doctoral degree" },
    { value: "other", label: "Other", description: "Professional or other certification" },
  ];

  const disciplineOptions: { value: DegreeDiscipline; label: string }[] = [
    { value: "stem", label: "STEM (Science, Tech, Engineering, Math)" },
    { value: "business", label: "Business & Economics" },
    { value: "humanities", label: "Humanities & Literature" },
    { value: "social_sciences", label: "Social Sciences" },
    { value: "health", label: "Health & Medicine" },
    { value: "law", label: "Law" },
    { value: "arts", label: "Arts & Design" },
    { value: "other", label: "Other" },
  ];

  const goalOptions: { value: TrainingGoal; icon: React.ElementType; title: string; description: string }[] = [
    { 
      value: "fast_thinking", 
      icon: Zap, 
      title: "System 1: Intuitive", 
      description: "Rapid pattern recognition and strategic intuition" 
    },
    { 
      value: "slow_thinking", 
      icon: Brain, 
      title: "System 2: Deliberate", 
      description: "Deep analysis and critical reasoning" 
    },
  ];

  const planOptions = [
    { 
      id: "light" as TrainingPlanId, 
      icon: Leaf, 
      color: "text-emerald-400 bg-emerald-500/15",
      plan: TRAINING_PLANS.light 
    },
    { 
      id: "expert" as TrainingPlanId, 
      icon: Target, 
      color: "text-blue-400 bg-blue-500/15",
      plan: TRAINING_PLANS.expert 
    },
    { 
      id: "superhuman" as TrainingPlanId, 
      icon: Flame, 
      color: "text-red-400 bg-red-500/15",
      plan: TRAINING_PLANS.superhuman 
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress indicator */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex gap-1.5 max-w-[280px] mx-auto">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((s) => (
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
                Train CEO-level strategic thinking.
              </p>
              <p className="text-sm text-muted-foreground/70 mb-10">
                Your cognitive edge in an age of AI and distraction.
              </p>
              <Button onClick={handleNext} variant="hero" className="w-full h-[52px] text-[15px] font-medium">
                Get Started
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}

          {/* Step 2: Personal Data - Birth Date & Gender */}
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
                  Calibrate your baseline
                </p>
              </div>
              
              {/* Birth Date */}
              <div className="mb-5">
                <label className="text-[13px] font-medium text-muted-foreground mb-2.5 block">Date of Birth</label>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-12 rounded-xl border-border/60 bg-card/50",
                        !birthDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {birthDate ? (
                        <span>
                          {format(birthDate, "PPP")}
                          {calculatedAge && <span className="ml-2 text-muted-foreground">({calculatedAge} years)</span>}
                        </span>
                      ) : (
                        <span>Pick your birth date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-50 bg-card border border-border shadow-xl" align="center" sideOffset={8}>
                    <Calendar
                      mode="single"
                      selected={birthDate}
                      onSelect={(date) => {
                        setBirthDate(date);
                        setCalendarOpen(false);
                      }}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1920-01-01")
                      }
                      defaultMonth={new Date(1990, 0)}
                      captionLayout="dropdown-buttons"
                      fromYear={1920}
                      toYear={new Date().getFullYear()}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
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

              <Button 
                onClick={handleNext} 
                variant="hero" 
                className="w-full h-[52px] text-[15px] font-medium"
                disabled={!birthDate}
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}

          {/* Step 3: Education Level */}
          {step === 3 && (
            <div className="animate-fade-in">
              <div className="text-center mb-6">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <GraduationCap className="w-5 h-5 text-primary" />
                </div>
                <h1 className="text-xl font-semibold mb-1.5 tracking-tight">
                  Education
                </h1>
                <p className="text-muted-foreground text-[13px]">
                  Highest level achieved
                </p>
              </div>
              
              <div className="space-y-2 mb-6">
                {educationOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setEducationLevel(option.value)}
                    className={cn(
                      "w-full py-3 px-4 rounded-xl border text-left transition-all",
                      educationLevel === option.value
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
                disabled={!educationLevel}
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}

          {/* Step 4: Degree Discipline */}
          {step === 4 && (
            <div className="animate-fade-in">
              <div className="text-center mb-6">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <GraduationCap className="w-5 h-5 text-primary" />
                </div>
                <h1 className="text-xl font-semibold mb-1.5 tracking-tight">
                  Field of Study
                </h1>
                <p className="text-muted-foreground text-[13px]">
                  Your primary discipline
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mb-6">
                {disciplineOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setDegreeDiscipline(option.value)}
                    className={cn(
                      "py-3 px-3 rounded-xl border text-[12px] font-medium transition-all text-left",
                      degreeDiscipline === option.value
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border/60 bg-card/50 text-muted-foreground hover:border-primary/40"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <Button 
                onClick={handleNext} 
                variant="hero" 
                className="w-full h-[52px] text-[15px] font-medium"
                disabled={!degreeDiscipline}
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}

          {/* Step 5: Work Type */}
          {step === 5 && (
            <div className="animate-fade-in">
              <div className="text-center mb-6">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Briefcase className="w-5 h-5 text-primary" />
                </div>
                <h1 className="text-xl font-semibold mb-1.5 tracking-tight">
                  Your work
                </h1>
                <p className="text-muted-foreground text-[13px]">
                  How you apply strategic thinking
                </p>
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

          {/* Step 6: Training Goals */}
          {step === 6 && (
            <div className="animate-fade-in">
              <div className="text-center mb-6">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Brain className="w-5 h-5 text-primary" />
                </div>
                <h1 className="text-xl font-semibold mb-1.5 tracking-tight">
                  Which brain area do you want to train?
                </h1>
                <p className="text-muted-foreground text-[13px]">
                  Choose one or both cognitive systems
                </p>
              </div>
              
              <div className="space-y-3 mb-6">
                {goalOptions.map((option) => {
                  const isSelected = trainingGoals.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      onClick={() => toggleGoal(option.value)}
                      className={cn(
                        "w-full py-4 px-4 rounded-xl border text-left transition-all flex items-center gap-3.5 relative",
                        isSelected
                          ? "border-primary bg-primary/10"
                          : "border-border/60 bg-card/50 hover:border-primary/40"
                      )}
                    >
                      {/* Selection indicator */}
                      <div className={cn(
                        "absolute top-3 right-3 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                        isSelected 
                          ? "border-primary bg-primary" 
                          : "border-muted-foreground/30 bg-transparent"
                      )}>
                        {isSelected && (
                          <svg className="w-3 h-3 text-primary-foreground" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      
                      <div className={cn(
                        "w-11 h-11 rounded-xl flex items-center justify-center shrink-0",
                        option.value === "fast_thinking" ? "bg-amber-500/15" : "bg-teal-500/15"
                      )}>
                        <option.icon className={cn(
                          "w-5 h-5",
                          option.value === "fast_thinking" ? "text-amber-400" : "text-teal-400"
                        )} />
                      </div>
                      <div className="pr-6">
                        <span className="font-semibold text-[14px] block mb-0.5">{option.title}</span>
                        <span className="text-[12px] text-muted-foreground leading-snug">{option.description}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Helper text */}
              <p className="text-center text-[12px] text-muted-foreground/70 mb-4">
                {trainingGoals.length === 0 
                  ? "Tap to select at least one system" 
                  : trainingGoals.length === 2 
                    ? "Both systems selected — complete training" 
                    : "You can add the other system too"}
              </p>

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

          {/* Step 7: Training Plan Selection */}
          {step === 7 && (
            <div className="animate-fade-in">
              <div className="text-center mb-6">
                <h1 className="text-xl font-semibold mb-1.5 tracking-tight">
                  Training Plan
                </h1>
                <p className="text-muted-foreground text-[13px]">
                  Choose your intensity level
                </p>
              </div>
              
              <div className="space-y-3 mb-6">
                {planOptions.map((option) => {
                  // Effort scales linearly, but results are higher to show "small nudge, big result"
                  const intensityDots = option.plan.intensity === "low" ? 1 : option.plan.intensity === "medium" ? 2 : 3;
                  const resultsDots = option.plan.intensity === "low" ? 2 : option.plan.intensity === "medium" ? 3 : 3;
                  
                  return (
                    <button
                      key={option.id}
                      onClick={() => setTrainingPlan(option.id)}
                      className={cn(
                        "w-full py-4 px-4 rounded-xl border text-left transition-all",
                        trainingPlan === option.id
                          ? "border-primary bg-primary/10"
                          : "border-border/60 bg-card/50 hover:border-primary/40"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", option.color)}>
                          <option.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold text-[14px] block mb-1">{option.plan.name}</span>
                          <p className="text-[12px] text-muted-foreground mb-2">{option.plan.tagline}</p>
                          
                          {/* Visual indicators */}
                          <div className="flex items-center gap-4 text-[11px]">
                            <div className="flex items-center gap-1.5">
                              <span className="text-muted-foreground/60">Effort</span>
                              <div className="flex gap-0.5">
                                {[1, 2, 3].map((dot) => (
                                  <div 
                                    key={dot}
                                    className={cn(
                                      "w-2 h-2 rounded-full transition-all",
                                      dot <= intensityDots 
                                        ? option.id === "light" ? "bg-emerald-400" : option.id === "expert" ? "bg-blue-400" : "bg-red-400"
                                        : "bg-muted-foreground/20"
                                    )}
                                  />
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-muted-foreground/60">Results</span>
                              <div className="flex gap-0.5">
                                {[1, 2, 3].map((dot) => (
                                  <div 
                                    key={dot}
                                    className={cn(
                                      "w-2 h-2 rounded-full transition-all",
                                      dot <= resultsDots 
                                        ? "bg-primary" 
                                        : "bg-muted-foreground/20"
                                    )}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <Button
                onClick={handleComplete}
                variant="hero"
                className="w-full h-[52px] text-[15px] font-medium"
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}

          {/* Step 8: Daily Training Time */}
          {step === 8 && (
            <div className="animate-fade-in">
              <div className="text-center mb-6">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Bell className="w-5 h-5 text-primary" />
                </div>
                <h1 className="text-xl font-semibold mb-1.5 tracking-tight">
                  Daily Training Time
                </h1>
                <p className="text-muted-foreground text-[13px]">
                  When should we remind you to train?
                </p>
              </div>
              
              <div className="mb-4">
                <Input 
                  type="time" 
                  value={reminderTime} 
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="h-14 text-center text-xl font-medium bg-card/50 border-border/60"
                />
              </div>
              
              <p className="text-xs text-muted-foreground text-center mb-6 px-2">
                💡 You can train at any time during the day — this is just your preferred reminder time.
              </p>

              <Button
                onClick={() => setStep(9)}
                variant="hero"
                className="w-full h-[52px] text-[15px] font-medium"
                disabled={!reminderTime}
              >
                Continue to Assessment
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}

          {/* Step 9: Initial Cognitive Assessment */}
          {step === 9 && calculatedAge && (
            <InitialAssessment 
              userAge={calculatedAge} 
              onComplete={handleAssessmentComplete}
              onSkip={handleAssessmentSkipped}
            />
          )}
        </div>
      </div>

      {/* Tagline */}
      {step !== 9 && (
        <div className="py-4 text-center">
          <p className="text-[11px] text-muted-foreground/60 tracking-wide uppercase">
            Strategic Cognitive Performance System
          </p>
        </div>
      )}
    </div>
  );
};

export default Onboarding;
