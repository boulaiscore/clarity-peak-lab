import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format, differenceInYears } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth, TrainingGoal, Gender, WorkType, EducationLevel, DegreeDiscipline, RRISleepHours, RRIDetoxHours, RRIMentalState } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Zap, Brain, Calendar as CalendarIcon, ArrowRight, User, Briefcase, GraduationCap, Bell, Leaf, Target, Flame, Moon, Smartphone, Battery } from "lucide-react";
import { TRAINING_PLANS, TrainingPlanId } from "@/lib/trainingPlans";
import { computeRRI, RRI_SLEEP_OPTIONS, RRI_DETOX_OPTIONS, RRI_MENTAL_STATE_OPTIONS } from "@/lib/recoveryReadinessInit";

// Steps: 1=Welcome, 2=Personal, 3=Education, 4=Discipline, 5=Work, 6=Sleep(RRI), 7=Detox(RRI), 8=MentalState(RRI), 9=Plan, 10=Reminder
type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

const Onboarding = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { updateUser, user } = useAuth();
  
  // Check if coming from reset assessment - redirect to calibration directly
  const isResetAssessment = searchParams.get("step") === "assessment";
  
  // Redirect to calibration if reset assessment
  if (isResetAssessment) {
    navigate("/app/calibration");
    return null;
  }
  
  const [step, setStep] = useState<Step>(1);
  
  // Personal data
  const [birthDate, setBirthDate] = useState<Date | undefined>(undefined);
  const [gender, setGender] = useState<Gender | undefined>(undefined);
  const [workType, setWorkType] = useState<WorkType | undefined>(undefined);
  const [educationLevel, setEducationLevel] = useState<EducationLevel | undefined>(undefined);
  const [degreeDiscipline, setDegreeDiscipline] = useState<DegreeDiscipline | undefined>(undefined);
  
  // RRI (Recovery Readiness Init) questions
  const [rriSleepHours, setRriSleepHours] = useState<RRISleepHours | undefined>(undefined);
  const [rriDetoxHours, setRriDetoxHours] = useState<RRIDetoxHours | undefined>(undefined);
  const [rriMentalState, setRriMentalState] = useState<RRIMentalState | undefined>(undefined);
  
  // Default training goals: both systems (since we removed the selection step)
  const trainingGoals: TrainingGoal[] = ["fast_thinking", "slow_thinking"];
  const [trainingPlan, setTrainingPlan] = useState<TrainingPlanId>("light");
  const [reminderTime, setReminderTime] = useState<string>("08:00");
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Calculate age from birth date or use existing user age for reset
  const calculatedAge = birthDate 
    ? differenceInYears(new Date(), birthDate) 
    : (isResetAssessment && user?.age ? user.age : undefined);

  const handleNext = async () => {
    if (step < 10) {
      setStep((s) => (s + 1) as Step);
    } else if (step === 10) {
      // Compute RRI value from answers
      // v1.1: If RRI questions were skipped, use a default value of 35 (moderate recovery)
      const rriResult = (rriSleepHours && rriDetoxHours && rriMentalState) 
        ? computeRRI({
            sleepHours: rriSleepHours,
            detoxHours: rriDetoxHours,
            mentalState: rriMentalState,
          })
        : null;
      
      // Default RRI value if not computed (prevents recovery = 0)
      const DEFAULT_RRI_VALUE = 35;
      const finalRriValue = rriResult?.value ?? DEFAULT_RRI_VALUE;
      
      // Save user data before navigating to calibration wizard
      try {
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
          // RRI data - always set a value to prevent recovery = 0
          rriSleepHours,
          rriDetoxHours,
          rriMentalState,
          rriValue: finalRriValue,
          rriSetAt: new Date().toISOString(),
          onboardingCompleted: false, // Will be marked true after calibration
        });
        console.log("[Onboarding] User data saved, RRI value:", finalRriValue);
        // Navigate to the new Quick Baseline Calibration wizard
        navigate("/app/calibration");
      } catch (err) {
        console.error("[Onboarding] Failed to save user data", err);
      }
    }
  };

  const handleComplete = async () => {
    // Move to reminder time step
    setStep(10);
  };

  const genderOptions: { value: Gender; label: string }[] = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "other", label: "Other" },
    { value: "prefer_not_to_say", label: "Prefer not to say" },
  ];

  const workTypeOptions: { value: WorkType; label: string; description: string }[] = [
    { value: "knowledge", label: "Consulting, Analyst", description: "Research, analysis, consulting" },
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

  const totalSteps = 10;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Progress indicator */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex gap-1.5 max-w-[280px] mx-auto">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
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
                Welcome to NLOOP
              </h1>
              <p className="text-[15px] text-muted-foreground mb-2 leading-relaxed">
                Unlock elite reasoning.
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
              <div className="text-center mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
                  <Briefcase className="w-5 h-5 text-primary" />
                </div>
                <h1 className="text-xl font-semibold tracking-tight">
                  Your work
                </h1>
              </div>
              
              <div className="space-y-1.5 mb-4">
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

          {/* Step 6: RRI - Sleep (last 2 days) */}
          {step === 6 && (
            <div className="animate-fade-in">
              {/* RRI Calibration Notice */}
              <div className="mb-5 p-3 rounded-xl bg-primary/5 border border-primary/20">
                <p className="text-[12px] text-primary font-medium text-center">
                  Recovery Calibration
                </p>
                <p className="text-[11px] text-muted-foreground text-center mt-1 leading-relaxed">
                  The next 3 questions assess your current cognitive recovery state. Answer honestly for accurate training recommendations.
                </p>
              </div>

              <div className="text-center mb-6">
                <div className="w-11 h-11 rounded-xl bg-teal-500/15 flex items-center justify-center mx-auto mb-3">
                  <Moon className="w-5 h-5 text-teal-400" />
                </div>
                <h1 className="text-xl font-semibold mb-1.5 tracking-tight">
                  Recent Sleep
                </h1>
                <p className="text-muted-foreground text-[13px]">
                  Average sleep over the last 2 days
                </p>
              </div>
              
              <div className="space-y-2 mb-6">
                {RRI_SLEEP_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setRriSleepHours(option.value)}
                    className={cn(
                      "w-full py-3 px-4 rounded-xl border text-left transition-all",
                      rriSleepHours === option.value
                        ? "border-teal-400 bg-teal-500/10"
                        : "border-border/60 bg-card/50 hover:border-teal-400/40"
                    )}
                  >
                    <span className="font-medium text-[14px]">{option.label}</span>
                  </button>
                ))}
              </div>

              <Button 
                onClick={handleNext} 
                variant="hero" 
                className="w-full h-[52px] text-[15px] font-medium"
                disabled={!rriSleepHours}
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}

          {/* Step 7: RRI - Mental Detox (last 2 days) */}
          {step === 7 && (
            <div className="animate-fade-in">
              <div className="text-center mb-6">
                <div className="w-11 h-11 rounded-xl bg-teal-500/15 flex items-center justify-center mx-auto mb-3">
                  <Smartphone className="w-5 h-5 text-teal-400" />
                </div>
                <h1 className="text-xl font-semibold mb-1.5 tracking-tight">
                  Mental Detox
                </h1>
                <p className="text-muted-foreground text-[13px] leading-relaxed">
                  Longest continuous period intentionally offline in the last 2 days
                </p>
                <p className="text-muted-foreground/60 text-[11px] mt-1">
                  No social media, email, news, or notifications. Sleeping/working doesn't count.
                </p>
              </div>
              
              <div className="space-y-2 mb-6">
                {RRI_DETOX_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setRriDetoxHours(option.value)}
                    className={cn(
                      "w-full py-3 px-4 rounded-xl border text-left transition-all",
                      rriDetoxHours === option.value
                        ? "border-teal-400 bg-teal-500/10"
                        : "border-border/60 bg-card/50 hover:border-teal-400/40"
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
                disabled={!rriDetoxHours}
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}

          {/* Step 8: RRI - Current Mental State */}
          {step === 8 && (
            <div className="animate-fade-in">
              <div className="text-center mb-6">
                <div className="w-11 h-11 rounded-xl bg-teal-500/15 flex items-center justify-center mx-auto mb-3">
                  <Battery className="w-5 h-5 text-teal-400" />
                </div>
                <h1 className="text-xl font-semibold mb-1.5 tracking-tight">
                  Current State
                </h1>
                <p className="text-muted-foreground text-[13px]">
                  How do you feel mentally right now?
                </p>
              </div>
              
              <div className="space-y-2 mb-6">
                {RRI_MENTAL_STATE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setRriMentalState(option.value)}
                    className={cn(
                      "w-full py-3 px-4 rounded-xl border text-left transition-all",
                      rriMentalState === option.value
                        ? "border-teal-400 bg-teal-500/10"
                        : "border-border/60 bg-card/50 hover:border-teal-400/40"
                    )}
                  >
                    <span className="font-medium text-[14px]">{option.label}</span>
                  </button>
                ))}
              </div>

              <Button 
                onClick={handleNext} 
                variant="hero" 
                className="w-full h-[52px] text-[15px] font-medium"
                disabled={!rriMentalState}
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}

          {/* Step 9: Training Plan Selection */}
          {step === 9 && (
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
                  const intensityDots = option.plan.intensity === "low" ? 1 : option.plan.intensity === "medium" ? 2 : 3;
                  const resultsDots = option.plan.intensity === "low" ? 2.5 : option.plan.intensity === "medium" ? 3.5 : 5;
                  
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
                          
                          {/* Visual indicators - 5 dot scale */}
                          <div className="flex items-center gap-4 text-[11px]">
                            <div className="flex items-center gap-1.5">
                              <span className="text-muted-foreground/60">Effort</span>
                              <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map((dot) => (
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
                                {[1, 2, 3, 4, 5].map((dot) => {
                                  const isFullFilled = dot <= Math.floor(resultsDots);
                                  const isHalfFilled = dot === Math.ceil(resultsDots) && resultsDots % 1 !== 0;
                                  
                                  return (
                                    <div 
                                      key={dot}
                                      className={cn(
                                        "w-2 h-2 rounded-full transition-all overflow-hidden relative",
                                        isFullFilled ? "bg-primary" : "bg-muted-foreground/20"
                                      )}
                                    >
                                      {isHalfFilled && (
                                        <div className="absolute inset-0 bg-primary" style={{ clipPath: 'inset(0 50% 0 0)' }} />
                                      )}
                                    </div>
                                  );
                                })}
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

          {/* Step 10: Daily Training Time */}
          {step === 10 && (
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
                onClick={handleNext}
                variant="hero"
                className="w-full h-[52px] text-[15px] font-medium"
                disabled={!reminderTime}
              >
                Continue to Calibration
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Tagline */}
      {step !== 10 && (
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
