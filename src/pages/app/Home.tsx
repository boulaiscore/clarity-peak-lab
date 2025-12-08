import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AppShell } from "@/components/app/AppShell";
import { SessionStartModal } from "@/components/app/SessionStartModal";
import { useSession } from "@/contexts/SessionContext";
import { useAuth } from "@/contexts/AuthContext";
import type { ProtocolType } from "@/lib/protocols";
import { FlaskConical, Target, Workflow, ChevronRight, Zap, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

const modules = [
  {
    type: "reasoning" as ProtocolType,
    icon: FlaskConical,
    title: "Reasoning Workout",
    subtitle: "Analytical and critical thinking",
  },
  {
    type: "clarity" as ProtocolType,
    icon: Target,
    title: "Clarity Lab",
    subtitle: "Mental sharpness and problem decomposition",
  },
  {
    type: "decision" as ProtocolType,
    icon: Workflow,
    title: "Decision Studio",
    subtitle: "Strategic decision-making under uncertainty",
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
      <div className="container px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <p className="label-uppercase mb-1">Cognitive Training</p>
          <h1 className="text-xl font-semibold tracking-tight">
            Hello, {firstName}
          </h1>
        </div>

        {/* Fast vs Slow Thinking Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Link to="/app/trainings?mode=fast">
            <div className="p-4 rounded-xl bg-card border border-border/40 hover:border-warning/30 transition-colors active:scale-[0.98] h-full">
              <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center mb-3">
                <Zap className="w-5 h-5 text-warning" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Fast Thinking</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">System 1 – Intuition</p>
              <p className="text-[9px] text-muted-foreground/60 mt-2 leading-relaxed">
                Train your intuition and snap judgments
              </p>
            </div>
          </Link>
          <Link to="/app/trainings?mode=slow">
            <div className="p-4 rounded-xl bg-card border border-border/40 hover:border-primary/30 transition-colors active:scale-[0.98] h-full">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Slow Thinking</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">System 2 – Structured</p>
              <p className="text-[9px] text-muted-foreground/60 mt-2 leading-relaxed">
                Slow down to think at a higher level
              </p>
            </div>
          </Link>
        </div>


        {/* Classic Protocol Modules */}
        <div className="mb-6">
          <h2 className="label-uppercase mb-3">Protocol Sessions</h2>
          <div className="space-y-3">
            {modules.map((module, index) => (
              <button
                key={module.type}
                onClick={() => handleModuleClick(module.type)}
                className={cn(
                  "group w-full p-4 rounded-xl bg-card border border-border/40",
                  "hover:border-primary/30 hover:bg-card/80 transition-all duration-200",
                  "text-left active:scale-[0.98]",
                  "animate-fade-in"
                )}
                style={{ animationDelay: `${index * 0.08}s` }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <module.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground">{module.title}</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{module.subtitle}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        {totalSessions > 0 && (
          <div className="p-4 rounded-xl bg-card border border-border/40 mb-6">
            <div className="flex items-center justify-between">
              <span className="label-uppercase">Sessions Completed</span>
              <span className="text-2xl font-semibold text-foreground number-display">{totalSessions}</span>
            </div>
          </div>
        )}

        {/* Tagline */}
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">
            Fast and Slow thinking are both skills. Train both.
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