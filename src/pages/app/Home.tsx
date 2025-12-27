import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AppShell } from "@/components/app/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronRight } from "lucide-react";
import { useWeeklyProgress } from "@/hooks/useWeeklyProgress";
import { useCognitiveReadiness } from "@/hooks/useCognitiveReadiness";

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { sessionsCompleted } = useWeeklyProgress();
  const { cognitiveReadinessScore, isLoading: readinessLoading } = useCognitiveReadiness();

  const hasProtocol = !!user?.trainingPlan;
  const readinessScore = cognitiveReadinessScore ?? 50;

  const handleStartSession = () => {
    navigate("/neuro-lab");
  };

  // No protocol configured
  if (!hasProtocol) {
    return (
      <AppShell>
        <main className="flex flex-col items-center justify-center min-h-[calc(100dvh-theme(spacing.12)-theme(spacing.14))] px-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-sm"
          >
            <h1 className="text-xl font-semibold mb-2">Configure Protocol</h1>
            <p className="text-sm text-muted-foreground/60 mb-8">
              Assessment required before training
            </p>
            <button
              onClick={() => navigate("/onboarding")}
              className="inline-flex items-center px-6 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
            >
              Begin Assessment
            </button>
          </motion.div>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className="flex flex-col min-h-[calc(100dvh-theme(spacing.12)-theme(spacing.14))] px-6 py-8 max-w-md mx-auto">
        
        {/* Header / Identity */}
        <motion.header
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground/50 mb-1">
            Active Protocol
          </p>
          <h1 className="text-lg font-semibold tracking-tight">Superhuman</h1>
          <p className="text-xs text-muted-foreground/40 mt-0.5">
            High-performance conditioning
          </p>
        </motion.header>

        {/* Readiness Block */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-16"
        >
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground/50 mb-2">
            Readiness
          </p>
          <p className="text-4xl font-semibold tabular-nums text-primary mb-2">
            {readinessLoading ? "—" : `${Math.round(readinessScore)}%`}
          </p>
          <p className="text-sm text-muted-foreground/70">
            Hold intensity. Execute clean.
          </p>
        </motion.section>

        {/* Today's Session - PRIMARY ELEMENT */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex-1 flex flex-col"
        >
          <div className="flex-1 flex flex-col justify-center">
            
            {/* Session Card */}
            <div className="mb-10">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/40 mb-3">
                Today's prescription
              </p>
              
              <h2 className="text-2xl font-semibold tracking-tight mb-2">
                Heavy Slow Thinking
              </h2>
              
              <p className="text-sm text-muted-foreground/60 mb-4">
                Priming required · High-load System 2
              </p>
              
              <p className="text-xs text-muted-foreground/40">
                30–35 min · S2 · Priming included
              </p>
            </div>

            {/* Primary CTA */}
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              onClick={handleStartSession}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-primary text-primary-foreground text-base font-semibold active:scale-[0.98] transition-transform"
            >
              Proceed to Training
              <ChevronRight className="w-5 h-5" />
            </motion.button>

            {/* Focus Line */}
            <p className="text-xs text-muted-foreground/50 text-center mt-6">
              Focus: clarity under cognitive load
            </p>
          </div>
        </motion.section>

        {/* Footer Micro */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="pt-8"
        >
          <p className="text-[10px] text-muted-foreground/30 text-center uppercase tracking-[0.15em]">
            {sessionsCompleted + 1} of 3 sessions scheduled
          </p>
        </motion.footer>
      </main>
    </AppShell>
  );
};

export default Home;
