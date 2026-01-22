import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

// Animated metrics that float across the background
const floatingMetrics = [
  { label: "Focus", value: 87, color: "hsl(var(--primary))" },
  { label: "Recovery", value: 92, color: "hsl(142, 76%, 36%)" },
  { label: "Reasoning", value: 78, color: "hsl(280, 67%, 50%)" },
  { label: "Clarity", value: 94, color: "hsl(200, 80%, 50%)" },
];

// App screen mockups data
const appScreens = [
  {
    id: "dashboard",
    title: "Dashboard",
    metrics: [
      { label: "SCI Score", value: "847", trend: "+12" },
      { label: "Sessions", value: "23", trend: "+5" },
      { label: "Streak", value: "7 days", trend: "" },
    ],
  },
  {
    id: "training",
    title: "Training",
    metrics: [
      { label: "Focus", value: "92%", trend: "+8%" },
      { label: "Speed", value: "1.2s", trend: "-0.3s" },
      { label: "Accuracy", value: "96%", trend: "+4%" },
    ],
  },
  {
    id: "insights",
    title: "Insights",
    metrics: [
      { label: "Peak Time", value: "10 AM", trend: "" },
      { label: "Cognitive Age", value: "28", trend: "-3" },
      { label: "Improvement", value: "23%", trend: "" },
    ],
  },
];

function FloatingMetricRing({ 
  metric, 
  delay, 
  position 
}: { 
  metric: typeof floatingMetrics[0]; 
  delay: number;
  position: { x: string; y: string };
}) {
  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference - (metric.value / 100) * circumference;

  return (
    <motion.div
      className="absolute"
      style={{ left: position.x, top: position.y }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: [0, 0.6, 0.6, 0],
        scale: [0.8, 1, 1, 0.9],
        y: [0, -20, -20, -40],
      }}
      transition={{
        duration: 8,
        delay,
        repeat: Infinity,
        repeatDelay: 4,
        ease: "easeInOut",
      }}
    >
      <div className="relative w-24 h-24 backdrop-blur-sm bg-white/10 rounded-full p-2 border border-white/20">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
          <circle
            cx="40"
            cy="40"
            r="36"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            className="text-white/10"
          />
          <motion.circle
            cx="40"
            cy="40"
            r="36"
            stroke={metric.color}
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 2, delay: delay + 0.5, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-white">{metric.value}</span>
          <span className="text-[10px] text-white/60 uppercase tracking-wider">{metric.label}</span>
        </div>
      </div>
    </motion.div>
  );
}

function FloatingAppCard({ 
  screen, 
  delay,
  position 
}: { 
  screen: typeof appScreens[0]; 
  delay: number;
  position: { x: string; y: string };
}) {
  return (
    <motion.div
      className="absolute"
      style={{ left: position.x, top: position.y }}
      initial={{ opacity: 0, x: 50, rotateY: -15 }}
      animate={{ 
        opacity: [0, 0.8, 0.8, 0],
        x: [50, 0, 0, -30],
        rotateY: [-15, 0, 0, 10],
      }}
      transition={{
        duration: 10,
        delay,
        repeat: Infinity,
        repeatDelay: 6,
        ease: "easeInOut",
      }}
    >
      <div className="w-48 backdrop-blur-md bg-black/40 rounded-2xl p-4 border border-white/15 shadow-2xl">
        <div className="text-xs text-white/50 uppercase tracking-wider mb-3">{screen.title}</div>
        <div className="space-y-3">
          {screen.metrics.map((m, i) => (
            <motion.div
              key={m.label}
              className="flex justify-between items-center"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay + 0.3 + i * 0.1 }}
            >
              <span className="text-white/60 text-sm">{m.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-white font-semibold">{m.value}</span>
                {m.trend && (
                  <span className="text-xs text-green-400">{m.trend}</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function PulsingDot({ delay, position }: { delay: number; position: { x: string; y: string } }) {
  return (
    <motion.div
      className="absolute w-2 h-2 rounded-full bg-primary"
      style={{ left: position.x, top: position.y }}
      animate={{
        scale: [1, 1.5, 1],
        opacity: [0.3, 0.8, 0.3],
      }}
      transition={{
        duration: 3,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

function ConnectionLine({ start, end, delay }: { start: { x: number; y: number }; end: { x: number; y: number }; delay: number }) {
  return (
    <motion.svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 0.2, 0.2, 0] }}
      transition={{ duration: 6, delay, repeat: Infinity, repeatDelay: 4 }}
    >
      <motion.line
        x1={`${start.x}%`}
        y1={`${start.y}%`}
        x2={`${end.x}%`}
        y2={`${end.y}%`}
        stroke="hsl(var(--primary))"
        strokeWidth="1"
        strokeDasharray="4 4"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: [0, 1, 1, 0] }}
        transition={{ duration: 6, delay, repeat: Infinity, repeatDelay: 4 }}
      />
    </motion.svg>
  );
}

export function HeroAnimatedBackground() {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  
  const videos = [
    "/src/assets/hero-video.mp4",
    "/src/assets/landing-working.mp4",
    "/src/assets/landing-reading.mp4",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentVideoIndex((prev) => (prev + 1) % videos.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      {/* Video Background */}
      <AnimatePresence mode="wait">
        <motion.video
          key={currentVideoIndex}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          muted
          playsInline
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5 }}
        >
          <source src={videos[currentVideoIndex]} type="video/mp4" />
        </motion.video>
      </AnimatePresence>

      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-white/60 z-10" />
      <div className="absolute inset-0 bg-gradient-to-r from-white/40 via-transparent to-white/40 z-10" />

      {/* Floating Metric Rings */}
      <div className="absolute inset-0 z-20 hidden lg:block">
        <FloatingMetricRing 
          metric={floatingMetrics[0]} 
          delay={0} 
          position={{ x: "8%", y: "20%" }} 
        />
        <FloatingMetricRing 
          metric={floatingMetrics[1]} 
          delay={2} 
          position={{ x: "85%", y: "25%" }} 
        />
        <FloatingMetricRing 
          metric={floatingMetrics[2]} 
          delay={4} 
          position={{ x: "12%", y: "65%" }} 
        />
        <FloatingMetricRing 
          metric={floatingMetrics[3]} 
          delay={6} 
          position={{ x: "80%", y: "60%" }} 
        />
      </div>

      {/* Floating App Cards */}
      <div className="absolute inset-0 z-20 hidden xl:block">
        <FloatingAppCard 
          screen={appScreens[0]} 
          delay={1} 
          position={{ x: "3%", y: "35%" }} 
        />
        <FloatingAppCard 
          screen={appScreens[1]} 
          delay={5} 
          position={{ x: "82%", y: "40%" }} 
        />
      </div>

      {/* Pulsing Dots */}
      <div className="absolute inset-0 z-15">
        {[
          { x: "20%", y: "30%", delay: 0 },
          { x: "75%", y: "20%", delay: 1 },
          { x: "60%", y: "70%", delay: 2 },
          { x: "35%", y: "55%", delay: 3 },
          { x: "90%", y: "50%", delay: 4 },
          { x: "15%", y: "80%", delay: 5 },
        ].map((dot, i) => (
          <PulsingDot key={i} delay={dot.delay} position={{ x: dot.x, y: dot.y }} />
        ))}
      </div>

      {/* Connection Lines */}
      <ConnectionLine start={{ x: 20, y: 30 }} end={{ x: 35, y: 55 }} delay={0} />
      <ConnectionLine start={{ x: 75, y: 20 }} end={{ x: 60, y: 70 }} delay={2} />
      <ConnectionLine start={{ x: 35, y: 55 }} end={{ x: 60, y: 70 }} delay={4} />
    </div>
  );
}
