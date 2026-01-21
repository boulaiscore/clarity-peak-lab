import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import useEmblaCarousel from "embla-carousel-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    summary: "Explore cognitive training at your own pace.",
    features: [
      "2 sessions/day",
      "Limited S1 & S2 games",
      "Core dashboard",
      "Baseline calibration",
    ],
    cta: "Start Free",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$19.90",
    period: "/month",
    annualPrice: "$199",
    annualNote: "2 months free",
    summary: "The complete cognitive training experience for high performers.",
    features: [
      "Unlimited sessions",
      "Full training library",
      "Load & Capacity tracking",
      "Monthly performance report",
      "Personalized recommendations",
    ],
    cta: "Start 7-Day Trial",
    highlighted: true,
  },
  {
    name: "Elite",
    price: "$29.90",
    period: "/month",
    annualPrice: "$299",
    annualNote: "2 months free",
    summary: "Deeper cognitive supervision and advanced reasoning insights.",
    features: [
      "Everything in Pro",
      "Expanded S2 access",
      "Reasoning Quality insights",
      "On-demand reports",
      "Weekly cognitive brief",
    ],
    cta: "Start 7-Day Trial",
    highlighted: false,
  },
];

function PlanCard({ plan, index }: { plan: typeof plans[0]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={`relative p-8 rounded-2xl flex flex-col h-full ${
        plan.highlighted
          ? "bg-gradient-to-b from-primary via-primary to-primary/80 text-white shadow-xl shadow-primary/20"
          : "bg-gradient-to-b from-zinc-100 via-zinc-200/80 to-zinc-300/60 border border-white/40 shadow-lg"
      }`}
      style={{
        backgroundImage: plan.highlighted
          ? undefined
          : "linear-gradient(to bottom, hsl(0 0% 95%), hsl(0 0% 88%), hsl(0 0% 82%))",
      }}
    >
      {/* Metallic shine overlay for non-highlighted */}
      {!plan.highlighted && (
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-transparent opacity-80" />
          <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/5 to-transparent" />
        </div>
      )}

      {/* Premium shine overlay for highlighted */}
      {plan.highlighted && (
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent" />
        </div>
      )}

      {plan.highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <span className="px-4 py-1 rounded-full bg-white text-primary text-xs font-medium shadow-md">
            MOST POPULAR
          </span>
        </div>
      )}

      {/* Plan name */}
      <h3 className={`text-xl font-semibold mb-3 relative z-10 ${plan.highlighted ? "text-white" : "text-zinc-900"}`}>
        {plan.name}
      </h3>

      {/* Summary sentence */}
      <p className={`text-sm mb-6 leading-relaxed relative z-10 ${plan.highlighted ? "text-white/80" : "text-zinc-600"}`}>
        {plan.summary}
      </p>

      {/* Pricing */}
      <div className="mb-2 relative z-10">
        <span className={`text-3xl font-bold tracking-tight ${plan.highlighted ? "text-white" : "text-zinc-900"}`}>
          {plan.price}
        </span>
        <span className={`text-sm ${plan.highlighted ? "text-white/70" : "text-zinc-500"}`}>
          {plan.period}
        </span>
      </div>

      {/* Annual pricing */}
      {plan.annualPrice && (
        <p className={`text-sm mb-6 relative z-10 ${plan.highlighted ? "text-white/70" : "text-zinc-500"}`}>
          or <span className="font-medium">{plan.annualPrice}/year</span>{" "}
          <span className="text-xs">({plan.annualNote})</span>
        </p>
      )}
      {!plan.annualPrice && <div className="mb-6" />}

      {/* Compact feature list */}
      <ul className="space-y-2 mb-8 flex-1 relative z-10">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-center gap-2 text-sm">
            <Check className={`w-4 h-4 shrink-0 ${plan.highlighted ? "text-white/80" : "text-primary"}`} />
            <span className={plan.highlighted ? "text-white/90" : "text-zinc-700"}>
              {feature}
            </span>
          </li>
        ))}
      </ul>

      <Button
        asChild
        className={`w-full rounded-full h-12 font-semibold relative z-10 ${
          plan.highlighted
            ? "bg-white text-primary hover:bg-white/90 shadow-md"
            : "bg-zinc-900 text-white hover:bg-zinc-800 shadow-md"
        }`}
      >
        <Link to="/auth">{plan.cta}</Link>
      </Button>
    </motion.div>
  );
}

export function SubscriptionsSection() {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: "center",
    slidesToScroll: 1,
    startIndex: 1, // Start on Pro (middle card)
  });
  const [selectedIndex, setSelectedIndex] = useState(1);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    
    const onSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    };
    
    emblaApi.on("select", onSelect);
    onSelect();
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi]);

  return (
    <section id="subscriptions" className="py-24 scroll-mt-24 bg-white">
      <div className="container px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-light text-black tracking-tight mb-6">
              Choose Your Level
            </h2>
            <p className="text-lg text-black/50 max-w-xl mx-auto">
              Start free. Upgrade when you're ready to go deeper.
            </p>
          </div>

          {/* Mobile: Horizontal carousel */}
          <div className="md:hidden relative">
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex -ml-4">
                {plans.map((plan, index) => (
                  <div 
                    key={plan.name} 
                    className="flex-[0_0_85%] min-w-0 pl-4"
                  >
                    <PlanCard plan={plan} index={index} />
                  </div>
                ))}
              </div>
            </div>

            {/* Dots */}
            <div className="flex justify-center gap-2 mt-6">
              {plans.map((_, index) => (
                <button
                  key={index}
                  onClick={() => emblaApi?.scrollTo(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    selectedIndex === index 
                      ? "bg-primary" 
                      : "bg-black/20 hover:bg-black/40"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Desktop: Grid layout */}
          <div className="hidden md:grid md:grid-cols-3 gap-6">
            {plans.map((plan, index) => (
              <PlanCard key={plan.name} plan={plan} index={index} />
            ))}
          </div>

          {/* Global note */}
          <p className="text-center text-sm text-black/40 mt-12 max-w-2xl mx-auto italic">
            XP measures training volume, not intelligence. NeuroLoop adapts difficulty, load, and insight depth to your cognitive profile.
          </p>
        </div>
      </div>
    </section>
  );
}
