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
  Compass,
  Gamepad2,
  Move3D,
  MonitorPlay,
  Grid3X3,
  Trophy,
  TrendingUp,
  Play
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ExerciseCategory, ExerciseDuration, CATEGORY_INFO } from "@/lib/exercises";
import { useExerciseCount } from "@/hooks/useExercises";
import { useDailyTraining, useDailyTrainingStreak } from "@/hooks/useDailyTraining";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";

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
  visual: MonitorPlay,
  spatial: Move3D,
  game: Gamepad2,
  visual_memory: Grid3X3,
};

const DURATION_OPTIONS: { value: ExerciseDuration; label: string; description: string }[] = [
  { value: "30s", label: "30 sec", description: "Quick focus" },
  { value: "2min", label: "2 min", description: "Short session" },
  { value: "5min", label: "5 min", description: "Deep training" },
];

// Recommended category based on cognitive balance
const getRecommendedCategory = (): ExerciseCategory => {
  const options: ExerciseCategory[] = ["reasoning", "fast", "slow", "creative"];
  return options[Math.floor(Math.random() * options.length)];
};

const TrainingCategories = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<ExerciseDuration>("2min");
  
  const { data: exerciseCount = 0, isLoading } = useExerciseCount();
  const { isDailyCompleted } = useDailyTraining();
  const { data: streakData } = useDailyTrainingStreak(user?.id);
  
  const recommendedCategory = getRecommendedCategory();
  
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

  const handleQuickStart = () => {
    navigate(`/app/train?category=${recommendedCategory}&duration=2min`);
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
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-foreground tracking-tight">
              Cognitive Training
            </h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Build your mental edge
            </p>
          </div>
          
          {/* Streak indicator */}
          {streakData && streakData.streak > 0 && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-warning/10 border border-warning/30"
            >
              <Flame className="w-4 h-4 text-warning" />
              <span className="text-sm font-bold text-warning">{streakData.streak}</span>
            </motion.div>
          )}
        </div>

        {/* Daily Status Card */}
        <motion.div 
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={cn(
            "p-4 rounded-2xl mb-6 border",
            isDailyCompleted 
              ? "bg-emerald-500/10 border-emerald-500/30"
              : "bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/30"
          )}
        >
          {isDailyCompleted ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Daily Training Complete!</p>
                <p className="text-xs text-muted-foreground">Great work. Come back tomorrow.</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Ready to train?</p>
                <p className="text-xs text-muted-foreground">
                  {streakData && streakData.streak > 0 
                    ? `Keep your ${streakData.streak}-day streak alive!`
                    : "Start building your cognitive advantage today"
                  }
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Quick Start Button */}
        {!isDailyCompleted && (
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <button
              onClick={handleQuickStart}
              className="w-full p-4 rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground flex items-center justify-between group hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Play className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold">Quick Start</p>
                  <p className="text-xs opacity-80">2 min • {CATEGORY_INFO[recommendedCategory].title}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 opacity-60 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        )}
        
        {/* Exercise count indicator */}
        {isLoading ? (
          <div className="p-3 rounded-xl bg-card border border-border/40 mb-6">
            <div className="h-4 w-32 bg-muted animate-pulse rounded mx-auto" />
          </div>
        ) : exerciseCount > 0 && (
          <div className="p-3 rounded-xl bg-muted/30 border border-border/40 mb-6">
            <p className="text-[11px] text-muted-foreground text-center">
              <span className="text-primary font-medium">{exerciseCount} exercises</span> available • 
              Sets rotate to keep your brain challenged
            </p>
          </div>
        )}
        
        {/* Categories Grid */}
        <div className="mb-6">
          <h2 className="label-uppercase mb-3">Choose Your Focus</h2>
          <div className="grid grid-cols-2 gap-3">
            {categories.map((cat, index) => {
              const info = CATEGORY_INFO[cat];
              const Icon = CATEGORY_ICONS[cat];
              const isSelected = selectedCategory === cat;
              const isFast = cat === "fast";
              const isRecommended = cat === recommendedCategory;
              
              return (
                <motion.button
                  key={cat}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "p-4 rounded-xl text-left transition-all active:scale-[0.98] relative",
                    "border",
                    isSelected
                      ? isFast
                        ? "bg-warning/10 border-warning/50"
                        : "bg-primary/10 border-primary/50"
                      : "bg-card border-border/40 hover:border-border"
                  )}
                >
                  {isRecommended && !isSelected && (
                    <span className="absolute -top-2 -right-2 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider bg-primary text-primary-foreground rounded-full">
                      Try
                    </span>
                  )}
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
                </motion.button>
              );
            })}
          </div>
        </div>
        
        {/* Duration Selection */}
        {selectedCategory && (
          <motion.div 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mb-6"
          >
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
          </motion.div>
        )}
        
        {/* Selected Category Info */}
        {selectedCategory && (
          <motion.div 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="p-4 rounded-xl bg-card border border-border/40 mb-6"
          >
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {CATEGORY_INFO[selectedCategory].description}
            </p>
          </motion.div>
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
        
        {/* Motivation Footer */}
        <div className="mt-8 text-center space-y-1">
          <p className="text-xs text-muted-foreground">
            🧠 Every session strengthens neural pathways
          </p>
          <p className="text-[10px] text-muted-foreground/60">
            Consistency beats intensity • Train daily for best results
          </p>
        </div>
      </div>
    </AppShell>
  );
};

export default TrainingCategories;
