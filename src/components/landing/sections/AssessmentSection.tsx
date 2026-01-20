import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function AssessmentSection() {
  return (
    <section id="assessment" className="py-24 scroll-mt-24 bg-white">
      <div className="container px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-light text-black tracking-tight mb-6">
              Your Cognitive Baseline
            </h2>
            <p className="text-lg text-black/50 max-w-xl mx-auto">
              Understand how you think before trying to improve it.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="p-8 rounded-2xl bg-black/[0.02] border border-black/5"
            >
              <h3 className="text-xl font-semibold text-black mb-6">Initial Assessment</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-black/60">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  Short guided onboarding session
                </li>
                <li className="flex items-start gap-3 text-black/60">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  Mix of System 1 and System 2 tasks
                </li>
                <li className="flex items-start gap-3 text-black/60">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  No prior training required
                </li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="p-8 rounded-2xl bg-black/[0.02] border border-black/5"
            >
              <h3 className="text-xl font-semibold text-black mb-6">What You Get</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-black/60">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  Baseline for speed, accuracy, and consistency
                </li>
                <li className="flex items-start gap-3 text-black/60">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  Initial cognitive profile
                </li>
                <li className="flex items-start gap-3 text-black/60">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  Personalized training focus
                </li>
              </ul>
            </motion.div>
          </div>

          <p className="text-center text-sm text-black/30 mb-8">
            This is not an IQ test. There are no scores to pass or fail — only patterns to understand.
          </p>

          <div className="text-center">
            <Button asChild className="rounded-full bg-primary text-white hover:bg-primary/90 font-semibold px-8 h-12">
              <Link to="/auth">Start Assessment →</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}