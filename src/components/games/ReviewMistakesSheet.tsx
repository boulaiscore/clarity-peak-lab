/**
 * ============================================
 * REVIEW MISTAKES SHEET
 * ============================================
 * 
 * Post-hoc learning component for reviewing errors.
 * Access ONLY from End Screen.
 * 
 * Selection rules (max 5 cards):
 * 1. Timeouts (max 2)
 * 2. Most informative incorrect decisions
 * 3. Fill remaining with earliest or highest-impact errors
 * 
 * Each card shows:
 * - Round number
 * - Visual reconstruction of the choice set
 * - "Your choice" (highlighted)
 * - "Best choice" (highlighted)
 * - One short neutral micro-line (no theory)
 */

import { motion, AnimatePresence } from "framer-motion";
import { X, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

// ============================================
// TYPES
// ============================================

export interface ReviewMistake {
  roundNumber: number;
  isTimeout: boolean;
  
  // Visual reconstruction
  options: MistakeOption[];
  
  // What the user chose (index in options, or null if timeout)
  userChoiceIndex: number | null;
  
  // Correct answer (index in options)
  correctIndex: number;
  
  // One short neutral micro-line (no theory)
  microLine: string;
}

export interface MistakeOption {
  id: string;
  label: string; // Text or icon name to display
  type: "text" | "icon";
}

interface ReviewMistakesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mistakes: ReviewMistake[];
  gameName: string;
}

// ============================================
// MAIN COMPONENT
// ============================================

export function ReviewMistakesSheet({
  open,
  onOpenChange,
  mistakes,
  gameName,
}: ReviewMistakesSheetProps) {
  // Select up to 5 mistakes following the rules:
  // 1. Timeouts first (max 2)
  // 2. Most informative incorrect decisions
  // 3. Fill with earliest errors
  const selectMistakes = (all: ReviewMistake[]): ReviewMistake[] => {
    if (all.length === 0) return [];
    
    const timeouts = all.filter(m => m.isTimeout).slice(0, 2);
    const nonTimeouts = all.filter(m => !m.isTimeout);
    
    // Sort non-timeouts by round number (earliest first)
    const sortedNonTimeouts = [...nonTimeouts].sort((a, b) => a.roundNumber - b.roundNumber);
    
    const remainingSlots = 5 - timeouts.length;
    const selectedNonTimeouts = sortedNonTimeouts.slice(0, remainingSlots);
    
    // Combine and sort by round number for display
    return [...timeouts, ...selectedNonTimeouts].sort((a, b) => a.roundNumber - b.roundNumber);
  };
  
  const displayMistakes = selectMistakes(mistakes);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] p-0">
        <SheetHeader className="p-4 pb-2 border-b border-border/30">
          <SheetTitle className="flex items-center justify-between">
            <span className="text-base">Review Mistakes</span>
            <span className="text-xs text-muted-foreground font-normal">
              {displayMistakes.length} of {mistakes.length} shown
            </span>
          </SheetTitle>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(85vh-80px)]">
          <div className="p-4 space-y-4">
            {displayMistakes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-emerald-400/50" />
                <p className="text-sm">No mistakes to review!</p>
                <p className="text-xs mt-1">Perfect performance.</p>
              </div>
            ) : (
              displayMistakes.map((mistake, index) => (
                <MistakeCard key={`${mistake.roundNumber}-${index}`} mistake={mistake} />
              ))
            )}
            
            {/* Info note */}
            {displayMistakes.length > 0 && (
              <div className="text-center py-4">
                <p className="text-[10px] text-muted-foreground/60 italic">
                  Learning happens after practice, not during.
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

// ============================================
// MISTAKE CARD COMPONENT
// ============================================

function MistakeCard({ mistake }: { mistake: ReviewMistake }) {
  const { roundNumber, isTimeout, options, userChoiceIndex, correctIndex, microLine } = mistake;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl bg-card border border-border/30"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-muted-foreground">Round {roundNumber}</span>
        {isTimeout && (
          <div className="flex items-center gap-1 text-orange-400/80">
            <Clock className="w-3 h-3" />
            <span className="text-[10px]">Timeout</span>
          </div>
        )}
      </div>
      
      {/* Options Grid */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {options.map((option, idx) => {
          const isUserChoice = idx === userChoiceIndex;
          const isCorrect = idx === correctIndex;
          
          return (
            <div
              key={option.id}
              className={cn(
                "p-2.5 rounded-lg border text-center text-sm transition-all",
                isCorrect && "border-emerald-500/50 bg-emerald-500/10",
                isUserChoice && !isCorrect && "border-red-500/30 bg-red-500/5",
                !isCorrect && !isUserChoice && "border-border/30 bg-muted/10 opacity-50"
              )}
            >
              <span className={cn(
                isCorrect ? "text-emerald-400" : 
                isUserChoice ? "text-red-400/80" : 
                "text-muted-foreground"
              )}>
                {option.label}
              </span>
              
              {/* Label badges */}
              <div className="flex justify-center gap-1 mt-1">
                {isUserChoice && (
                  <span className={cn(
                    "text-[8px] px-1.5 py-0.5 rounded-full",
                    isCorrect 
                      ? "bg-emerald-500/20 text-emerald-400" 
                      : "bg-red-500/20 text-red-400"
                  )}>
                    Your choice
                  </span>
                )}
                {isCorrect && !isUserChoice && (
                  <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                    Best choice
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Micro-line (neutral, no theory) */}
      <p className="text-[11px] text-muted-foreground text-center italic">
        {microLine}
      </p>
    </motion.div>
  );
}
