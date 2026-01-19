import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Check, Apple } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const DownloadPage = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("waitlist_signups")
        .insert({ email, source: "download_page" });

      if (error) {
        if (error.code === "23505") {
          toast.info("You're already on the waitlist!");
          setIsSubmitted(true);
        } else {
          throw error;
        }
      } else {
        setIsSubmitted(true);
        toast.success("You're on the list! We'll notify you when we launch.");
      }
    } catch (error) {
      console.error("Waitlist signup error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="container px-6">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back</span>
            </Link>
            <span className="text-white font-bold text-lg tracking-tight">NEUROLOOP</span>
            <div className="w-16" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-lg mx-auto text-center">
          {/* Coming Soon Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <div className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center">
                <Apple className="w-7 h-7 text-black" />
              </div>
              <div className="text-left">
                <p className="text-xs text-white/40 uppercase tracking-wider">Coming Soon</p>
                <p className="text-white font-semibold">App Store</p>
              </div>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold tracking-tight mb-4"
          >
            Get early access
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-white/60 mb-10 max-w-md mx-auto"
          >
            Be the first to know when NeuroLoop launches on iOS. Join the waitlist for exclusive early access.
          </motion.p>

          {/* Email Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {isSubmitted ? (
              <div className="flex items-center justify-center gap-3 p-6 rounded-2xl bg-primary/10 border border-primary/20">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Check className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-white">You're on the list!</p>
                  <p className="text-sm text-white/60">We'll email you when we launch.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 h-14 bg-white/5 border-white/10 text-white placeholder:text-white/40 text-base rounded-xl"
                    required
                  />
                  <Button
                    type="submit"
                    variant="premium"
                    size="lg"
                    disabled={isSubmitting}
                    className="h-14 px-8 rounded-xl"
                  >
                    {isSubmitting ? "Joining..." : "Join Waitlist"}
                  </Button>
                </div>
                <p className="text-xs text-white/40">
                  No spam, ever. We'll only email you when we launch.
                </p>
              </form>
            )}
          </motion.div>

          {/* Features Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            {[
              { title: "Daily Training", desc: "5-10 min cognitive exercises" },
              { title: "Progress Tracking", desc: "Watch your mind sharpen" },
              { title: "Personalized", desc: "Adapts to your performance" },
            ].map((feature, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-white/5 border border-white/5"
              >
                <p className="font-medium text-white mb-1">{feature.title}</p>
                <p className="text-sm text-white/50">{feature.desc}</p>
              </div>
            ))}
          </motion.div>

          {/* Alternative CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-12 pt-8 border-t border-white/10"
          >
            <p className="text-white/40 text-sm mb-4">
              Want to try the web version now?
            </p>
            <Link to="/auth">
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                Start Training Online
              </Button>
            </Link>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default DownloadPage;
