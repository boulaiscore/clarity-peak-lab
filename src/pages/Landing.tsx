import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoomaLogo } from "@/components/ui/LoomaLogo";
import { trackProductEvent } from "@/lib/productAnalytics";

const outcomes = [
  {
    title: "Measure your state",
    copy: "A brief check compares today's performance with your own baseline — not with a demographic norm.",
  },
  {
    title: "Choose the right work",
    copy: "Turn attention, reasoning and recovery signals into one practical recommendation for your day.",
  },
  {
    title: "Learn what works",
    copy: "Build a personal record of the habits and resets associated with your strongest work sessions.",
  },
];

export default function Landing() {
  useEffect(() => {
    trackProductEvent("landing_viewed");
  }, []);

  const trackCta = (placement: string) => {
    trackProductEvent("baseline_cta_clicked", { placement });
  };

  return (
    <div className="min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-1/2 top-[-18rem] h-[42rem] w-[42rem] -translate-x-1/2 rounded-full bg-primary/20 blur-[150px]" />
        <div className="absolute bottom-[-18rem] right-[-10rem] h-[36rem] w-[36rem] rounded-full bg-recovery/10 blur-[130px]" />
      </div>

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Link to="/" className="flex items-center gap-2.5" aria-label="LOOMA home">
          <LoomaLogo size={30} className="text-foreground" />
          <span className="text-sm font-semibold tracking-[0.18em]">LOOMA</span>
        </Link>
        <Button asChild variant="ghost" size="sm">
          <Link to="/auth?mode=login">Sign in</Link>
        </Button>
      </header>

      <main className="relative z-10">
        <section className="mx-auto grid min-h-[calc(100vh-76px)] max-w-6xl items-center gap-14 px-5 pb-20 pt-10 sm:px-8 lg:grid-cols-[1.12fr_0.88fr] lg:py-20">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/50 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-recovery" />
              Cognitive readiness for high-impact work
            </div>
            <h1 className="text-balance text-5xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
              Know when your mind is ready for the work that matters.
            </h1>
            <p className="mt-7 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              A brief daily check combines cognitive performance and recovery signals to help you decide when to focus, analyze or reset.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button asChild variant="hero" size="xl" className="group">
                <Link to="/auth?mode=signup&intent=baseline" onClick={() => trackCta("hero")}>
                  Start my 7-day baseline
                  <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
              <span className="text-xs text-muted-foreground">First check in about 2 minutes · No wearable required</span>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-recovery" />Personal baseline</span>
              <span className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-recovery" />Actionable daily signal</span>
              <span className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-recovery" />Non-clinical self-monitoring</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-8 rounded-[3rem] bg-primary/10 blur-3xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-card/80 p-5 shadow-2xl backdrop-blur-xl sm:p-7">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Today’s signal</p>
                  <p className="mt-1 text-sm font-medium">Ready for focused analysis</p>
                </div>
                <span className="rounded-full border border-recovery/30 bg-recovery/10 px-2.5 py-1 text-[10px] font-medium text-recovery">Moderate confidence</span>
              </div>

              <div className="my-8 flex items-center justify-center">
                <div className="relative flex h-48 w-48 items-center justify-center rounded-full border-[12px] border-primary/15">
                  <div className="absolute inset-[-12px] rounded-full border-[12px] border-transparent border-r-primary border-t-primary rotate-[-32deg]" />
                  <div className="text-center">
                    <p className="text-5xl font-medium tracking-[-0.06em]">74</p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Readiness signal</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border/40 bg-background/40 p-4">
                <p className="text-xs font-medium">Best next move</p>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  Protect a 45-minute block for analytical work. Re-check after lunch before making a high-impact decision.
                </p>
              </div>
              <p className="mt-4 text-center text-[10px] leading-relaxed text-muted-foreground/60">
                Illustrative result. LOOMA supports self-monitoring and does not diagnose or predict decision outcomes.
              </p>
            </div>
          </div>
        </section>

        <section className="border-y border-border/40 bg-card/20">
          <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
            <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">One useful loop, repeated daily</p>
            <h2 className="mx-auto mt-4 max-w-2xl text-center text-3xl font-semibold tracking-tight sm:text-4xl">
              Measure. Choose. Learn.
            </h2>
            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {outcomes.map(({ title, copy }, index) => (
                <article key={title} className="rounded-2xl border border-border/50 bg-card/60 p-6">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">0{index + 1}</p>
                  <h3 className="mt-2 text-lg font-semibold">{title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-5 py-24 text-center sm:px-8">
          <div className="mx-auto h-px w-12 bg-recovery/70" />
          <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-recovery">Seven-day calibration</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Build your baseline before trusting the signal.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            LOOMA starts with seven days of personal observations. Early results are labeled provisional, and recommendations become more specific only as your history grows.
          </p>
          <Button asChild variant="hero" size="xl" className="mt-8">
            <Link to="/auth?mode=signup&intent=baseline" onClick={() => trackCta("closing")}>
              Start my baseline <ArrowRight />
            </Link>
          </Button>
        </section>
      </main>

      <footer className="relative z-10 border-t border-border/40 px-5 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} LOOMA · Cognitive performance self-monitoring, not a medical device.
      </footer>
    </div>
  );
}
