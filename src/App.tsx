import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SessionProvider } from "@/contexts/SessionContext";
import { useAutoSeedExercises } from "@/hooks/useAutoSeedExercises";
import { useNotificationInit } from "@/hooks/useNotificationInit";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Home from "./pages/app/Home";
import Dashboard from "./pages/app/Dashboard";
import Protocol from "./pages/app/Protocol";

import Premium from "./pages/app/Premium";
import Account from "./pages/app/Account";
import TrainingsList from "./pages/app/TrainingsList";
import TrainingRunner from "./pages/app/TrainingRunner";
import TrainingCategories from "./pages/app/TrainingCategories";
import DynamicTrainingRunner from "./pages/app/DynamicTrainingRunner";
import CognitiveAgeExplained from "./pages/CognitiveAgeExplained";
import InstallPage from "./pages/app/Install";
import NeuroLab from "./pages/app/NeuroLab";
import NeuroLabArea from "./pages/app/NeuroLabArea";
import NeuroLabSessionRunner from "./pages/app/NeuroLabSessionRunner";
import NeuroActivationRunner from "./pages/app/NeuroActivationRunner";
import DailySession from "./pages/app/DailySession";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Component that handles auto-seeding and notification initialization
function AppInitProvider({ children }: { children: React.ReactNode }) {
  useAutoSeedExercises();
  useNotificationInit();
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
      <Route path="/" element={<Index />} />
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
        path="/app/categories"
        element={
          <ProtectedRoute>
            <TrainingCategories />
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
        path="/app/account"
        element={
          <ProtectedRoute>
            <Account />
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
        path="/neuro-lab/neuro-activation"
        element={
          <ProtectedRoute>
            <NeuroActivationRunner />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cognitive-age"
        element={
          <ProtectedRoute>
            <CognitiveAgeExplained />
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
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SessionProvider>
        <AppInitProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </TooltipProvider>
        </AppInitProvider>
      </SessionProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
