import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Brain, Zap, Lightbulb, Target, ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface AreaBreakdown {
  area: string;
  icon: React.ReactNode;
  exercises: number;
  color: string;
}

export default function DailySession() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const dailyCommitment = user?.dailyTimeCommitment || "7min";
  const trainingGoals = user?.trainingGoals || ["fast_thinking", "slow_thinking"];
  
  // Calculate exercise distribution based on daily commitment
  const getExerciseDistribution = (): { total: number; focus: number; reasoning: number; creativity: number } => {
    switch (dailyCommitment) {
      case "3min":
        return { total: 6, focus: 2, reasoning: 2, creativity: 2 };
      case "7min":
        return { total: 14, focus: 5, reasoning: 5, creativity: 4 };
      case "10min":
      default:
        return { total: 20, focus: 7, reasoning: 7, creativity: 6 };
    }
  };
  
  const distribution = getExerciseDistribution();
  
  const areas: AreaBreakdown[] = [
    {
      area: "Focus Arena",
      icon: <Target className="w-5 h-5" />,
      exercises: distribution.focus,
      color: "text-cyan-400",
    },
    {
      area: "Critical Reasoning",
      icon: <Brain className="w-5 h-5" />,
      exercises: distribution.reasoning,
      color: "text-purple-400",
    },
    {
      area: "Creativity Hub",
      icon: <Lightbulb className="w-5 h-5" />,
      exercises: distribution.creativity,
      color: "text-amber-400",
    },
  ];
  
  const getThinkingModeLabel = (): string => {
    if (trainingGoals.includes("fast_thinking") && trainingGoals.includes("slow_thinking")) {
      return "Mixed (Fast + Slow)";
    } else if (trainingGoals.includes("fast_thinking")) {
      return "Fast Thinking";
    } else if (trainingGoals.includes("slow_thinking")) {
      return "Slow Thinking";
    }
    return "Mixed";
  };
  
  const handleStartTraining = () => {
    // Navigate to neuro lab with daily session mode
    navigate("/app/neuro-lab", { state: { dailySessionMode: true, distribution } });
  };
  
  return (
    <div className="min-h-screen bg-background p-6 flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm mb-4">
          <Zap className="w-4 h-4" />
          Daily Training
        </div>
        <h1 className="text-2xl font-bold mb-2">Your Cognitive Session</h1>
        <p className="text-muted-foreground text-sm">
          Personalized training based on your goals
        </p>
      </motion.div>
      
      {/* Session Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-2xl p-6 mb-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Clock className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold">{dailyCommitment} Session</p>
              <p className="text-sm text-muted-foreground">{distribution.total} exercises</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Mode</p>
            <p className="text-sm font-medium">{getThinkingModeLabel()}</p>
          </div>
        </div>
        
        {/* Area Breakdown */}
        <div className="space-y-3">
          {areas.map((area, index) => (
            <motion.div
              key={area.area}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="flex items-center justify-between p-3 rounded-xl bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <div className={area.color}>{area.icon}</div>
                <span className="font-medium text-sm">{area.area}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {area.exercises} exercises
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>
      
      {/* Training Goals */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-card border border-border rounded-2xl p-6 mb-8"
      >
        <h3 className="font-semibold mb-3 text-sm">Training Focus</h3>
        <div className="flex flex-wrap gap-2">
          {trainingGoals.includes("fast_thinking") && (
            <div className="px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-400 text-xs font-medium">
              ⚡ Fast Thinking (System 1)
            </div>
          )}
          {trainingGoals.includes("slow_thinking") && (
            <div className="px-3 py-1.5 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-medium">
              🧠 Slow Thinking (System 2)
            </div>
          )}
        </div>
      </motion.div>
      
      {/* Spacer */}
      <div className="flex-1" />
      
      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="space-y-3"
      >
        <Button
          onClick={handleStartTraining}
          className="w-full h-14 text-lg font-semibold rounded-xl"
        >
          Start Training
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
        <Button
          variant="ghost"
          onClick={() => navigate("/app")}
          className="w-full"
        >
          Maybe Later
        </Button>
      </motion.div>
    </div>
  );
}
