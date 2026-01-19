import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

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

export function ProtocolsSection() {
  return (
    <section id="protocols" className="py-24 scroll-mt-24">
      <div className="container px-6">
        <div className="max-w-4xl mx-auto">
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
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
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
        </div>
      </div>
    </section>
  );
}
