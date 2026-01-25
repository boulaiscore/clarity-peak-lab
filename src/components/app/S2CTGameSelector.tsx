/**
 * S2-CT Game Selector v1.0
 * 
 * Selector for System 2 Critical Thinking games.
 * Currently features Causal Ledger.
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Brain, Scale, ChevronRight, Lock, ShieldAlert, Sparkles, Star, Timer, Clock } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useGamesGating } from "@/hooks/useGamesGating";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { subDays, format } from "date-fns";

interface S2CTGameSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface GameOption {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: React.ElementType;
  route: string;
  estimatedXP: number;
  estimatedDuration: string;
  accentColor: "violet";
}

const GAMES: GameOption[] = [
  {
    id: "causal_ledger",
    name: "Causal Ledger",
    tagline: "Causal Reasoning",
    description: "Evaluate the validity of causal claims under uncertainty. Judge reasoning quality, not answers.",
    icon: Scale,
    route: "/neuro-lab/causal-ledger",
    estimatedXP: 20,
    estimatedDuration: "8-10 min",
    accentColor: "violet",
  },
  {
    id: "counterfactual_audit",
    name: "Counterfactual Audit",
    tagline: "Evidence Discipline",
    description: "Find the one missing fact that flips the decision. Train calibration and counterfactual reasoning.",
    icon: Brain,
    route: "/neuro-lab/counterfactual-audit",
    estimatedXP: 20,
    estimatedDuration: "~4 min",
    accentColor: "violet",
  },
  {
    id: "socratic_cross_exam",
    name: "Socratic Cross-Exam",
    tagline: "Assumption Analysis",
    description: "Surface hidden assumptions and test internal consistency. Discovery-based reasoning.",
    icon: Brain,
    route: "/neuro-lab/socratic-cross-exam",
    estimatedXP: 18,
    estimatedDuration: "4-6 min",
    accentColor: "violet",
  },
];

// Helper to get human-readable reason
function getWithholdReason(reasonCode?: string): string {
  if (!reasonCode) return "Unavailable";
  
  switch (reasonCode) {
    case "RECOVERY_TOO_LOW":
      return "Recovery is low — build recovery through Detox or Walk";
    case "SHARPNESS_TOO_LOW":
      return "Sharpness below threshold";
    case "CAP_REACHED_DAILY_S2":
      return "Daily reasoning limit reached";
    default:
      return "Temporarily unavailable";
  }
}

export function S2CTGameSelector({ open, onOpenChange }: S2CTGameSelectorProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Get gating status for S2-CT
  const { games: gatingResults, isLoading: gatingLoading } = useGamesGating();
  const s2ctGating = gatingResults["S2-CT"];
  const isLocked = s2ctGating && s2ctGating.status !== "ENABLED";
  const isProtection = s2ctGating?.status === "PROTECTION";
  
  // Fetch recently played games (last 7 days)
  const sevenDaysAgo = format(subDays(new Date(), 7), "yyyy-MM-dd'T'HH:mm:ss");
  const { data: recentlyPlayedGames } = useQuery({
    queryKey: ["recently-played-ct-games", user?.id, sevenDaysAgo],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("game_sessions")
        .select("game_name, game_type")
        .eq("user_id", user.id)
        .eq("game_type", "S2-CT")
        .gte("completed_at", sevenDaysAgo);
      
      if (error) throw error;
      
      // Check if any CT games played recently
      return (data || []).length > 0 ? ["causal_ledger"] : [];
    },
    enabled: !!user?.id && open,
    staleTime: 60_000,
    placeholderData: [],
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const handleSelectGame = (game: GameOption) => {
    if (isLocked) return;
    
    onOpenChange(false);
    setTimeout(() => {
      navigate(game.route);
    }, 150);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
        >
          <DrawerHeader className="pb-4">
            <DrawerTitle className="flex items-center gap-2 text-base">
              <div className="w-8 h-8 rounded-lg bg-area-slow/15 flex items-center justify-center">
                <Brain className="w-4 h-4 text-area-slow" />
              </div>
              <div>
                <span className="text-foreground">Critical Thinking</span>
                <span className="text-xs text-muted-foreground ml-2">S2-CT</span>
              </div>
            </DrawerTitle>
          </DrawerHeader>

          <div className="space-y-3 pb-6">
            {/* Show lock banner if games are locked */}
            {isLocked && (
              <Alert className={cn(
                "border",
                isProtection 
                  ? "border-protection/30 bg-protection/5" 
                  : "border-muted-foreground/20 bg-muted/30"
              )}>
                {isProtection ? (
                  <ShieldAlert className="h-4 w-4 text-protection" />
                ) : (
                  <Lock className="h-4 w-4 text-muted-foreground" />
                )}
                <AlertDescription className="text-xs text-muted-foreground">
                  {getWithholdReason(s2ctGating?.reasonCode)}
                </AlertDescription>
              </Alert>
            )}
            
            {gatingLoading ? (
              <Skeleton className="h-28 w-full rounded-xl" />
            ) : (
              GAMES.map((game, index) => {
                const Icon = game.icon;
                const isRecentlyPlayed = recentlyPlayedGames?.includes(game.id) ?? false;
                
                return (
                  <motion.button
                    key={game.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleSelectGame(game)}
                    disabled={isLocked}
                    className={cn(
                      "w-full p-4 rounded-xl border text-left transition-all",
                      "group relative",
                      isLocked
                        ? "bg-muted/20 border-border/30 opacity-60 cursor-not-allowed"
                        : cn(
                            "bg-background/50 hover:bg-background",
                            "hover:border-violet-500/30 active:scale-[0.98]",
                            "border-border/50"
                          )
                    )}
                  >
                    {/* Recently Played badge */}
                    {isRecentlyPlayed && !isLocked && (
                      <div className="absolute -top-2 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted/50 border border-border/50">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[9px] font-medium text-muted-foreground">
                          Recent
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                        isLocked ? "bg-muted/30" : "bg-violet-500/15"
                      )}>
                        {isLocked ? (
                          isProtection ? (
                            <ShieldAlert className="w-5 h-5 text-protection" />
                          ) : (
                            <Lock className="w-5 h-5 text-muted-foreground" />
                          )
                        ) : (
                          <Icon className="w-5 h-5 text-violet-400" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-semibold text-foreground">
                            {game.name}
                          </h4>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-400">
                            {game.tagline}
                          </span>
                        </div>
                        
                        <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">
                          {game.description}
                        </p>
                        
                        <div className="flex items-center gap-3 text-[10px]">
                          <div className="flex items-center gap-1 text-amber-400/80">
                            <Star className="w-3 h-3 fill-amber-400/50" />
                            <span>~{game.estimatedXP} XP</span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Timer className="w-3 h-3" />
                            <span>{game.estimatedDuration}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-center h-10">
                        <ChevronRight className="w-4 h-4 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </motion.button>
                );
              })
            )}
            
            {/* System 2 info */}
            <div className="text-center pt-2">
              <p className="text-[10px] text-muted-foreground/60">
                System 2 games train deliberate, analytical thinking
              </p>
            </div>
          </div>
        </motion.div>
      </DrawerContent>
    </Drawer>
  );
}
