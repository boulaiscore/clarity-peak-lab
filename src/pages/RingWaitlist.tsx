import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import neuroloopRingSensors from "@/assets/neuroloop-ring-sensors.png";

export default function RingWaitlist() {
  const [email, setEmail] = useState("");
  const [workType, setWorkType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    
    // For now, just show success - can add database storage later
    setTimeout(() => {
      setSubmitted(true);
      setIsSubmitting(false);
      toast.success("Request received");
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#fafafa]">
      {/* Back Button */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-[#222]">
        <div className="max-w-2xl mx-auto px-6">
          <div className="flex items-center h-14">
            <Link 
              to="/app" 
              className="flex items-center gap-2 text-[#888] hover:text-[#fafafa] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to app</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-6 py-16 md:py-24">
        
        {/* Hero Section */}
        <section className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl md:text-5xl font-light tracking-tight mb-4">
              NeuroLoop Ring
            </h1>
            <p className="text-lg md:text-xl text-[#888] font-light mb-8">
              Cognitive readiness, reduced to an object.
            </p>
          </motion.div>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-base text-[#777] max-w-lg mx-auto mb-6 leading-relaxed"
          >
            An experimental smart ring designed to observe physiological states that influence reasoning, focus, and recovery.
          </motion.p>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-xs text-[#555] tracking-wide uppercase"
          >
            Limited experimental batch · Not a medical device
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="mt-10"
          >
            <Button 
              variant="outline"
              className="border-[#444] text-[#fafafa] hover:bg-[#fafafa] hover:text-[#0a0a0a] rounded-none px-8 py-6 text-sm tracking-wide transition-all duration-300"
              onClick={() => document.getElementById('waitlist-form')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Join the waiting list
            </Button>
          </motion.div>
        </section>

        {/* Ring Visual with Animation */}
        <section className="mb-20 flex justify-center items-center relative">
          {/* Glow effect */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-64 h-64 md:w-80 md:h-80 rounded-full bg-emerald-500/10 blur-3xl animate-pulse" />
          </div>
          
          {/* Ring with rotation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
            className="relative"
          >
            <motion.img 
              src={neuroloopRingSensors} 
              alt="NeuroLoop Ring - Smart ring with biometric sensors" 
              className="w-72 h-72 md:w-96 md:h-96 object-contain drop-shadow-2xl"
              animate={{ 
                rotateY: [0, 10, 0, -10, 0],
              }}
              transition={{ 
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              style={{ 
                filter: "drop-shadow(0 0 40px rgba(16, 185, 129, 0.2))"
              }}
            />
            
            {/* Sensor indicators */}
            <motion.div 
              className="absolute top-1/2 left-1/4 w-2 h-2 rounded-full bg-emerald-400"
              animate={{ 
                opacity: [0.4, 1, 0.4],
                scale: [1, 1.2, 1]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.div 
              className="absolute top-1/3 left-1/3 w-1.5 h-1.5 rounded-full bg-emerald-400"
              animate={{ 
                opacity: [0.4, 1, 0.4],
                scale: [1, 1.2, 1]
              }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
            />
            <motion.div 
              className="absolute top-2/3 left-1/3 w-1.5 h-1.5 rounded-full bg-emerald-400"
              animate={{ 
                opacity: [0.4, 1, 0.4],
                scale: [1, 1.2, 1]
              }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
            />
          </motion.div>
        </section>
        
        {/* Tech Specs Mini */}
        <motion.section 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="mb-16 grid grid-cols-3 gap-4 text-center"
        >
          <div className="p-4 rounded-lg bg-[#111] border border-[#222]">
            <p className="text-2xl font-light text-emerald-400 mb-1">7</p>
            <p className="text-xs text-[#666] uppercase tracking-wider">Sensors</p>
          </div>
          <div className="p-4 rounded-lg bg-[#111] border border-[#222]">
            <p className="text-2xl font-light text-emerald-400 mb-1">5g</p>
            <p className="text-xs text-[#666] uppercase tracking-wider">Weight</p>
          </div>
          <div className="p-4 rounded-lg bg-[#111] border border-[#222]">
            <p className="text-2xl font-light text-emerald-400 mb-1">7d</p>
            <p className="text-xs text-[#666] uppercase tracking-wider">Battery</p>
          </div>
        </motion.section>

        {/* Product Explanation */}
        <section className="mb-20 space-y-6 text-[#999] leading-relaxed">
          <p>
            NeuroLoop Ring is a matte, screenless smart ring. It has no display, no notifications, no vibrations. It is designed to be worn during work sessions and forgotten until you need its observations.
          </p>
          <p>
            The ring focuses on readiness, cognitive load, and recovery. It does not count steps. It does not score your sleep. It does not gamify your health.
          </p>
          <p>
            It does not read thoughts. It does not diagnose conditions. It does not optimize anything about your body.
          </p>
          <p>
            What it does is provide physiological context to NeuroLoop—helping you understand when deep reasoning is effective, and when it is not. When to push, and when to step back.
          </p>
        </section>

        {/* Why Experimental */}
        <section className="mb-20">
          <h2 className="text-lg font-light mb-6 text-[#fafafa]">
            Why an experimental batch
          </h2>
          <div className="space-y-4 text-[#999] leading-relaxed">
            <p>
              This is a small, controlled release. We are producing a limited number of rings to validate real-world use, refine the insights we generate, and work closely with early users who can provide meaningful feedback.
            </p>
            <p>
              This is not a mass product. It's a controlled experiment for people who take cognitive work seriously.
            </p>
          </div>
        </section>

        {/* What Users Get */}
        <section className="mb-20">
          <h2 className="text-lg font-light mb-6 text-[#fafafa]">
            What you receive
          </h2>
          <div className="space-y-4 text-[#999] leading-relaxed">
            <p>
              You receive the ring itself—matte black titanium, sized to your specification. You also gain access to NeuroLoop features designed specifically for the ring, integrating physiological data with your cognitive training. As we refine the system, you will have early access to updates before anyone else.
            </p>
          </div>
        </section>

        {/* Waiting List Form */}
        <section id="waitlist-form" className="mb-20 pt-8">
          <div className="border-t border-[#222] pt-12">
            {submitted ? (
              <div className="text-center py-8">
                <p className="text-[#fafafa] mb-2">Request received.</p>
                <p className="text-sm text-[#666]">
                  You'll be notified only if selected for the experimental batch.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto">
                <div>
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-[#111] border-[#333] rounded-none h-12 text-[#fafafa] placeholder:text-[#666] focus:border-emerald-500 focus:ring-0"
                  />
                </div>
                <div>
                  <Input
                    type="text"
                    placeholder="What kind of work do you do? (optional)"
                    value={workType}
                    onChange={(e) => setWorkType(e.target.value)}
                    className="bg-[#111] border-[#333] rounded-none h-12 text-[#fafafa] placeholder:text-[#666] focus:border-emerald-500 focus:ring-0"
                  />
                </div>
                <Button 
                  type="submit"
                  disabled={isSubmitting || !email}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-none h-12 text-sm tracking-wide transition-colors duration-300"
                >
                  {isSubmitting ? "Submitting..." : "Request access"}
                </Button>
                <p className="text-xs text-[#555] text-center">
                  You'll be notified only if selected for the experimental batch.
                </p>
              </form>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#222] py-8">
        <p className="text-center text-xs text-[#555] tracking-wide">
          NeuroLoop — Cognitive systems, applied.
        </p>
      </footer>
    </div>
  );
}
