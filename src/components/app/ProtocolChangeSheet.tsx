/**
 * ProtocolChangeSheet - Elegant bottom sheet for protocol/plan changes
 * Can be triggered from Lab or other locations
 */

import { useState } from "react";
import { Check, Leaf, Target, Flame, Star, BookMarked, Smartphone, Dumbbell } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { TrainingPlanId, TRAINING_PLANS } from "@/lib/trainingPlans";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const PLAN_ICONS: Record<TrainingPlanId, React.ElementType> = {
  light: Leaf,
  expert: Target,
  superhuman: Flame,
};

interface ProtocolChangeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProtocolChangeSheet({ open, onOpenChange }: ProtocolChangeSheetProps) {
  const { user, updateUser } = useAuth();
  const currentPlan = (user?.trainingPlan || "light") as TrainingPlanId;
  const [selectedPlan, setSelectedPlan] = useState<TrainingPlanId | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleConfirmProtocolChange = async () => {
    if (!selectedPlan || selectedPlan === currentPlan) return;
    
    setIsUpdating(true);
    try {
      await updateUser({ trainingPlan: selectedPlan });
      toast({
        title: "Protocol Updated",
        description: `Switched to ${TRAINING_PLANS[selectedPlan].name}`,
      });
      onOpenChange(false);
      setSelectedPlan(null);
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Could not update your protocol. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-lg">Change Protocol</SheetTitle>
        </SheetHeader>
        
        <div className="space-y-3 mb-6">
          {(Object.keys(TRAINING_PLANS) as TrainingPlanId[]).map((planId) => {
            const plan = TRAINING_PLANS[planId];
            const PlanIcon = PLAN_ICONS[planId];
            const isSelected = selectedPlan === planId;
            const isCurrent = currentPlan === planId;
            
            // Calculate XP breakdown using plan values
            const detoxXPTarget = Math.round(plan.detox.weeklyMinutes * plan.detox.xpPerMinute);
            const tasksXPTarget = plan.contentXPTarget;
            const gamesXPTarget = Math.max(0, plan.weeklyXPTarget - tasksXPTarget - detoxXPTarget);
            
            return (
              <button
                key={planId}
                onClick={() => setSelectedPlan(planId)}
                className={cn(
                  "w-full p-4 rounded-xl border text-left transition-all",
                  isSelected 
                    ? "border-primary bg-primary/5" 
                    : "border-border/40 bg-card hover:bg-muted/30"
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                      isSelected ? "bg-primary/10" : "bg-muted/50"
                    )}>
                      <PlanIcon className={cn(
                        "w-5 h-5",
                        isSelected ? "text-primary" : "text-muted-foreground"
                      )} />
                    </div>
                    <div>
                      <p className={cn(
                        "text-sm font-medium",
                        isSelected && "text-primary"
                      )}>
                        {plan.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {plan.sessionDuration}/session
                      </p>
                    </div>
                  </div>
                  {isCurrent && (
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground px-2 py-0.5 rounded-full bg-muted/50">
                      Current
                    </span>
                  )}
                  {isSelected && !isCurrent && (
                    <Check className="w-5 h-5 text-primary" />
                  )}
                </div>
                
                {/* Capacity Breakdown */}
                <div className="ml-13 pl-13 border-t border-border/20 pt-2 mt-2">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Star className="w-3 h-3 text-amber-400" />
                    <span className="text-[11px] font-medium text-amber-400">{plan.weeklyXPTarget} CC/week</span>
                  </div>
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <BookMarked className="w-3 h-3 text-purple-400" />
                      <span className="text-[10px] text-muted-foreground">
                        Tasks: <span className="text-purple-400 font-medium">{tasksXPTarget}</span>
                      </span>
                    </div>
                    {plan.detox && (
                      <div className="flex items-center gap-1.5">
                        <Smartphone className="w-3 h-3 text-teal-400" />
                        <span className="text-[10px] text-muted-foreground">
                          Walk & Detox: <span className="text-teal-400 font-medium">{detoxXPTarget}</span>
                          <span className="text-muted-foreground/60"> ({Math.round(plan.detox.weeklyMinutes / 60)}h)</span>
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Dumbbell className="w-3 h-3 text-blue-400" />
                      <span className="text-[10px] text-muted-foreground">
                        Training: <span className="text-blue-400 font-medium">{gamesXPTarget}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <button
          onClick={handleConfirmProtocolChange}
          disabled={isUpdating || selectedPlan === currentPlan || !selectedPlan}
          className={cn(
            "w-full py-4 rounded-xl text-base font-semibold transition-all",
            selectedPlan && selectedPlan !== currentPlan
              ? "bg-primary text-primary-foreground active:scale-[0.98]"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          {isUpdating ? "Updating..." : "Confirm Change"}
        </button>
      </SheetContent>
    </Sheet>
  );
}
