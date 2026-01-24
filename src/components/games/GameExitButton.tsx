/**
 * Game Exit Button - Reusable component for all games
 * 
 * Shows a floating X button during gameplay that triggers
 * an exit confirmation or directly exits.
 */

import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface GameExitButtonProps {
  onExit: () => void;
  /** If true, shows confirmation dialog. Default: true */
  showConfirmation?: boolean;
  /** Custom class names */
  className?: string;
}

export function GameExitButton({ 
  onExit, 
  showConfirmation = true,
  className 
}: GameExitButtonProps) {
  if (!showConfirmation) {
    return (
      <button
        onClick={onExit}
        className={cn(
          "absolute top-3 right-3 z-50 p-2 rounded-full",
          "bg-white/5 hover:bg-white/10 active:scale-95",
          "transition-all duration-150",
          className
        )}
        aria-label="Exit game"
      >
        <X className="w-5 h-5 text-white/60" />
      </button>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          className={cn(
            "absolute top-3 right-3 z-50 p-2 rounded-full",
            "bg-white/5 hover:bg-white/10 active:scale-95",
            "transition-all duration-150",
            className
          )}
          aria-label="Exit game"
        >
          <X className="w-5 h-5 text-white/60" />
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-card border-border">
        <AlertDialogHeader>
          <AlertDialogTitle>Exit Game?</AlertDialogTitle>
          <AlertDialogDescription>
            Your progress will be lost. Are you sure you want to exit?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-muted hover:bg-muted/80">
            Continue Playing
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onExit}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Exit
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
