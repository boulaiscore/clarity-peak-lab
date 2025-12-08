import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  ChevronRight, 
  Clock, 
  FlaskConical, 
  Target, 
  Workflow, 
  Zap, 
  Brain, 
  Scale, 
  Lightbulb, 
  Sparkles,
  Eye,
  HardDrive,
  ShieldOff,
  Sliders,
  SlidersHorizontal,
  Flame,
  BookOpen,
  Compass
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ExerciseCategory, ExerciseDuration, CATEGORY_INFO } from "@/lib/exercises";
import { useExerciseCount } from "@/hooks/useExercises";
import { toast } from "@/hooks/use-toast";

const CATEGORY_ICONS: Record<ExerciseCategory, React.ElementType> = {
  reasoning: FlaskConical,
  clarity: Target,
  decision: Workflow,
  fast: Zap,
  slow: Brain,
  bias: Scale,
  logic_puzzle: Lightbulb,
  creative: Sparkles,
  attention: Eye,
  working_memory: HardDrive,
  inhibition: ShieldOff,
  cognitive_control: Sliders,
  executive_control: SlidersHorizontal,
  insight: Flame,
  reflection: BookOpen,
  philosophical: Compass,
};

const DURATION_OPTIONS: { value: ExerciseDuration; label: string; description: string }[] = [
  { value: "30s", label: "30 sec", description: "Quick focus" },
  { value: "2min", label: "2 min", description: "Short session" },
  { value: "5min", label: "5 min", description: "Deep training" },
];

const TrainingCategories = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<ExerciseDuration>("2min");
  
  const { data: exerciseCount = 0, isLoading } = useExerciseCount();
  
  const categories: ExerciseCategory[] = [
    "reasoning",
    "clarity",
    "decision",
    "fast",
    "slow",
    "bias",
    "logic_puzzle",
    "creative",
  ];
  
  const handleStartTraining = () => {
    if (!selectedCategory) return;
    navigate(`/app/train?category=${selectedCategory}&duration=${selectedDuration}`);
  };
  
  return (
    <AppShell>
      <div className="container px-4 py-5 max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/app">
            <Button variant="ghost" size="icon-sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-foreground tracking-tight">
              Cognitive Training
            </h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Choose your training focus
            </p>
          </div>
        </div>
        
        {/* Exercise count indicator */}
        {isLoading ? (
          <div className="p-3 rounded-xl bg-card border border-border/40 mb-6">
            <div className="h-4 w-32 bg-muted animate-pulse rounded mx-auto" />
          </div>
        ) : exerciseCount > 0 ? (
          <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 mb-6">
            <p className="text-[11px] text-muted-foreground text-center">
              <span className="text-primary font-medium">{exerciseCount} exercises</span> in the library.
              Sets rotate and adapt over time.
            </p>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-muted/50 border border-border/40 mb-6">
            <p className="text-[11px] text-muted-foreground text-center">
              Loading exercise library...
            </p>
          </div>
        )}
        
        {/* Categories Grid */}
        <div className="mb-6">
          <h2 className="label-uppercase mb-3">Training Categories</h2>
          <div className="grid grid-cols-2 gap-3">
            {categories.map((cat, index) => {
              const info = CATEGORY_INFO[cat];
              const Icon = CATEGORY_ICONS[cat];
              const isSelected = selectedCategory === cat;
              const isFast = cat === "fast";
              
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "p-4 rounded-xl text-left transition-all active:scale-[0.98]",
                    "border animate-fade-in",
                    isSelected
                      ? isFast
                        ? "bg-warning/10 border-warning/50"
                        : "bg-primary/10 border-primary/50"
                      : "bg-card border-border/40 hover:border-border"
                  )}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center mb-2",
                    isSelected
                      ? isFast ? "bg-warning/20" : "bg-primary/20"
                      : isFast ? "bg-warning/10" : "bg-primary/10"
                  )}>
                    <Icon className={cn("w-5 h-5", isFast ? "text-warning" : "text-primary")} />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">{info.title}</h3>
                  <p className="text-[9px] text-muted-foreground mt-0.5 leading-relaxed">
                    {info.subtitle}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Duration Selection */}
        {selectedCategory && (
          <div className="mb-6 animate-fade-in">
            <h2 className="label-uppercase mb-3">Session Duration</h2>
            <div className="grid grid-cols-3 gap-3">
              {DURATION_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedDuration(option.value)}
                  className={cn(
                    "p-3 rounded-xl text-center transition-all",
                    "border",
                    selectedDuration === option.value
                      ? "bg-primary/10 border-primary/50"
                      : "bg-card border-border/40 hover:border-border"
                  )}
                >
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-sm font-semibold text-foreground">{option.label}</span>
                  </div>
                  <p className="text-[9px] text-muted-foreground">{option.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Selected Category Info */}
        {selectedCategory && (
          <div className="p-4 rounded-xl bg-card border border-border/40 mb-6 animate-fade-in">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {CATEGORY_INFO[selectedCategory].description}
            </p>
          </div>
        )}
        
        {/* Start Button */}
        <Button
          variant="premium"
          className="w-full"
          size="lg"
          disabled={!selectedCategory || exerciseCount === 0}
          onClick={handleStartTraining}
        >
          <ChevronRight className="w-4 h-4 mr-2" />
          Start Training
        </Button>
        
        {/* Tagline */}
        <div className="mt-8 text-center">
          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">
            Every session slightly rewires your thinking patterns
          </p>
        </div>
      </div>
    </AppShell>
  );
};

export default TrainingCategories;
