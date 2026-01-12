import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { WEEKLY_GOAL_MESSAGES } from "@/lib/cognitiveFeedback";
import { Trophy } from "lucide-react";

interface TargetExceededDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  categoryName: "Challenges" | "Tasks" | "Recovery";
}

export function TargetExceededDialog({
  open,
  onOpenChange,
  onConfirm,
  categoryName,
}: TargetExceededDialogProps) {
  const messages = WEEKLY_GOAL_MESSAGES.targetExceededWarning;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-emerald-500/15 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-emerald-400" />
            </div>
            <AlertDialogTitle className="text-base">
              {categoryName} {messages.title}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-sm text-muted-foreground">
            {messages.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel className="text-sm">
            {messages.cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="text-sm bg-muted hover:bg-muted/80 text-foreground"
          >
            {messages.confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
