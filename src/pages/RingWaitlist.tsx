import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
    <div className="min-h-screen bg-[#fafafa] text-[#1a1a1a]">
      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-6 py-24 md:py-32">
        
        {/* Hero Section */}
        <section className="text-center mb-20">
          <h1 className="text-3xl md:text-4xl font-light tracking-tight mb-4">
            NeuroLoop Ring
          </h1>
          <p className="text-lg md:text-xl text-[#666] font-light mb-8">
            Cognitive readiness, reduced to an object.
          </p>
          
          <p className="text-base text-[#555] max-w-lg mx-auto mb-6 leading-relaxed">
            An experimental smart ring designed to observe physiological states that influence reasoning, focus, and recovery.
          </p>
          
          <p className="text-xs text-[#999] tracking-wide uppercase">
            Limited experimental batch · Not a medical device
          </p>
          
          <div className="mt-10">
            <Button 
              variant="outline"
              className="border-[#1a1a1a] text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white rounded-none px-8 py-6 text-sm tracking-wide transition-colors duration-300"
              onClick={() => document.getElementById('waitlist-form')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Join the waiting list
            </Button>
          </div>
        </section>

        {/* Ring Visual */}
        <section className="mb-20 flex justify-center">
          <div className="w-48 h-48 md:w-64 md:h-64 rounded-full bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] shadow-2xl flex items-center justify-center">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-[#fafafa]" />
          </div>
        </section>

        {/* Product Explanation */}
        <section className="mb-20 space-y-6 text-[#444] leading-relaxed">
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
          <h2 className="text-lg font-light mb-6 text-[#1a1a1a]">
            Why an experimental batch
          </h2>
          <div className="space-y-4 text-[#444] leading-relaxed">
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
          <h2 className="text-lg font-light mb-6 text-[#1a1a1a]">
            What you receive
          </h2>
          <div className="space-y-4 text-[#444] leading-relaxed">
            <p>
              You receive the ring itself—matte black titanium, sized to your specification. You also gain access to NeuroLoop features designed specifically for the ring, integrating physiological data with your cognitive training. As we refine the system, you will have early access to updates before anyone else.
            </p>
          </div>
        </section>

        {/* Waiting List Form */}
        <section id="waitlist-form" className="mb-20 pt-8">
          <div className="border-t border-[#e0e0e0] pt-12">
            {submitted ? (
              <div className="text-center py-8">
                <p className="text-[#1a1a1a] mb-2">Request received.</p>
                <p className="text-sm text-[#888]">
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
                    className="bg-white border-[#ddd] rounded-none h-12 text-[#1a1a1a] placeholder:text-[#999] focus:border-[#1a1a1a] focus:ring-0"
                  />
                </div>
                <div>
                  <Input
                    type="text"
                    placeholder="What kind of work do you do? (optional)"
                    value={workType}
                    onChange={(e) => setWorkType(e.target.value)}
                    className="bg-white border-[#ddd] rounded-none h-12 text-[#1a1a1a] placeholder:text-[#999] focus:border-[#1a1a1a] focus:ring-0"
                  />
                </div>
                <Button 
                  type="submit"
                  disabled={isSubmitting || !email}
                  className="w-full bg-[#1a1a1a] hover:bg-[#333] text-white rounded-none h-12 text-sm tracking-wide transition-colors duration-300"
                >
                  {isSubmitting ? "Submitting..." : "Request access"}
                </Button>
                <p className="text-xs text-[#999] text-center">
                  You'll be notified only if selected for the experimental batch.
                </p>
              </form>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#e8e8e8] py-8">
        <p className="text-center text-xs text-[#999] tracking-wide">
          NeuroLoop — Cognitive systems, applied.
        </p>
      </footer>
    </div>
  );
}
