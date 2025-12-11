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
import { Crown, Check, Lock, Zap, Clock, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

interface PremiumPaywallProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: "area" | "duration" | "neuro-activation" | "session-limit";
  featureName?: string;
}

const FEATURES = [
  { icon: Brain, text: "All 3 training areas" },
  { icon: Clock, text: "Extended sessions (5min, 7min)" },
  { icon: Zap, text: "Neuro Activation warm-up" },
  { icon: Check, text: "Unlimited daily sessions" },
];

const FEATURE_MESSAGES: Record<string, { title: string; description: string }> = {
  area: {
    title: "Premium Training Area",
    description: "Unlock all cognitive training domains to develop complete mental fitness.",
  },
  duration: {
    title: "Extended Sessions",
    description: "Access longer, deeper training sessions for maximum cognitive gains.",
  },
  "neuro-activation": {
    title: "Neuro Activation™",
    description: "Prime your brain for peak performance with our 5-minute cognitive warm-up.",
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
      <AlertDialogContent className="max-w-sm mx-auto">
        <AlertDialogHeader className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-4">
            {feature === "session-limit" ? (
              <Lock className="w-8 h-8 text-primary" />
            ) : (
              <Crown className="w-8 h-8 text-primary" />
            )}
          </div>
          <AlertDialogTitle className="text-xl">
            {message.title}
            {featureName && (
              <span className="block text-sm font-normal text-muted-foreground mt-1">
                {featureName}
              </span>
            )}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            {message.description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4 space-y-3">
          {FEATURES.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm">{text}</span>
            </div>
          ))}
        </div>

        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <Button onClick={handleUpgrade} variant="hero" className="w-full min-h-[48px]">
            <Crown className="w-4 h-4 mr-2" />
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
