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
    description: "Get started with core training",
    features: [
      "2 daily sessions",
      "Basic S1 & S2 drills",
      "Progress tracking",
      "Community access",
    ],
    cta: "Start Free",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$11.99",
    period: "/month",
    description: "Complete cognitive system",
    features: [
      "Unlimited sessions",
      "Full protocol library",
      "Advanced analytics",
      "Monthly cognitive report",
      "Priority support",
    ],
    cta: "Start 7-Day Trial",
    highlighted: true,
  },
  {
    name: "Elite",
    price: "$16.99",
    period: "/month",
    description: "Maximum performance",
    features: [
      "Everything in Pro",
      "On-demand reports",
      "Early access features",
      "1:1 onboarding call",
      "Private community",
    ],
    cta: "Start 7-Day Trial",
    highlighted: false,
  },
];

export function Pricing() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="bg-black py-24 lg:py-32 relative" ref={ref}>
      <div className="container px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/40 font-medium mb-4">
            MEMBERSHIP
          </p>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-6">
            Choose Your Level
          </h2>
          <p className="text-lg text-white/60 max-w-xl mx-auto">
            Start free, upgrade when you're ready for more.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {tiers.map((tier, index) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              className={`relative p-8 rounded-2xl ${
                tier.highlighted 
                  ? "bg-white text-black" 
                  : "bg-white/[0.02] border border-white/10"
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 rounded-full bg-black text-white text-xs font-medium">
                    POPULAR
                  </span>
                </div>
              )}

              <div className="mb-8">
                <h3 className={`text-xl font-semibold mb-1 ${tier.highlighted ? "text-black" : "text-white"}`}>
                  {tier.name}
                </h3>
                <p className={`text-sm ${tier.highlighted ? "text-black/60" : "text-white/50"}`}>
                  {tier.description}
                </p>
              </div>

              <div className="mb-8">
                <span className={`text-4xl font-bold tracking-tight ${tier.highlighted ? "text-black" : "text-white"}`}>
                  {tier.price}
                </span>
                <span className={`${tier.highlighted ? "text-black/60" : "text-white/50"}`}>
                  {tier.period}
                </span>
              </div>

              <ul className="space-y-3 mb-8">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <Check className={`w-4 h-4 shrink-0 mt-0.5 ${tier.highlighted ? "text-black" : "text-white/60"}`} />
                    <span className={tier.highlighted ? "text-black/80" : "text-white/70"}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Button 
                asChild 
                className={`w-full rounded-full h-12 font-semibold ${
                  tier.highlighted 
                    ? "bg-black text-white hover:bg-black/90" 
                    : "bg-white text-black hover:bg-white/90"
                }`}
              >
                <Link to="/auth">{tier.cta}</Link>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
