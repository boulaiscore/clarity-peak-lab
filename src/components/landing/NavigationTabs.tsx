import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Brain, Zap, Target, Clock, BarChart3, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const tabs = [
  { id: "subscriptions", label: "SUBSCRIPTIONS" },
  { id: "how-it-works", label: "HOW IT WORKS" },
  { id: "assessment", label: "ASSESSMENT" },
  { id: "why-neuroloop", label: "WHY NEUROLOOP" },
  { id: "protocols", label: "PROTOCOLS" },
];

interface NavigationTabsProps {
  activeTab: string | null;
  onTabChange: (tab: string | null) => void;
}

export function NavigationTabs({ activeTab, onTabChange }: NavigationTabsProps) {
  return (
    <>
      {/* Tab Buttons */}
      <div className="hidden lg:flex items-center gap-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(activeTab === tab.id ? null : tab.id)}
            className={`text-[11px] uppercase tracking-[0.15em] font-medium transition-colors ${
              activeTab === tab.id ? "text-white" : "text-white/50 hover:text-white/80"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Panels */}
      <AnimatePresence>
        {activeTab && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-black/95 backdrop-blur-xl overflow-y-auto"
          >
            <div className="container px-6 py-24">
              <button
                onClick={() => onTabChange(null)}
                className="fixed top-6 right-6 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors z-50"
              >
                <X className="w-5 h-5" />
              </button>

              {activeTab === "subscriptions" && <SubscriptionsContent />}
              {activeTab === "how-it-works" && <HowItWorksContent />}
              {activeTab === "assessment" && <AssessmentContent />}
              {activeTab === "why-neuroloop" && <WhyNeuroloopContent />}
              {activeTab === "protocols" && <ProtocolsContent />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function SubscriptionsContent() {
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
      price: "$11.99",
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
      price: "$16.99",
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="max-w-5xl mx-auto"
    >
      <div className="text-center mb-16">
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-6">
          Choose Your Level
        </h2>
        <p className="text-lg text-white/50 max-w-xl mx-auto">
          Start free. Upgrade when you're ready to go deeper.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan, index) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
            className={`relative p-8 rounded-2xl ${
              plan.highlighted
                ? "bg-white text-black"
                : "bg-white/[0.02] border border-white/10"
            }`}
          >
            {plan.highlighted && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="px-4 py-1 rounded-full bg-black text-white text-xs font-medium">
                  MOST POPULAR
                </span>
              </div>
            )}

            <div className="mb-6">
              <h3 className={`text-xl font-semibold mb-1 ${plan.highlighted ? "text-black" : "text-white"}`}>
                {plan.name}
              </h3>
            </div>

            <div className="mb-8">
              <span className={`text-4xl font-bold tracking-tight ${plan.highlighted ? "text-black" : "text-white"}`}>
                {plan.price}
              </span>
              <span className={plan.highlighted ? "text-black/60" : "text-white/50"}>
                {" "}{plan.period}
              </span>
            </div>

            <ul className="space-y-3 mb-8">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm">
                  <Check className={`w-4 h-4 shrink-0 mt-0.5 ${plan.highlighted ? "text-black" : "text-white/60"}`} />
                  <span className={plan.highlighted ? "text-black/80" : "text-white/70"}>
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            <Button
              asChild
              className={`w-full rounded-full h-12 font-semibold ${
                plan.highlighted
                  ? "bg-black text-white hover:bg-black/90"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
            >
              <Link to="/auth">{plan.cta}</Link>
            </Button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function HowItWorksContent() {
  const steps = [
    {
      icon: Brain,
      number: "01",
      title: "Dual-Process Training",
      description: "Train both thinking systems: System 1 for speed and intuition. System 2 for reasoning and critical analysis.",
    },
    {
      icon: Clock,
      number: "02",
      title: "Short Daily Sessions",
      description: "5–10 minute tasks designed to create measurable cognitive load without burnout.",
    },
    {
      icon: Target,
      number: "03",
      title: "Signal Collection",
      description: "Every session captures response speed, accuracy, consistency, and decision patterns.",
    },
    {
      icon: BarChart3,
      number: "04",
      title: "Pattern Analysis",
      description: "Your data is aggregated into cognitive patterns displayed in your daily dashboard.",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="max-w-4xl mx-auto"
    >
      <div className="text-center mb-16">
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-6">
          How NeuroLoop Works
        </h2>
        <p className="text-lg text-white/50 max-w-2xl mx-auto">
          A structured system to train how you think — not just how fast.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-6 mb-12">
        {steps.map((step, index) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
            className="relative p-8 rounded-2xl bg-white/[0.02] border border-white/10"
          >
            <span className="absolute top-6 right-6 text-5xl font-bold text-white/5">
              {step.number}
            </span>
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-6">
              <step.icon className="w-6 h-6 text-white/80" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">{step.title}</h3>
            <p className="text-white/50 leading-relaxed">{step.description}</p>
          </motion.div>
        ))}
      </div>

      <p className="text-center text-sm text-white/30">
        NeuroLoop does not read brain signals. It trains cognitive behavior through structured decision tasks.
      </p>
    </motion.div>
  );
}

function AssessmentContent() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="max-w-3xl mx-auto"
    >
      <div className="text-center mb-16">
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-6">
          Your Cognitive Baseline
        </h2>
        <p className="text-lg text-white/50 max-w-xl mx-auto">
          Understand how you think before trying to improve it.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="p-8 rounded-2xl bg-white/[0.02] border border-white/10"
        >
          <h3 className="text-xl font-semibold text-white mb-6">Initial Assessment</h3>
          <ul className="space-y-4">
            <li className="flex items-start gap-3 text-white/60">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
              Short guided onboarding session
            </li>
            <li className="flex items-start gap-3 text-white/60">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
              Mix of System 1 and System 2 tasks
            </li>
            <li className="flex items-start gap-3 text-white/60">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
              No prior training required
            </li>
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="p-8 rounded-2xl bg-white/[0.02] border border-white/10"
        >
          <h3 className="text-xl font-semibold text-white mb-6">What You Get</h3>
          <ul className="space-y-4">
            <li className="flex items-start gap-3 text-white/60">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
              Baseline for speed, accuracy, and consistency
            </li>
            <li className="flex items-start gap-3 text-white/60">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
              Initial cognitive profile
            </li>
            <li className="flex items-start gap-3 text-white/60">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
              Personalized training focus
            </li>
          </ul>
        </motion.div>
      </div>

      <p className="text-center text-sm text-white/30 mb-8">
        This is not an IQ test. There are no scores to pass or fail — only patterns to understand.
      </p>

      <div className="text-center">
        <Button asChild className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-8 h-12">
          <Link to="/auth">Start Assessment →</Link>
        </Button>
      </div>
    </motion.div>
  );
}

function WhyNeuroloopContent() {
  const principles = [
    {
      title: "Not Brain Games",
      description: "NeuroLoop does not optimize points or streaks. It trains decision-making under cognitive constraints.",
    },
    {
      title: "Dual-Process by Design",
      description: "Most tools train either speed or focus. NeuroLoop trains intuition and reasoning as separate but connected systems.",
    },
    {
      title: "Patterns Over Scores",
      description: "We track how your performance evolves — not isolated results.",
    },
    {
      title: "Built for Professionals",
      description: "Designed for people who make decisions under pressure, not casual entertainment.",
    },
    {
      title: "Science-Informed",
      description: "Based on established cognitive science and decision theory.",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="max-w-3xl mx-auto"
    >
      <div className="text-center mb-16">
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-6">
          Why NeuroLoop
        </h2>
      </div>

      <div className="space-y-6">
        {principles.map((principle, index) => (
          <motion.div
            key={principle.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 + index * 0.08 }}
            className="p-6 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors"
          >
            <h3 className="text-lg font-semibold text-white mb-2">{principle.title}</h3>
            <p className="text-white/50 leading-relaxed">{principle.description}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function ProtocolsContent() {
  const protocols = [
    {
      title: "System 1 Protocols",
      items: ["Rapid association", "Pattern recognition", "Intuitive decision speed"],
    },
    {
      title: "System 2 Protocols",
      items: ["Critical reasoning", "Logical consistency", "Cognitive endurance"],
    },
    {
      title: "Mixed Protocols",
      items: ["Switching between fast and slow thinking", "Decision-making under time pressure"],
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="max-w-4xl mx-auto"
    >
      <div className="text-center mb-16">
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-6">
          Training Protocols
        </h2>
        <p className="text-lg text-white/50 max-w-xl mx-auto">
          Structured programs built around specific cognitive skills.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {protocols.map((protocol, index) => (
          <motion.div
            key={protocol.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
            className="p-8 rounded-2xl bg-white/[0.02] border border-white/10"
          >
            <h3 className="text-lg font-semibold text-white mb-6">{protocol.title}</h3>
            <ul className="space-y-3">
              {protocol.items.map((item) => (
                <li key={item} className="flex items-start gap-3 text-white/60 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>

      <p className="text-center text-sm text-white/30 mb-8">
        Protocols adapt over time based on your performance patterns.
      </p>

      <div className="text-center">
        <Button asChild className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-8 h-12">
          <Link to="/auth">Explore Protocols →</Link>
        </Button>
      </div>
    </motion.div>
  );
}
