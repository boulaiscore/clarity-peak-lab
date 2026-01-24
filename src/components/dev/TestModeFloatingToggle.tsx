/**
 * Floating Test Mode Toggle
 * 
 * A small floating button to quickly enable/disable test mode.
 * Positioned bottom-left, above the navbar.
 * 
 * TO REMOVE: Just delete the import and component from Home.tsx
 */

import { useTestMode } from "@/hooks/useTestMode";
import { FlaskConical } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function TestModeFloatingToggle() {
  const { isTestMode, toggleTestMode } = useTestMode();

  return (
    <motion.button
      onClick={toggleTestMode}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileTap={{ scale: 0.9 }}
      className={cn(
        "fixed bottom-20 left-4 z-50 w-10 h-10 rounded-full",
        "flex items-center justify-center",
        "bg-card border shadow-lg transition-colors duration-200",
        isTestMode 
          ? "border-green-500/50 bg-green-500/10 shadow-green-500/20" 
          : "border-border bg-card"
      )}
      aria-label={isTestMode ? "Disable Test Mode" : "Enable Test Mode"}
    >
      <FlaskConical 
        className={cn(
          "w-5 h-5 transition-colors duration-200",
          isTestMode ? "text-green-500" : "text-muted-foreground"
        )} 
      />
      
      {/* Active indicator dot */}
      {isTestMode && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500"
        />
      )}
    </motion.button>
  );
}
