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
import { Clock } from "lucide-react";

interface DailyTrainingConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reminderTime: string;
  onConfirm: () => void;
}

export function DailyTrainingConfirmDialog({
  open,
  onOpenChange,
  reminderTime,
  onConfirm,
}: DailyTrainingConfirmDialogProps) {
  // Format time for display (e.g., "08:30" -> "8:30 AM")
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
            <Clock className="w-6 h-6 text-primary" />
          </div>
          <AlertDialogTitle className="text-center">
            Start Daily Training?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            You're starting training outside your scheduled time ({formatTime(reminderTime)}). 
            This session will count as your daily training.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <AlertDialogAction 
            onClick={onConfirm}
            className="w-full"
          >
            Start Training
          </AlertDialogAction>
          <AlertDialogCancel className="w-full mt-0">
            Cancel
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
