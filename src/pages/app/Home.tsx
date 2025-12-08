import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/app/AppShell";
import { SessionStartModal } from "@/components/app/SessionStartModal";
import { useSession } from "@/contexts/SessionContext";
import { useAuth } from "@/contexts/AuthContext";
import type { ProtocolType } from "@/lib/protocols";
import { FlaskConical, Target, Workflow, ChevronRight } from "lucide-react";
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
        <div className="mb-8">
          <p className="label-uppercase mb-1">Cognitive Training</p>
          <h1 className="text-xl font-semibold tracking-tight">
            Hello, {firstName}
          </h1>
        </div>

        {/* Module Cards */}
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

        {/* Stats */}
        {totalSessions > 0 && (
          <div className="mt-8 p-4 rounded-xl bg-card border border-border/40">
            <div className="flex items-center justify-between">
              <span className="label-uppercase">Sessions Completed</span>
              <span className="text-2xl font-semibold text-foreground number-display">{totalSessions}</span>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate("/app/dashboard")}
            className="p-4 rounded-xl bg-card border border-border/40 text-left hover:border-primary/30 transition-colors active:scale-[0.98]"
          >
            <span className="label-uppercase">View</span>
            <p className="text-sm font-medium text-foreground mt-1">Dashboard</p>
          </button>
          <button
            onClick={() => navigate("/app/insights")}
            className="p-4 rounded-xl bg-card border border-border/40 text-left hover:border-primary/30 transition-colors active:scale-[0.98]"
          >
            <span className="label-uppercase">View</span>
            <p className="text-sm font-medium text-foreground mt-1">Insights</p>
          </button>
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