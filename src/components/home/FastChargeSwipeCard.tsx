/**
 * FastChargeSwipeCard - WHOOP-style swipe-to-unlock for Fast Charge
 *
 * Disabled state when an Acute Recovery Boost is currently on cooldown
 * or the daily limit (3) has been reached.
 */

import { useState, useRef } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { MeditationIcon } from "@/components/icons/MeditationIcon";
import { useNavigate } from "react-router-dom";
import { useAcuteRecoveryBoost } from "@/hooks/useAcuteRecoveryBoost";
import { formatRemainingMinutes } from "@/lib/recovery/acuteBoost";

export function FastChargeSwipeCard() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isActivating, setIsActivating] = useState(false);
  const x = useMotionValue(0);
  const maxSwipe = 200;
  const activationThreshold = 160;

  const { canApply, unavailableReason, nextAvailableAt, usedToday, isActive, remainingMinutes } =
    useAcuteRecoveryBoost();

  const backgroundWidth = useTransform(x, [0, maxSwipe], ["0%", "100%"]);
  const opacity = useTransform(x, [0, activationThreshold], [0.6, 1]);
  const iconScale = useTransform(x, [0, activationThreshold], [1, 1.2]);
  const chevronOpacity = useTransform(x, [0, 80], [1, 0]);

  const handleDragEnd = () => {
    const currentX = x.get();
    if (currentX >= activationThreshold) {
      setIsActivating(true);
      animate(x, maxSwipe, { duration: 0.2 });
      setTimeout(() => navigate("/recharging"), 300);
    } else {
      animate(x, 0, { type: "spring", stiffness: 400, damping: 30 });
    }
  };

  // ── Disabled / locked states ─────────────────────────────────────────────
  if (!canApply) {
    let label = "";
    if (unavailableReason === "cooldown" && nextAvailableAt) {
      const minsLeft = Math.max(
        0,
        (new Date(nextAvailableAt).getTime() - Date.now()) / 60_000
      );
      label = `Available in ${formatRemainingMinutes(minsLeft)}`;
    } else if (unavailableReason === "daily_limit") {
      label = "Daily limit reached — recover with sleep tonight";
    }

    return (
      <div className="relative w-full h-14 rounded-xl bg-muted/20 border border-border/20 overflow-hidden flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <MeditationIcon className="w-4 h-4 text-muted-foreground/40" />
          <span className="text-xs font-semibold text-muted-foreground/60">Fast Recover</span>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50">
          {label}
        </span>
      </div>
    );
  }

  // ── Available — swipe to activate ────────────────────────────────────────
  const remainingLabel = isActive
    ? `Boost active · ${formatRemainingMinutes(remainingMinutes)}`
    : usedToday > 0
    ? `${usedToday}/3 used today`
    : "Swipe to reset";

  return (
    <div
      ref={containerRef}
      className="relative w-full h-14 rounded-xl bg-muted/40 border border-border/30 overflow-hidden"
    >
      <motion.div
        className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary/20 to-primary/10 rounded-xl"
        style={{ width: backgroundWidth }}
      />

      <div className="absolute inset-0 flex items-center justify-end pr-4 pointer-events-none">
        <motion.div
          className="flex items-center gap-2 text-muted-foreground"
          style={{ opacity: chevronOpacity }}
        >
          <ChevronRight className="w-4 h-4 animate-pulse" />
          <ChevronRight
            className="w-4 h-4 -ml-3 opacity-60 animate-pulse"
            style={{ animationDelay: "0.1s" }}
          />
        </motion.div>
      </div>

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none pl-32">
        <span className="text-xs text-muted-foreground/70 uppercase tracking-wider font-medium">
          {remainingLabel}
        </span>
      </div>

      <motion.button
        className="absolute left-1 top-1 bottom-1 w-32 rounded-lg bg-card border border-border/50 flex items-center justify-center shadow-sm cursor-grab active:cursor-grabbing touch-none"
        style={{ x, opacity }}
        drag="x"
        dragConstraints={{ left: 0, right: maxSwipe }}
        dragElastic={0}
        onDragEnd={handleDragEnd}
        whileTap={{ scale: 0.98 }}
        disabled={isActivating}
      >
        <motion.div style={{ scale: iconScale }} className="flex items-center gap-1.5">
          <MeditationIcon className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-semibold text-foreground">Fast Recover</span>
        </motion.div>
      </motion.button>
    </div>
  );
}
