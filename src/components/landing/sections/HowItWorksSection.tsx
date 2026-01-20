import { motion } from "framer-motion";
import { Brain, Clock, Target, BarChart3 } from "lucide-react";

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

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 scroll-mt-24 bg-black/[0.02]">
      <div className="container px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-light text-black tracking-tight mb-6">
              How NeuroLoop Works
            </h2>
            <p className="text-lg text-black/50 max-w-2xl mx-auto">
              A structured system to train how you think — not just how fast.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 mb-12">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative p-8 rounded-2xl bg-white border border-black/5"
              >
                <span className="absolute top-6 right-6 text-5xl font-bold text-black/5">
                  {step.number}
                </span>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <step.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-black mb-3">{step.title}</h3>
                <p className="text-black/50 leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>

          <p className="text-center text-sm text-black/30">
            NeuroLoop does not read brain signals. It trains cognitive behavior through structured decision tasks.
          </p>
        </div>
      </div>
    </section>
  );
}