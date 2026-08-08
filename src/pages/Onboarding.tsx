import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, BrainCircuit, Briefcase, Gauge, Moon, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoomaLogo } from "@/components/ui/LoomaLogo";
import {
  useAuth,
  type RRIDetoxHours,
  type RRIMentalState,
  type RRISleepHours,
  type TrainingGoal,
  type WorkType,
} from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  computeRRI,
  RRI_DETOX_OPTIONS,
  RRI_MENTAL_STATE_OPTIONS,
  RRI_SLEEP_OPTIONS,
} from "@/lib/recoveryReadinessInit";
import { trackProductEvent } from "@/lib/productAnalytics";

type Step = 1 | 2;
type PrimaryOutcome = "decide" | "focus" | "reason";

const outcomes: Array<{
  value: PrimaryOutcome;
  title: string;
  description: string;
  icon: typeof Gauge;
}> = [
  { value: "decide", title: "Decide", description: "High-impact choices and trade-offs", icon: Gauge },
  { value: "focus", title: "Focus", description: "Deep, distraction-resistant work", icon: BrainCircuit },
  { value: "reason", title: "Analyze", description: "Evidence, causality and strategy", icon: Briefcase },
];

const workTypes: Array<{ value: WorkType; label: string }> = [
  { value: "management", label: "Founder / Leadership" },
  { value: "knowledge", label: "Consulting / Investing" },
  { value: "technical", label: "Product / Technical" },
  { value: "creative", label: "Creative / Writing" },
  { value: "student", label: "Research / Academic" },
  { value: "other", label: "Other" },
];

function SelectField<T extends string>({
  icon: Icon,
  label,
  value,
  placeholder,
  options,
  onChange,
}: {
  icon: typeof Moon;
  label: string;
  value: T | undefined;
  placeholder: string;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <label className="block rounded-2xl border border-border/50 bg-card/50 p-4">
      <span className="mb-2.5 flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Icon className="h-4 w-4 text-recovery" /> {label}
      </span>
      <select
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value as T)}
        className="h-11 w-full rounded-xl border border-border/60 bg-background/70 px-3 text-sm text-foreground outline-none focus:border-primary"
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

export default function Onboarding() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { updateUser } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [primaryOutcome, setPrimaryOutcome] = useState<PrimaryOutcome>();
  const [workType, setWorkType] = useState<WorkType>();
  const [sleep, setSleep] = useState<RRISleepHours>();
  const [detox, setDetox] = useState<RRIDetoxHours>();
  const [mentalState, setMentalState] = useState<RRIMentalState>();
  const [isSaving, setIsSaving] = useState(false);

  const isResetAssessment = searchParams.get("step") === "assessment";

  useEffect(() => {
    if (isResetAssessment) {
      navigate("/app/calibration", { replace: true });
      return;
    }
    trackProductEvent("onboarding_viewed");
  }, [isResetAssessment, navigate]);

  if (isResetAssessment) return null;

  const continueToContext = () => {
    if (!primaryOutcome || !workType) return;
    localStorage.setItem("looma_primary_outcome", primaryOutcome);
    trackProductEvent("onboarding_step_completed", { step: 1, outcome: primaryOutcome });
    setStep(2);
  };

  const continueToCalibration = async () => {
    if (!sleep || !detox || !mentalState) return;
    setIsSaving(true);

    const trainingGoals: TrainingGoal[] = ["fast_thinking", "slow_thinking"];
    const rriValue = computeRRI({ sleepHours: sleep, detoxHours: detox, mentalState }).value;

    try {
      await updateUser({
        workType,
        trainingGoals,
        sessionDuration: "2min",
        dailyTimeCommitment: "3min",
        trainingPlan: "light",
        reminderEnabled: false,
        rriSleepHours: sleep,
        rriDetoxHours: detox,
        rriMentalState: mentalState,
        rriValue,
        rriSetAt: new Date().toISOString(),
        onboardingCompleted: false,
      });
      trackProductEvent("onboarding_step_completed", { step: 2 });
      navigate("/app/calibration");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-15rem] h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-primary/15 blur-[130px]" />
      </div>

      <header className="relative z-10 flex items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2">
          <LoomaLogo size={24} className="text-foreground" />
          <span className="text-xs font-semibold tracking-[0.18em]">LOOMA</span>
        </div>
        <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Step {step} of 2</span>
      </header>

      <div className="relative z-10 mx-auto h-1 w-[calc(100%-2.5rem)] max-w-md overflow-hidden rounded-full bg-muted/50">
        <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${step * 50}%` }} />
      </div>

      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-74px)] w-full max-w-md items-center px-5 py-10">
        {step === 1 ? (
          <section className="w-full animate-fade-in">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Your working edge</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">What should LOOMA help you protect?</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              This personalizes your guidance. LOOMA does not test intelligence or compare you with other people.
            </p>

            <p className="mt-4 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground/65">
              Your baseline · Changeable signals · No ranking
            </p>

            <div className="mt-7 space-y-2.5">
              {outcomes.map(({ value, title, description, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPrimaryOutcome(value)}
                  className={cn(
                    "flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all",
                    primaryOutcome === value ? "border-primary bg-primary/10" : "border-border/50 bg-card/50 hover:border-primary/40",
                  )}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-background/70"><Icon className="h-5 w-5 text-primary" /></span>
                  <span>
                    <span className="block text-sm font-semibold">{title}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-6">
              <p className="mb-2.5 text-xs font-medium text-muted-foreground">Your work context</p>
              <div className="grid grid-cols-2 gap-2">
                {workTypes.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setWorkType(value)}
                    className={cn(
                      "min-h-12 rounded-xl border px-3 py-2 text-left text-xs font-medium transition-all",
                      workType === value ? "border-primary bg-primary/10" : "border-border/50 bg-card/50 text-muted-foreground hover:border-primary/40",
                    )}
                  >{label}</button>
                ))}
              </div>
            </div>

            <Button onClick={continueToContext} disabled={!primaryOutcome || !workType} variant="hero" size="xl" className="mt-7 w-full">
              Continue <ArrowRight />
            </Button>
          </section>
        ) : (
          <section className="w-full animate-fade-in">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-recovery">Today’s context</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">Add context to your first reading.</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">These self-reported signals are shown separately from task performance and can be updated later.</p>

            <div className="mt-7 space-y-3">
              <SelectField icon={Moon} label="Average sleep, last 2 nights" value={sleep} placeholder="Select sleep duration" options={RRI_SLEEP_OPTIONS} onChange={setSleep} />
              <SelectField icon={Smartphone} label="Longest intentional offline period" value={detox} placeholder="Select offline time" options={RRI_DETOX_OPTIONS} onChange={setDetox} />
              <SelectField icon={BrainCircuit} label="How clear do you feel now?" value={mentalState} placeholder="Select current state" options={RRI_MENTAL_STATE_OPTIONS} onChange={setMentalState} />
            </div>

            <div className="mt-5 rounded-xl border border-primary/20 bg-primary/5 p-3 text-[11px] leading-relaxed text-muted-foreground">
              Next: a brief four-part check. Your first result is provisional and reflects current conditions, not fixed ability. LOOMA needs repeated observations before identifying personal patterns.
            </div>

            <div className="mt-7 flex gap-3">
              <Button type="button" variant="ghost" size="xl" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={continueToCalibration} disabled={!sleep || !detox || !mentalState || isSaving} variant="hero" size="xl" className="flex-1">
                {isSaving ? "Saving…" : "Start 2-minute check"} {!isSaving && <ArrowRight />}
              </Button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
