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
import { Crown, Check, Lock, Zap, Clock, Brain, FileText, Dumbbell, ArrowRight } from "lucide-react";

interface PremiumPaywallProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: "area" | "duration" | "neuro-activation" | "session-limit" | "report" | "training";
  featureName?: string;
}

const FEATURES = [
  { icon: Brain, text: "All training areas (S1 + S2)" },
  { icon: Clock, text: "Extended sessions (5 min, 7 min)" },
  { icon: Zap, text: "Neuro Activation warm-up" },
  { icon: Check, text: "Unlimited daily sessions" },
  { icon: FileText, text: "Cognitive Intelligence Report" },
  { icon: Dumbbell, text: "Advanced cognitive training" },
];

const FEATURE_MESSAGES: Record<string, { title: string; description: string }> = {
  area: {
    title: "Pro Training Area",
    description: "Unlock all cognitive training domains to develop complete mental fitness.",
  },
  duration: {
    title: "Extended Sessions",
    description: "Access longer, deeper training sessions for maximum cognitive gains.",
  },
  "neuro-activation": {
    title: "Neuro Activation™",
    description: "Prime your brain for peak performance with our cognitive warm-up protocol.",
  },
  "session-limit": {
    title: "Daily Limit Reached",
    description: "You've completed your 3 free sessions today. Upgrade for unlimited training.",
  },
  report: {
    title: "Cognitive Intelligence Report",
    description: "Get a comprehensive analysis of your cognitive performance with personalized insights.",
  },
  training: {
    title: "Advanced Training",
    description: "Advanced cognitive training modules designed for deep performance optimization.",
  },
};

export function PremiumPaywall({ open, onOpenChange, feature = "area", featureName }: PremiumPaywallProps) {
  const navigate = useNavigate();
  const message = FEATURE_MESSAGES[feature];

  const handleUpgrade = () => {
    onOpenChange(false);
    navigate("/app/subscription");
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-sm mx-auto">
        <AlertDialogHeader className="text-center">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            {feature === "session-limit" ? (
              <Lock className="w-7 h-7 text-primary" />
            ) : (
              <Crown className="w-7 h-7 text-primary" />
            )}
          </div>
          <AlertDialogTitle className="text-lg">
            {message.title}
            {featureName && (
              <span className="block text-sm font-normal text-muted-foreground mt-1">
                {featureName}
              </span>
            )}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-sm">
            {message.description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-3 space-y-2.5">
          {FEATURES.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">{text}</span>
            </div>
          ))}
        </div>

        <AlertDialogFooter className="flex-col gap-2 sm:flex-col pt-1">
          <Button onClick={handleUpgrade} variant="hero" className="w-full">
            <Crown className="w-4 h-4 mr-2" />
            View Plans
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
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
