import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/app/AppShell";
import { SessionStartModal } from "@/components/app/SessionStartModal";
import { useSession } from "@/contexts/SessionContext";
import { useAuth } from "@/contexts/AuthContext";
import type { ProtocolType } from "@/lib/protocols";
import { FlaskConical, Target, Workflow } from "lucide-react";
import { cn } from "@/lib/utils";

const modules = [
  {
    type: "reasoning" as ProtocolType,
    icon: FlaskConical,
    title: "Reasoning Workout™",
    subtitle: "Train your analytical and critical thinking abilities.",
  },
  {
    type: "clarity" as ProtocolType,
    icon: Target,
    title: "Clarity Lab™",
    subtitle: "Develop mental sharpness, conceptual clarity, and problem decomposition.",
  },
  {
    type: "decision" as ProtocolType,
    icon: Workflow,
    title: "Decision Studio™",
    subtitle: "Upgrade your strategic decision-making under uncertainty.",
  },
];

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { startSession, getTotalSessions } = useSession();
  const [modalOpen, setModalOpen] = useState(false);

  const handleModuleClick = (type: ProtocolType) => {
    startSession(type);
    setModalOpen(true);
  };

  const handleStartProtocol = () => {
    setModalOpen(false);
    navigate("/app/protocol");
  };

  const totalSessions = getTotalSessions();
  const firstName = user?.name?.split(" ")[0] || "there";

  return (
    <AppShell>
      <div className="container px-6 py-10 sm:py-16">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/8 border border-primary/15 mb-8">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-medium text-primary/90 tracking-wide">Cognitive Training</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold mb-4 tracking-tight">
            Hello, <span className="text-gradient">{firstName}</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Select a training module to begin.
          </p>
        </div>

        {/* Module Cards - Full width, touch-friendly */}
        <div className="max-w-xl mx-auto space-y-4">
          {modules.map((module, index) => (
            <button
              key={module.type}
              onClick={() => handleModuleClick(module.type)}
              className={cn(
                "group relative w-full p-6 sm:p-8 rounded-xl bg-card border border-border",
                "hover:border-primary/30 transition-all duration-300",
                "text-left overflow-hidden min-h-[120px] touch-target shadow-card",
                "animate-fade-in-up"
              )}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Gradient hover */}
              <div className="absolute inset-0 bg-gradient-glow opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Content */}
              <div className="relative z-10 flex items-start gap-5">
                <div className="w-14 h-14 rounded-xl bg-primary/8 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                  <module.icon className="w-7 h-7 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg sm:text-xl font-semibold mb-1.5">{module.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{module.subtitle}</p>
                </div>
                
                {/* Arrow */}
                <div className="w-10 h-10 rounded-full bg-primary/8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 shrink-0 self-center">
                  <svg
                    className="w-4 h-4 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Stats */}
        {totalSessions > 0 && (
          <div className="mt-12 text-center">
            <p className="text-muted-foreground text-sm">
              <span className="text-foreground font-semibold">{totalSessions}</span> training session{totalSessions !== 1 ? "s" : ""} completed
            </p>
          </div>
        )}

        {/* Tagline */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground/60 text-sm">
            Train your mind for elite reasoning.
          </p>
        </div>
      </div>

      <SessionStartModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onStart={handleStartProtocol}
      />
    </AppShell>
  );
};

export default Home;
