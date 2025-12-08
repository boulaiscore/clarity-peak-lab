import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/app/AppShell";
import { ControlCard } from "@/components/app/ControlCard";
import { SessionStartModal } from "@/components/app/SessionStartModal";
import { useSession } from "@/contexts/SessionContext";
import { useAuth } from "@/contexts/AuthContext";
import type { ProtocolType } from "@/lib/protocols";
import { Flame, Brain, Scale, Sparkles } from "lucide-react";

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { startSession, getTotalSessions } = useSession();
  const [modalOpen, setModalOpen] = useState(false);

  const handleControlClick = (type: ProtocolType) => {
    startSession(type);
    setModalOpen(true);
  };

  const handleStartProtocol = () => {
    setModalOpen(false);
    navigate("/app/protocol");
  };

  const totalSessions = getTotalSessions();

  return (
    <AppShell>
      <div className="container px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Mental Control Center</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Hello, <span className="text-gradient">{user?.name || "there"}</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            What do you need right now?
          </p>
        </div>

        {/* Control Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <ControlCard
            icon={Flame}
            title="Reduce Stress"
            description="Quick protocols to break the stress loop and regain composure."
            onClick={() => handleControlClick("stress")}
            gradient="from-red-500/20 to-orange-500/20"
          />
          <ControlCard
            icon={Brain}
            title="Boost Clarity"
            description="Sharpen your focus before high-stakes work or deep concentration."
            onClick={() => handleControlClick("clarity")}
            gradient="from-blue-500/20 to-cyan-500/20"
          />
          <ControlCard
            icon={Scale}
            title="Decision Pro"
            description="Cut through analysis paralysis and make better choices under pressure."
            onClick={() => handleControlClick("decision")}
            gradient="from-purple-500/20 to-pink-500/20"
          />
        </div>

        {/* Stats */}
        {totalSessions > 0 && (
          <div className="mt-12 text-center">
            <p className="text-muted-foreground text-sm">
              You've completed <span className="text-foreground font-semibold">{totalSessions}</span> session{totalSessions !== 1 ? "s" : ""}
            </p>
          </div>
        )}

        {/* Tagline */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground text-sm">
            Designed for founders, executives, and high performers who care about their brain.
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
