import { useState } from "react";
import CognitiveReport from "@/pages/app/CognitiveReport";
import ReportPreview from "@/pages/app/ReportPreview";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SessionProvider } from "@/contexts/SessionContext";
import { IntradayEventsProvider } from "@/contexts/IntradayEventsContext";
import { useAutoSeedExercises } from "@/hooks/useAutoSeedExercises";
import { useNotificationInit } from "@/hooks/useNotificationInit";
import { useDeepLinks } from "@/hooks/useDeepLinks";
import { SplashScreen } from "@/components/app/SplashScreen";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Home from "./pages/app/Home";
import Dashboard from "./pages/app/Dashboard";
import Protocol from "./pages/app/Protocol";

import Premium from "./pages/app/Premium";
import ProfilePage from "./pages/app/ProfilePage";
import SettingsPage from "./pages/app/SettingsPage";
import SubscriptionPage from "./pages/app/SubscriptionPage";
import PaywallPage from "./pages/app/PaywallPage";
import TrainingsList from "./pages/app/TrainingsList";
import TrainingRunner from "./pages/app/TrainingRunner";
import DynamicTrainingRunner from "./pages/app/DynamicTrainingRunner";
import InstallPage from "./pages/app/Install";
import NeuroLab from "./pages/app/NeuroLab";
import Health from "./pages/app/Health";
import NeuroLabArea from "./pages/app/NeuroLabArea";
import NeuroLabSessionRunner from "./pages/app/NeuroLabSessionRunner";
import TriageSprintRunner from "./pages/app/TriageSprintRunner";
import OrbitLockRunner from "./pages/app/OrbitLockRunner";
import FocusSwitchRunner from "./pages/app/FocusSwitchRunner";
import FlashConnectRunner from "./pages/app/FlashConnectRunner";
import ConstellationSnapRunner from "./pages/app/ConstellationSnapRunner";
import SemanticDriftRunner from "./pages/app/SemanticDriftRunner";
import CausalLedgerRunner from "./pages/app/CausalLedgerRunner";
import CounterfactualAuditRunner from "./pages/app/CounterfactualAuditRunner";
import SocraticCrossExamRunner from "./pages/app/SocraticCrossExamRunner";
import SignalVsNoiseRunner from "./pages/app/SignalVsNoiseRunner";
import HiddenRuleLabRunner from "./pages/app/HiddenRuleLabRunner";
import CounterexampleForgeRunner from "./pages/app/CounterexampleForgeRunner";
import NeuralResetRunner from "./pages/app/NeuralResetRunner";
import RechargingRunner from "./pages/app/RechargingRunner";
import DetoxSessionRunner from "./pages/app/DetoxSessionRunner";
import DailySession from "./pages/app/DailySession";
import NotFound from "./pages/NotFound";
import QuickBaselineCalibration from "./pages/app/QuickBaselineCalibration";
import ReasoningQualityImpact from "./pages/app/ReasoningQualityImpact";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminUserDetail from "./pages/admin/AdminUserDetail";
import AdminSubscriptions from "./pages/admin/AdminSubscriptions";
import { AdminRoute } from "./components/admin/AdminRoute";

const queryClient = new QueryClient();

// Component that handles auto-seeding and notification initialization (outside Router)
function AppInitProvider({ children }: { children: React.ReactNode }) {
  useAutoSeedExercises();
  useNotificationInit();
  return <>{children}</>;
}

// Component that handles deep links (inside Router)
function DeepLinkHandler({ children }: { children: React.ReactNode }) {
  useDeepLinks();
  return <>{children}</>;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Check if user needs onboarding
  if (!user.onboardingCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

function OnboardingRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Root redirects to auth for app-only prototype */}
      <Route path="/" element={<Navigate to="/auth" replace />} />
      <Route path="/auth" element={<Auth />} />
      <Route
        path="/onboarding"
        element={
          <OnboardingRoute>
            <Onboarding />
          </OnboardingRoute>
        }
      />
      <Route
        path="/app/calibration"
        element={
          <OnboardingRoute>
            <QuickBaselineCalibration />
          </OnboardingRoute>
        }
      />
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/report"
        element={
          <ProtectedRoute>
            <CognitiveReport />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/report-preview"
        element={
          <ProtectedRoute>
            <ReportPreview />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/trainings"
        element={
          <ProtectedRoute>
            <TrainingsList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/training/:trainingId"
        element={
          <ProtectedRoute>
            <TrainingRunner />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/train"
        element={
          <ProtectedRoute>
            <DynamicTrainingRunner />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/protocol"
        element={
          <ProtectedRoute>
            <Protocol />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/premium"
        element={
          <ProtectedRoute>
            <Premium />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/subscription"
        element={
          <ProtectedRoute>
            <SubscriptionPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/paywall"
        element={
          <ProtectedRoute>
            <PaywallPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/install"
        element={
          <ProtectedRoute>
            <InstallPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/neuro-lab"
        element={
          <ProtectedRoute>
            <NeuroLab />
          </ProtectedRoute>
        }
      />
      <Route
        path="/neuro-lab/:area"
        element={
          <ProtectedRoute>
            <NeuroLabArea />
          </ProtectedRoute>
        }
      />
      <Route
        path="/neuro-lab/session"
        element={
          <ProtectedRoute>
            <NeuroLabSessionRunner />
          </ProtectedRoute>
        }
      />
      <Route
        path="/neuro-lab/:area/session"
        element={
          <ProtectedRoute>
            <NeuroLabSessionRunner />
          </ProtectedRoute>
        }
      />
      <Route
        path="/neuro-lab/triage-sprint"
        element={
          <ProtectedRoute>
            <TriageSprintRunner />
          </ProtectedRoute>
        }
      />
      <Route
        path="/neuro-lab/orbit-lock"
        element={
          <ProtectedRoute>
            <OrbitLockRunner />
          </ProtectedRoute>
        }
      />
      <Route
        path="/neuro-lab/focus-switch"
        element={
          <ProtectedRoute>
            <FocusSwitchRunner />
          </ProtectedRoute>
        }
      />
      <Route
        path="/neuro-lab/flash-connect"
        element={
          <ProtectedRoute>
            <FlashConnectRunner />
          </ProtectedRoute>
        }
      />
      <Route
        path="/neuro-lab/constellation-snap"
        element={
          <ProtectedRoute>
            <ConstellationSnapRunner />
          </ProtectedRoute>
        }
      />
      <Route
        path="/neuro-lab/semantic-drift"
        element={
          <ProtectedRoute>
            <SemanticDriftRunner />
          </ProtectedRoute>
        }
      />
      <Route
        path="/neuro-lab/causal-ledger"
        element={
          <ProtectedRoute>
            <CausalLedgerRunner />
          </ProtectedRoute>
        }
      />
      <Route
        path="/neuro-lab/counterfactual-audit"
        element={
          <ProtectedRoute>
            <CounterfactualAuditRunner />
          </ProtectedRoute>
        }
      />
      <Route
        path="/neuro-lab/socratic-cross-exam"
        element={
          <ProtectedRoute>
            <SocraticCrossExamRunner />
          </ProtectedRoute>
        }
      />
      <Route
        path="/neuro-lab/signal-vs-noise"
        element={
          <ProtectedRoute>
            <SignalVsNoiseRunner />
          </ProtectedRoute>
        }
      />
      <Route
        path="/neuro-lab/hidden-rule-lab"
        element={
          <ProtectedRoute>
            <HiddenRuleLabRunner />
          </ProtectedRoute>
        }
      />
      <Route
        path="/neuro-lab/counterexample-forge"
        element={
          <ProtectedRoute>
            <CounterexampleForgeRunner />
          </ProtectedRoute>
        }
      />
      <Route
        path="/neural-reset"
        element={
          <ProtectedRoute>
            <NeuralResetRunner />
          </ProtectedRoute>
        }
      />
      <Route
        path="/recharging"
        element={
          <ProtectedRoute>
            <RechargingRunner />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/daily-session"
        element={
          <ProtectedRoute>
            <DailySession />
          </ProtectedRoute>
        }
      />
      <Route
        path="/detox-session"
        element={
          <ProtectedRoute>
            <DetoxSessionRunner />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/health"
        element={
          <ProtectedRoute>
            <Health />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/reasoning-quality-impact"
        element={
          <ProtectedRoute>
            <ReasoningQualityImpact />
          </ProtectedRoute>
        }
      />
      
      {/* Admin Routes */}
      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
      <Route path="/admin/users/:userId" element={<AdminRoute><AdminUserDetail /></AdminRoute>} />
      <Route path="/admin/subscriptions" element={<AdminRoute><AdminSubscriptions /></AdminRoute>} />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SessionProvider>
          <IntradayEventsProvider>
            <AppInitProvider>
              <TooltipProvider>
                {showSplash && (
                  <SplashScreen 
                    duration={2500} 
                    onComplete={() => setShowSplash(false)} 
                  />
                )}
                <Toaster />
                <Sonner />
                <HashRouter>
                  <DeepLinkHandler>
                    <AppRoutes />
                  </DeepLinkHandler>
                </HashRouter>
              </TooltipProvider>
            </AppInitProvider>
          </IntradayEventsProvider>
        </SessionProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
