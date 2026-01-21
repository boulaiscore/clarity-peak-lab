import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

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

export function SubscriptionsSection() {
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

          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative p-8 rounded-2xl flex flex-col ${
                  plan.highlighted
                    ? "bg-primary text-white"
                    : "bg-black/[0.02] border border-black/10"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 rounded-full bg-white text-primary text-xs font-medium">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                {/* Plan name */}
                <h3 className={`text-xl font-semibold mb-3 ${plan.highlighted ? "text-white" : "text-black"}`}>
                  {plan.name}
                </h3>

                {/* Summary sentence */}
                <p className={`text-sm mb-6 leading-relaxed ${plan.highlighted ? "text-white/80" : "text-black/60"}`}>
                  {plan.summary}
                </p>

                {/* Pricing */}
                <div className="mb-2">
                  <span className={`text-3xl font-bold tracking-tight ${plan.highlighted ? "text-white" : "text-black"}`}>
                    {plan.price}
                  </span>
                  <span className={`text-sm ${plan.highlighted ? "text-white/70" : "text-black/50"}`}>
                    {plan.period}
                  </span>
                </div>

                {/* Annual pricing */}
                {plan.annualPrice && (
                  <p className={`text-sm mb-6 ${plan.highlighted ? "text-white/70" : "text-black/50"}`}>
                    or <span className="font-medium">{plan.annualPrice}/year</span>{" "}
                    <span className="text-xs">({plan.annualNote})</span>
                  </p>
                )}
                {!plan.annualPrice && <div className="mb-6" />}

                {/* Compact feature list */}
                <ul className="space-y-2 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className={`w-4 h-4 shrink-0 ${plan.highlighted ? "text-white/80" : "text-primary"}`} />
                      <span className={plan.highlighted ? "text-white/90" : "text-black/70"}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  className={`w-full rounded-full h-12 font-semibold ${
                    plan.highlighted
                      ? "bg-white text-primary hover:bg-white/90"
                      : "bg-primary text-white hover:bg-primary/90"
                  }`}
                >
                  <Link to="/auth">{plan.cta}</Link>
                </Button>
              </motion.div>
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
