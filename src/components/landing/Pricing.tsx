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
    price: "$199",
    period: " / year",
    monthlyEquivalent: "≈ $16.60 / month • 2 months free",
    monthlyOption: "Monthly option: $19.90 / month",
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
    price: "$299",
    period: " / year",
    monthlyEquivalent: "≈ $24.90 / month • 2 months free",
    monthlyOption: "Monthly option: $29.90 / month",
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
              className={`relative p-8 rounded-2xl flex flex-col ${
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

              {/* Plan name */}
              <h3 className={`text-xl font-semibold mb-3 ${tier.highlighted ? "text-white" : "text-black"}`}>
                {tier.name}
              </h3>

              {/* Summary sentence */}
              <p className={`text-sm mb-6 leading-relaxed ${tier.highlighted ? "text-white/80" : "text-black/60"}`}>
                {tier.summary}
              </p>

              {/* Pricing */}
              <div className="mb-2">
                <span className={`text-3xl font-bold tracking-tight ${tier.highlighted ? "text-white" : "text-black"}`}>
                  {tier.price}
                </span>
                <span className={`text-sm ${tier.highlighted ? "text-white/70" : "text-black/50"}`}>
                  {tier.period}
                </span>
              </div>

              {/* Monthly equivalent & option */}
              {tier.monthlyEquivalent && (
                <p className={`text-xs mb-1 ${tier.highlighted ? "text-white/70" : "text-black/50"}`}>
                  {tier.monthlyEquivalent}
                </p>
              )}
              {tier.monthlyOption && (
                <p className={`text-xs mb-6 ${tier.highlighted ? "text-white/60" : "text-black/40"}`}>
                  {tier.monthlyOption}
                </p>
              )}
              {!tier.monthlyEquivalent && <div className="mb-6" />}

              {/* Compact feature list */}
              <ul className="space-y-2 mb-8 flex-1">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check className={`w-4 h-4 shrink-0 ${tier.highlighted ? "text-white/80" : "text-primary"}`} />
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
