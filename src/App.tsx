import { Suspense, useEffect, useState } from "react";
import { lazyWithRetry } from "@/lib/lazyWithRetry";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import ScrollToTop from "@/components/ScrollToTop";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { NativeSecurityProvider } from "@/contexts/NativeSecurityContext";
import { SessionProvider } from "@/contexts/SessionContext";
import { useDeepLinks } from "@/hooks/useDeepLinks";
import { AdminRoute } from "./components/admin/AdminRoute";

import { queryClient } from "@/lib/queryClient";
import { preloadPrimaryRoutes } from "@/lib/routePreload";
import { SubscriptionProvider } from "@/hooks/useSubscription";

// Route-level splitting keeps game runners, reports and admin tools out of the
// Home startup bundle. Native builds still load these chunks locally on demand.
const Auth = lazyWithRetry(() => import("./pages/Auth"));
const Onboarding = lazyWithRetry(() => import("./pages/Onboarding"));
const Home = lazyWithRetry(() => import("./pages/app/Home"));
const Dashboard = lazyWithRetry(() => import("./pages/app/Dashboard"));
const Protocol = lazyWithRetry(() => import("./pages/app/Protocol"));
const CognitiveReport = lazyWithRetry(() => import("./pages/app/CognitiveReport"));
const ReportPreview = lazyWithRetry(() => import("./pages/app/ReportPreview"));
const Premium = lazyWithRetry(() => import("./pages/app/Premium"));
const ProfilePage = lazyWithRetry(() => import("./pages/app/ProfilePage"));
const SettingsPage = lazyWithRetry(() => import("./pages/app/SettingsPage"));
const SubscriptionPage = lazyWithRetry(() => import("./pages/app/SubscriptionPage"));
const PaywallPage = lazyWithRetry(() => import("./pages/app/PaywallPage"));
const PremiumOnboarding = lazyWithRetry(() => import("./pages/app/PremiumOnboarding"));
const TrainingsList = lazyWithRetry(() => import("./pages/app/TrainingsList"));
const TrainingRunner = lazyWithRetry(() => import("./pages/app/TrainingRunner"));
const DynamicTrainingRunner = lazyWithRetry(() => import("./pages/app/DynamicTrainingRunner"));
const InstallPage = lazyWithRetry(() => import("./pages/app/Install"));
const NeuroLab = lazyWithRetry(() => import("./pages/app/NeuroLab"));
const Wearable = lazyWithRetry(() => import("./pages/app/Wearable"));
const NeuroLabArea = lazyWithRetry(() => import("./pages/app/NeuroLabArea"));
const NeuroLabSessionRunner = lazyWithRetry(() => import("./pages/app/NeuroLabSessionRunner"));
const OrbitLockRunner = lazyWithRetry(() => import("./pages/app/OrbitLockRunner"));
const FocusSwitchRunner = lazyWithRetry(() => import("./pages/app/FocusSwitchRunner"));
const ConstellationSnapRunner = lazyWithRetry(() => import("./pages/app/ConstellationSnapRunner"));
const SemanticDriftRunner = lazyWithRetry(() => import("./pages/app/SemanticDriftRunner"));
const CausalLedgerRunner = lazyWithRetry(() => import("./pages/app/CausalLedgerRunner"));
const CounterfactualAuditRunner = lazyWithRetry(() => import("./pages/app/CounterfactualAuditRunner"));
const SocraticCrossExamRunner = lazyWithRetry(() => import("./pages/app/SocraticCrossExamRunner"));
const SignalVsNoiseRunner = lazyWithRetry(() => import("./pages/app/SignalVsNoiseRunner"));
const HiddenRuleLabRunner = lazyWithRetry(() => import("./pages/app/HiddenRuleLabRunner"));
const NeuralResetRunner = lazyWithRetry(() => import("./pages/app/NeuralResetRunner"));
const RechargingRunner = lazyWithRetry(() => import("./pages/app/RechargingRunner"));
const DetoxSessionRunner = lazyWithRetry(() => import("./pages/app/DetoxSessionRunner"));
const DailySession = lazyWithRetry(() => import("./pages/app/DailySession"));
const QuickBaselineCalibration = lazyWithRetry(() => import("./pages/app/QuickBaselineCalibration"));
const ReasoningQualityImpact = lazyWithRetry(() => import("./pages/app/ReasoningQualityImpact"));
const RecoveryBreakdown = lazyWithRetry(() => import("./pages/app/RecoveryBreakdown"));
const AdaptiveCoach = lazyWithRetry(() => import("./pages/app/AdaptiveCoach"));
const AdminDashboard = lazyWithRetry(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazyWithRetry(() => import("./pages/admin/AdminUsers"));
const AdminUserDetail = lazyWithRetry(() => import("./pages/admin/AdminUserDetail"));
const AdminSubscriptions = lazyWithRetry(() => import("./pages/admin/AdminSubscriptions"));
const NotFound = lazyWithRetry(() => import("./pages/NotFound"));
const DeferredSyncServices = lazyWithRetry(() => import("./components/app/DeferredSyncServices"));

// Component that handles auto-seeding and notification initialization (outside Router)
function AppInitProvider({ children }: { children: React.ReactNode }) {
  const [syncServicesReady, setSyncServicesReady] = useState(false);

  useEffect(() => {
    // Native Health and device sync are important, but they should start only
    // after the visible route and its navigation targets are ready.
    const timeoutId = window.setTimeout(() => setSyncServicesReady(true), 2_200);
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(preloadPrimaryRoutes, 500);
    return () => window.clearTimeout(timeoutId);
  }, []);

  return (
    <>
      {children}
      {syncServicesReady && (
        <Suspense fallback={null}>
          <DeferredSyncServices />
        </Suspense>
      )}
    </>
  );
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

function EntryRedirect() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  return <Navigate to={user.onboardingCompleted ? "/app" : "/onboarding"} replace />;
}

function RouteFallback() {
  return (
    <div className="min-h-[100dvh] bg-background flex items-center justify-center">
      <div className="h-6 w-6 rounded-full border border-foreground/20 border-t-foreground/80 animate-spin" />
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<EntryRedirect />} />
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
        path="/app/coach"
        element={
          <ProtectedRoute>
            <Coach />
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
        path="/app/adaptive-coach"
        element={
          <ProtectedRoute>
            <AdaptiveCoach />
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
        path="/app/onboarding-premium"
        element={
          <ProtectedRoute>
            <PremiumOnboarding />
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
        path="/app/wearable"
        element={
          <ProtectedRoute>
            <Wearable />
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
      <Route
        path="/app/recovery-breakdown"
        element={
          <ProtectedRoute>
            <RecoveryBreakdown />
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
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SubscriptionProvider>
          <NativeSecurityProvider>
            <SessionProvider>
              <AppInitProvider>
                  <TooltipProvider>
                    <Toaster />
                    <Sonner />
                    <HashRouter>
                      <ScrollToTop />
                      <DeepLinkHandler>
                        <Suspense fallback={<RouteFallback />}>
                          <AppRoutes />
                        </Suspense>
                      </DeepLinkHandler>
                    </HashRouter>
                  </TooltipProvider>
              </AppInitProvider>
            </SessionProvider>
          </NativeSecurityProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
