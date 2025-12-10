import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format, differenceInYears } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth, TrainingGoal, SessionDuration, DailyTimeCommitment, Gender, WorkType, EducationLevel, DegreeDiscipline } from "@/contexts/AuthContext";
import { useUpdateUserMetrics } from "@/hooks/useExercises";
import { cn } from "@/lib/utils";
import { Zap, Brain, Clock, Calendar as CalendarIcon, ArrowRight, User, Briefcase, GraduationCap } from "lucide-react";
import { InitialAssessment } from "@/components/onboarding/InitialAssessment";
import { useSaveBaseline } from "@/hooks/useBadges";

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

const Onboarding = () => {
  const navigate = useNavigate();
  const { updateUser, user } = useAuth();
  const updateMetrics = useUpdateUserMetrics();
  const saveBaseline = useSaveBaseline();
  const [step, setStep] = useState<Step>(1);
  
  // Personal data
  const [birthDate, setBirthDate] = useState<Date | undefined>(undefined);
  const [gender, setGender] = useState<Gender | undefined>(undefined);
  const [workType, setWorkType] = useState<WorkType | undefined>(undefined);
  const [educationLevel, setEducationLevel] = useState<EducationLevel | undefined>(undefined);
  const [degreeDiscipline, setDegreeDiscipline] = useState<DegreeDiscipline | undefined>(undefined);
  
  // Training preferences
  const [trainingGoals, setTrainingGoals] = useState<TrainingGoal[]>([]);
  const [sessionDuration, setSessionDuration] = useState<SessionDuration | undefined>(undefined);
  const [dailyTimeCommitment, setDailyTimeCommitment] = useState<DailyTimeCommitment | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Calculate age from birth date
  const calculatedAge = birthDate ? differenceInYears(new Date(), birthDate) : undefined;

  const handleNext = () => {
    if (step < 8) {
      setStep((s) => (s + 1) as Step);
    }
  };

  const handleAssessmentComplete = async (results: {
    fastScore: number;
    slowScore: number;
    focusScore: number;
    reasoningScore: number;
    creativityScore: number;
    overallScore: number;
    cognitiveAge: number;
  }) => {
    // Save initial metrics to database
    if (user?.id) {
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

      // Save baseline for progress tracking
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

    // Complete onboarding
    await updateUser({
      age: calculatedAge,
      birthDate: birthDate ? format(birthDate, "yyyy-MM-dd") : undefined,
      gender,
      workType,
      educationLevel,
      degreeDiscipline,
      trainingGoals,
      sessionDuration,
      dailyTimeCommitment,
      onboardingCompleted: true,
    });
    navigate("/app");
  };

  const handleComplete = async () => {
    // Move to assessment step
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

  const durationOptions: { value: SessionDuration; label: string; description: string }[] = [
    { value: "30s", label: "30 sec", description: "Quick drill" },
    { value: "2min", label: "2 min", description: "Focused" },
    { value: "5min", label: "5 min", description: "Deep work" },
    { value: "7min", label: "7 min", description: "Comprehensive" },
  ];

  const dailyTimeOptions: { value: DailyTimeCommitment; label: string; description: string }[] = [
    { value: "3min", label: "3 min", description: "Micro-drills" },
    { value: "10min", label: "10 min", description: "Daily protocol" },
    { value: "30min", label: "30 min", description: "Elite commitment" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress indicator */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex gap-1.5 max-w-[280px] mx-auto">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
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
                <h1 className="text-xl font-semibold mb-1.5 tracking-tight">
                  Cognitive focus
                </h1>
                <p className="text-muted-foreground text-[13px]">
                  Select one or both systems
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

          {/* Step 7: Session Duration & Daily Commitment */}
          {step === 7 && (
            <div className="animate-fade-in">
              <div className="text-center mb-6">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <h1 className="text-xl font-semibold mb-1.5 tracking-tight">
                  Training protocol
                </h1>
                <p className="text-muted-foreground text-[13px]">
                  Small drills. Strategic gains.
                </p>
              </div>
              
              {/* Session Duration */}
              <div className="mb-5">
                <label className="text-[13px] font-medium text-muted-foreground mb-2.5 block">Drill length</label>
                <div className="grid grid-cols-2 gap-2">
                  {durationOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSessionDuration(option.value)}
                      className={cn(
                        "py-3 px-3 rounded-xl border text-center transition-all",
                        sessionDuration === option.value
                          ? "border-primary bg-primary/10"
                          : "border-border/60 bg-card/50 hover:border-primary/40"
                      )}
                    >
                      <span className="font-semibold text-[14px] block mb-0.5">{option.label}</span>
                      <span className="text-[10px] text-muted-foreground">{option.description}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Daily Commitment */}
              <div className="mb-6">
                <label className="text-[13px] font-medium text-muted-foreground mb-2.5 block">Daily commitment</label>
                <div className="grid grid-cols-3 gap-2">
                  {dailyTimeOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setDailyTimeCommitment(option.value)}
                      className={cn(
                        "py-3 px-2 rounded-xl border text-center transition-all",
                        dailyTimeCommitment === option.value
                          ? "border-primary bg-primary/10"
                          : "border-border/60 bg-card/50 hover:border-primary/40"
                      )}
                    >
                      <span className="font-semibold text-[14px] block mb-0.5">{option.label}</span>
                      <span className="text-[9px] text-muted-foreground">{option.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleComplete}
                variant="hero"
                className="w-full h-[52px] text-[15px] font-medium"
                disabled={!sessionDuration || !dailyTimeCommitment}
              >
                Continue to Assessment
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}

          {/* Step 8: Initial Cognitive Assessment */}
          {step === 8 && calculatedAge && (
            <InitialAssessment 
              userAge={calculatedAge} 
              onComplete={handleAssessmentComplete}
            />
          )}
        </div>
      </div>

      {/* Tagline */}
      {step !== 8 && (
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
