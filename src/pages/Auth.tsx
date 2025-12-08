import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const { login, signup, user, isLoading: authLoading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !authLoading) {
      navigate("/app");
    }
  }, [user, authLoading, navigate]);

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      let result;
      if (isLogin) {
        result = await login(email, password);
      } else {
        result = await signup(name, email, password);
      }
      
      if (result.success) {
        // Check if user has completed onboarding
        const hasOnboarded = localStorage.getItem("neuroloop_onboarded");
        navigate(hasOnboarded ? "/app" : "/onboarding");
      } else {
        setError(result.error || "An error occurred");
      }
    } catch (err) {
      setError(isLogin ? "Invalid credentials" : "Could not create account");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-radial from-primary/8 via-transparent to-transparent" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[150px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[150px]" />

      {/* Header */}
      <header className="relative z-10 p-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      </header>

      {/* Form */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6 pb-16">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-10">
            <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center mx-auto mb-4">
              <span className="text-foreground font-semibold text-lg">N</span>
            </div>
            <h1 className="text-2xl font-semibold mb-2">
              {isLogin ? "Welcome back" : "Start training"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {isLogin
                ? "Sign in to continue your cognitive training"
                : "Create an account to begin"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="text-sm font-medium mb-2 block">Name</label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required={!isLogin}
                  className="h-12"
                />
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-2 block">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="h-12"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="h-12"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button type="submit" variant="hero" className="w-full min-h-[52px] rounded-xl" disabled={isLoading}>
              {isLoading ? "Loading..." : isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>

          {/* Tagline */}
          <div className="mt-12 text-center">
            <p className="text-xs text-muted-foreground">
              Train your mind for elite reasoning.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
