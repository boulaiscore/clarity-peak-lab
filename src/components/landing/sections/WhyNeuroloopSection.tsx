import { motion } from "framer-motion";

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

export function WhyNeuroloopSection() {
  return (
    <section id="why-neuroloop" className="py-24 scroll-mt-24">
      <div className="container px-6">
        <div className="max-w-3xl mx-auto">
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
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className="p-6 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors"
              >
                <h3 className="text-lg font-semibold text-white mb-2">{principle.title}</h3>
                <p className="text-white/50 leading-relaxed">{principle.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
