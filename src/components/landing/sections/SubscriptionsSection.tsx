import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    features: [
      "2 daily training sessions",
      "Basic System 1 & System 2 games",
      "Core dashboard metrics",
      "Progress tracking",
    ],
    cta: "Start Free",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$19.99",
    period: "/month",
    features: [
      "Unlimited sessions",
      "Full training library",
      "Advanced analytics",
      "Monthly cognitive report",
      "Priority support",
    ],
    cta: "Start 7-Day Trial",
    highlighted: true,
  },
  {
    name: "Elite",
    price: "$39.99",
    period: "/month",
    features: [
      "Everything in Pro",
      "On-demand performance reports",
      "Early access to new protocols",
      "1:1 onboarding call",
      "Private community access",
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
                className={`relative p-8 rounded-2xl ${
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

                <div className="mb-6">
                  <h3 className={`text-xl font-semibold mb-1 ${plan.highlighted ? "text-white" : "text-black"}`}>
                    {plan.name}
                  </h3>
                </div>

                <div className="mb-8">
                  <span className={`text-4xl font-bold tracking-tight ${plan.highlighted ? "text-white" : "text-black"}`}>
                    {plan.price}
                  </span>
                  <span className={plan.highlighted ? "text-white/70" : "text-black/50"}>
                    {" "}{plan.period}
                  </span>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm">
                      <Check className={`w-4 h-4 shrink-0 mt-0.5 ${plan.highlighted ? "text-white" : "text-black/60"}`} />
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
        </div>
      </div>
    </section>
  );
}