import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-radial from-primary/8 via-transparent to-transparent" />
      <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] bg-primary/15 rounded-full blur-[150px] animate-pulse-slow" />
      <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: "2s" }} />
      
      {/* Subtle grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:80px_80px]" />

      <div className="container relative z-10 px-6 py-24">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/8 border border-primary/15 mb-10 animate-fade-in">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-medium text-primary/90 tracking-wide">Cognitive Fitness System</span>
          </div>

          {/* Main headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight mb-8 animate-fade-in leading-[1.1]" style={{ animationDelay: "0.1s" }}>
            Train Your Mind for
            <br />
            <span className="text-gradient">Elite Reasoning</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 animate-fade-in leading-relaxed" style={{ animationDelay: "0.2s" }}>
            Your thinking is your competitive edge. NeuroLoop Pro builds cognitive longevity and higher-order cognition for better decisions.
          </p>

          {/* CTAs - Mobile optimized */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in px-4 sm:px-0" style={{ animationDelay: "0.3s" }}>
            <Button asChild variant="hero" size="xl" className="w-full sm:w-auto min-h-[56px]">
              <Link to="/auth">
                Start Training
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button asChild variant="hero-outline" size="xl" className="w-full sm:w-auto min-h-[56px]">
              <a href="#how-it-works">
                How It Works
              </a>
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="mt-20 flex flex-col sm:flex-row flex-wrap justify-center gap-6 sm:gap-10 text-muted-foreground text-sm animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <div className="flex items-center justify-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
              <span>Science-based protocols</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
              <span>No tracking or wearables</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
              <span>30 seconds to 5 minutes</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
