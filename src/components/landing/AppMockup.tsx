import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

export function AppMockup() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="bg-black py-24 lg:py-32 relative overflow-hidden" ref={ref}>
      {/* Subtle blue gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-primary/5 to-black" />
      
      <div className="container px-6 relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p className="text-[11px] uppercase tracking-[0.2em] text-primary font-medium mb-4">
            THE EXPERIENCE
          </p>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-6">
            Your Daily Dashboard
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Track cognitive metrics, access training protocols, and monitor your mental performance — all in one place.
          </p>
        </motion.div>

        {/* Phone Mockups */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative flex justify-center items-end gap-4 sm:gap-8"
        >
          {/* Left Phone - Smaller, tilted */}
          <motion.div
            initial={{ opacity: 0, x: -40, rotate: -5 }}
            animate={isInView ? { opacity: 1, x: 0, rotate: -5 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="hidden sm:block relative w-48 lg:w-64 -mb-12"
          >
            <div className="relative bg-black rounded-[2rem] p-2 shadow-2xl shadow-primary/10 border border-white/10">
              {/* Phone frame */}
              <div className="relative bg-gradient-to-b from-[#0a0a12] to-[#0f1018] rounded-[1.75rem] overflow-hidden aspect-[9/19]">
                {/* Status bar */}
                <div className="absolute top-0 left-0 right-0 h-8 bg-black/50 flex items-center justify-center">
                  <div className="w-20 h-5 bg-black rounded-b-xl" />
                </div>
                
                {/* Screen content - Games Library */}
                <div className="p-4 pt-10">
                  <div className="text-xs text-white/40 uppercase tracking-wider mb-2">Neuro Lab</div>
                  <div className="text-lg font-bold text-white mb-4">Games Library</div>
                  
                  {/* Game cards */}
                  <div className="space-y-2">
                    {[
                      { name: "Focus Switch", xp: "+25 XP", color: "bg-primary/20" },
                      { name: "Semantic Drift", xp: "+30 XP", color: "bg-primary/15" },
                      { name: "Orbit Lock", xp: "+20 XP", color: "bg-primary/10" },
                    ].map((game, i) => (
                      <div key={i} className={`${game.color} rounded-xl p-3 border border-white/5`}>
                        <div className="text-xs font-medium text-white">{game.name}</div>
                        <div className="text-[10px] text-primary">{game.xp}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Center Phone - Main, larger */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative w-64 sm:w-72 lg:w-80 z-10"
          >
            <div className="relative bg-black rounded-[2.5rem] p-2 shadow-2xl shadow-primary/20 border border-white/10">
              {/* Phone frame */}
              <div className="relative bg-gradient-to-b from-[#0a0a12] to-[#0f1018] rounded-[2.25rem] overflow-hidden aspect-[9/19]">
                {/* Status bar */}
                <div className="absolute top-0 left-0 right-0 h-8 bg-black/50 flex items-center justify-center z-10">
                  <div className="w-24 h-6 bg-black rounded-b-2xl" />
                </div>
                
                {/* Screen content - Dashboard */}
                <div className="p-4 pt-10">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <div className="text-xs text-white/40">Good morning</div>
                      <div className="text-lg font-bold text-white">Dashboard</div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30" />
                  </div>
                  
                  {/* Main metric circle */}
                  <div className="flex justify-center mb-6">
                    <div className="relative w-32 h-32">
                      <svg className="w-full h-full -rotate-90">
                        <circle cx="50%" cy="50%" r="45%" fill="none" stroke="currentColor" strokeWidth="4" className="text-white/5" />
                        <circle cx="50%" cy="50%" r="45%" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="text-primary" strokeDasharray="283" strokeDashoffset="70" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold text-white">76</span>
                        <span className="text-[10px] text-white/50 uppercase tracking-wider">Sharpness</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[
                      { label: "Focus", value: "82" },
                      { label: "Speed", value: "71" },
                      { label: "Depth", value: "79" },
                    ].map((stat, i) => (
                      <div key={i} className="bg-white/5 rounded-xl p-2 text-center border border-white/5">
                        <div className="text-lg font-bold text-white">{stat.value}</div>
                        <div className="text-[9px] text-white/40 uppercase">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Weekly progress */}
                  <div className="bg-primary/10 rounded-xl p-3 border border-primary/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-white/60">Weekly Goal</span>
                      <span className="text-xs text-primary font-medium">145/200 XP</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: "72.5%" }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Glow effect */}
            <div className="absolute -inset-4 bg-primary/10 rounded-[3rem] blur-3xl -z-10" />
          </motion.div>

          {/* Right Phone - Smaller, tilted */}
          <motion.div
            initial={{ opacity: 0, x: 40, rotate: 5 }}
            animate={isInView ? { opacity: 1, x: 0, rotate: 5 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="hidden sm:block relative w-48 lg:w-64 -mb-12"
          >
            <div className="relative bg-black rounded-[2rem] p-2 shadow-2xl shadow-primary/10 border border-white/10">
              {/* Phone frame */}
              <div className="relative bg-gradient-to-b from-[#0a0a12] to-[#0f1018] rounded-[1.75rem] overflow-hidden aspect-[9/19]">
                {/* Status bar */}
                <div className="absolute top-0 left-0 right-0 h-8 bg-black/50 flex items-center justify-center">
                  <div className="w-20 h-5 bg-black rounded-b-xl" />
                </div>
                
                {/* Screen content - Training Session */}
                <div className="p-4 pt-10">
                  <div className="text-xs text-white/40 uppercase tracking-wider mb-2">In Session</div>
                  <div className="text-lg font-bold text-white mb-4">Focus Drill</div>
                  
                  {/* Timer */}
                  <div className="flex justify-center mb-4">
                    <div className="relative w-24 h-24">
                      <svg className="w-full h-full -rotate-90">
                        <circle cx="50%" cy="50%" r="45%" fill="none" stroke="currentColor" strokeWidth="3" className="text-white/10" />
                        <circle cx="50%" cy="50%" r="45%" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-primary" strokeDasharray="283" strokeDashoffset="100" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xl font-bold text-white">2:34</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress dots */}
                  <div className="flex justify-center gap-1.5 mb-4">
                    {[1,2,3,4,5].map((i) => (
                      <div key={i} className={`w-2 h-2 rounded-full ${i <= 3 ? 'bg-primary' : 'bg-white/20'}`} />
                    ))}
                  </div>
                  
                  <div className="text-center text-xs text-white/50">
                    Round 3 of 5
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Feature highlights */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-20 grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto text-center"
        >
          {[
            { stat: "Real-time", label: "Performance tracking" },
            { stat: "Adaptive", label: "Difficulty scaling" },
            { stat: "Weekly", label: "Cognitive reports" },
          ].map((item, i) => (
            <div key={i}>
              <p className="text-2xl font-bold text-white mb-1">{item.stat}</p>
              <p className="text-sm text-white/50">{item.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
