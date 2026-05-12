/**
 * useExitConfirmation
 * 
 * Reusable confirmation dialog for exiting a game mid-session.
 * Returns a `requestExit` handler and a `<ConfirmDialog />` element
 * to render once in the runner.
 * 
 * The actual exit (which discards progress / score) is delegated
 * to the `onConfirm` callback, so no scoring side effects happen
 * unless the user confirms.
 */

import { useCallback, useState } from "react";
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

export function useExitConfirmation(onConfirm: () => void) {
  const [open, setOpen] = useState(false);

  const requestExit = useCallback(() => {
    setOpen(true);
  }, []);

  const handleConfirm = useCallback(() => {
    setOpen(false);
    onConfirm();
  }, [onConfirm]);

  const ConfirmDialog = (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="bg-card border-border">
        <AlertDialogHeader>
          <AlertDialogTitle>Exit session?</AlertDialogTitle>
          <AlertDialogDescription>
            Your progress in this session will be lost and no score will be recorded.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-muted hover:bg-muted/80">
            Continue Playing
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Exit
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return { requestExit, ConfirmDialog };
}
