import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Crown, Check, Lock, Zap, Clock, Brain, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface PremiumPaywallProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: "area" | "duration" | "neuro-activation" | "session-limit";
  featureName?: string;
}

const FEATURES = [
  { icon: Brain, text: "All 5 training domains" },
  { icon: Clock, text: "Extended sessions (5min, 7min)" },
  { icon: Zap, text: "Neuro Activation warm-up" },
  { icon: Sparkles, text: "Unlimited daily sessions" },
];

const FEATURE_MESSAGES: Record<string, { title: string; description: string }> = {
  area: {
    title: "Premium Training Domain",
    description: "Unlock all cognitive training domains for complete mental excellence.",
  },
  duration: {
    title: "Extended Sessions",
    description: "Access longer, deeper training sessions for maximum cognitive gains.",
  },
  "neuro-activation": {
    title: "Neuro Activation™",
    description: "Prime your brain for peak performance with our 5-minute cognitive ritual.",
  },
  "session-limit": {
    title: "Daily Limit Reached",
    description: "You've completed your 3 free sessions today. Upgrade for unlimited training.",
  },
};

export function PremiumPaywall({ open, onOpenChange, feature = "area", featureName }: PremiumPaywallProps) {
  const navigate = useNavigate();
  const message = FEATURE_MESSAGES[feature];

  const handleUpgrade = () => {
    onOpenChange(false);
    navigate("/app/premium");
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-sm mx-auto bg-card border-border rounded-3xl p-0 overflow-hidden">
        {/* Premium Header */}
        <div className="relative p-8 pb-6 text-center bg-gradient-to-b from-primary/10 to-transparent">
          <div className="absolute inset-0 bg-gradient-glow opacity-50" />
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-gold flex items-center justify-center mx-auto mb-5 shadow-glow animate-glow-pulse">
              {feature === "session-limit" ? (
                <Lock className="w-10 h-10 text-primary-foreground" />
              ) : (
                <Crown className="w-10 h-10 text-primary-foreground" />
              )}
            </div>
            <AlertDialogTitle className="text-2xl font-medium text-foreground mb-2">
              {message.title}
            </AlertDialogTitle>
            {featureName && (
              <span className="text-sm font-medium text-primary">
                {featureName}
              </span>
            )}
            <AlertDialogDescription className="text-center text-muted-foreground mt-3">
              {message.description}
            </AlertDialogDescription>
          </div>
        </div>

        {/* Features List */}
        <div className="px-8 py-6 space-y-4">
          {FEATURES.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-amber-500/10 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm text-foreground font-medium">{text}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <AlertDialogFooter className="flex-col gap-3 p-8 pt-4 sm:flex-col">
          <Button onClick={handleUpgrade} variant="hero" size="lg" className="w-full">
            <Crown className="w-5 h-5 mr-2" />
            Upgrade to Premium
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)} 
            className="w-full text-muted-foreground"
          >
            Maybe Later
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}