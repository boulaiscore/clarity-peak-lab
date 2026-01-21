import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

const tiers = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    subtitle: "Baseline access to cognitive training",
    features: [
      "Up to 2 training sessions per day",
      "Limited System 1 & System 2 games",
      "Core dashboard metrics",
      "Basic progress tracking",
      "Baseline cognitive calibration",
    ],
    cta: "Start Free",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$19.99",
    period: "/month",
    subtitle: "Train your cognitive performance",
    features: [
      "Unlimited training sessions",
      "Full System 1 & System 2 training library",
      "Cognitive Load & Capacity tracking",
      "Advanced performance analytics",
      "Monthly cognitive performance report",
      "Personalized training recommendations",
      "Priority support",
    ],
    cta: "Start 7-Day Trial",
    highlighted: true,
  },
  {
    name: "Elite",
    price: "$29.99",
    period: "/month",
    subtitle: "Master how you think under pressure",
    features: [
      "Everything in Pro",
      "Expanded System 2 access (Critical Thinking & Insight)",
      "Reduced S2 gating + higher cognitive load ceilings",
      "Advanced Reasoning Quality insights",
      "On-demand performance & reasoning reports",
      "Early access to new training protocols",
      "Weekly cognitive brief (elite-only)",
    ],
    cta: "Start 7-Day Trial",
    highlighted: false,
  },
];

export function Pricing() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="bg-white py-24 lg:py-32 relative" ref={ref}>
      <div className="container px-6 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-light text-black tracking-tight mb-6">
            Choose Your Level
          </h2>
          <p className="text-lg text-black/50 max-w-xl mx-auto">
            Start free. Upgrade when you're ready to go deeper.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {tiers.map((tier, index) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              className={`relative p-8 rounded-2xl ${
                tier.highlighted
                  ? "bg-primary text-white"
                  : "bg-black/[0.02] border border-black/10"
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 rounded-full bg-white text-primary text-xs font-medium tracking-wide">
                    MOST POPULAR
                  </span>
                </div>
              )}

              <div className="mb-4">
                <h3 className={`text-xl font-semibold mb-2 ${tier.highlighted ? "text-white" : "text-black"}`}>
                  {tier.name}
                </h3>
                <p className={`text-sm ${tier.highlighted ? "text-white/70" : "text-black/50"}`}>
                  {tier.subtitle}
                </p>
              </div>

              <div className="mb-6">
                <span className={`text-4xl font-bold tracking-tight ${tier.highlighted ? "text-white" : "text-black"}`}>
                  {tier.price}
                </span>
                <span className={`text-base ${tier.highlighted ? "text-white/70" : "text-black/50"}`}>
                  {" "}{tier.period}
                </span>
              </div>

              <ul className="space-y-3 mb-8">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <Check className={`w-4 h-4 shrink-0 mt-0.5 ${tier.highlighted ? "text-white" : "text-primary"}`} />
                    <span className={tier.highlighted ? "text-white/90" : "text-black/70"}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                asChild
                className={`w-full rounded-full h-12 font-semibold ${
                  tier.highlighted
                    ? "bg-white text-primary hover:bg-white/90"
                    : "bg-primary text-white hover:bg-primary/90"
                }`}
              >
                <Link to="/auth">{tier.cta}</Link>
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Global note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center text-sm text-black/40 mt-12 max-w-2xl mx-auto italic"
        >
          XP measures training volume, not intelligence. NeuroLoop adapts difficulty, load, and insight depth to your cognitive profile.
        </motion.p>
      </div>
    </section>
  );
}