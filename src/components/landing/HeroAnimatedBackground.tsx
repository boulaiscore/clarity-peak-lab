import { Canvas, useFrame } from "@react-three/fiber";
import { Float, RoundedBox, Text, Html } from "@react-three/drei";
import { useRef, useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import * as THREE from "three";

// Real app metrics matching the Home page
const appMetrics = [
  { label: "Sharpness", value: 87, status: "Peak", color: "#3B82F6" },
  { label: "Readiness", value: 72, status: "Ready", color: "#22C55E" },
  { label: "Recovery", value: 65, status: "Building", color: "#8B5CF6" },
];

// Orbiting metric component
function OrbitingMetric({ 
  metric, 
  orbitRadius, 
  orbitSpeed, 
  startAngle,
  yOffset 
}: { 
  metric: typeof appMetrics[0];
  orbitRadius: number;
  orbitSpeed: number;
  startAngle: number;
  yOffset: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      const angle = startAngle + state.clock.elapsedTime * orbitSpeed;
      groupRef.current.position.x = Math.cos(angle) * orbitRadius;
      groupRef.current.position.z = Math.sin(angle) * orbitRadius;
      groupRef.current.position.y = yOffset + Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
      // Always face camera
      groupRef.current.lookAt(0, groupRef.current.position.y, 0);
    }
  });

  const circumference = 2 * Math.PI * 18;
  const strokeDashoffset = circumference - (metric.value / 100) * circumference;

  return (
    <group ref={groupRef}>
      <Html center distanceFactor={8}>
        <div className="w-20 h-20 backdrop-blur-md bg-black/60 rounded-2xl p-2 border border-white/20 shadow-2xl">
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 44 44">
              <circle
                cx="22"
                cy="22"
                r="18"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="3"
                fill="none"
              />
              <circle
                cx="22"
                cy="22"
                r="18"
                stroke={metric.color}
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
              />
            </svg>
            <span className="text-lg font-bold text-white z-10">{metric.value}</span>
            <span className="text-[8px] text-white/60 uppercase tracking-wider z-10">{metric.label}</span>
          </div>
        </div>
      </Html>
    </group>
  );
}

// iPhone 3D model
function IPhoneMockup() {
  const phoneRef = useRef<THREE.Group>(null);
  const [screenIndex, setScreenIndex] = useState(0);
  
  const screens = [
    { title: "Dashboard", sci: "847", level: "12", streak: "7" },
    { title: "Training", focus: "92%", speed: "1.2s", accuracy: "96%" },
    { title: "Insights", peak: "10 AM", age: "28", improvement: "+23%" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setScreenIndex((prev) => (prev + 1) % screens.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useFrame((state) => {
    if (phoneRef.current) {
      // Gentle rotation
      phoneRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.3;
      // Subtle floating
      phoneRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  const currentScreen = screens[screenIndex];

  return (
    <group ref={phoneRef}>
      {/* Phone body */}
      <RoundedBox args={[2.2, 4.5, 0.15]} radius={0.2} smoothness={4}>
        <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
      </RoundedBox>
      
      {/* Screen bezel */}
      <RoundedBox args={[2, 4.2, 0.02]} radius={0.15} smoothness={4} position={[0, 0, 0.08]}>
        <meshStandardMaterial color="#0a0a0a" />
      </RoundedBox>
      
      {/* Screen content via HTML */}
      <Html
        transform
        occlude
        position={[0, 0, 0.1]}
        distanceFactor={1.5}
        style={{
          width: '180px',
          height: '380px',
        }}
      >
        <div className="w-full h-full bg-gradient-to-b from-gray-900 to-black rounded-2xl overflow-hidden border border-gray-800">
          {/* Status bar */}
          <div className="h-6 flex items-center justify-between px-4 text-[10px] text-white/60">
            <span>9:41</span>
            <div className="flex gap-1">
              <div className="w-4 h-2 bg-white/60 rounded-sm" />
            </div>
          </div>
          
          {/* App content */}
          <div className="p-3 space-y-3">
            <div className="text-center">
              <div className="text-[10px] text-white/40 uppercase tracking-wider">{currentScreen.title}</div>
            </div>
            
            {screenIndex === 0 && (
              <div className="space-y-2">
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <div className="text-3xl font-bold text-white">{currentScreen.sci}</div>
                  <div className="text-[9px] text-primary uppercase tracking-wider">SCI Score</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white/5 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold text-white">{currentScreen.level}</div>
                    <div className="text-[8px] text-white/40">Level</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold text-white">{currentScreen.streak}</div>
                    <div className="text-[8px] text-white/40">Streak</div>
                  </div>
                </div>
                {/* Mini metric rings */}
                <div className="flex justify-center gap-3 mt-2">
                  {appMetrics.map((m) => (
                    <div key={m.label} className="text-center">
                      <div className="w-10 h-10 rounded-full border-2 flex items-center justify-center" style={{ borderColor: m.color }}>
                        <span className="text-xs font-bold text-white">{m.value}</span>
                      </div>
                      <div className="text-[7px] text-white/40 mt-1">{m.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {screenIndex === 1 && (
              <div className="space-y-2">
                <div className="bg-primary/20 rounded-xl p-3 text-center border border-primary/30">
                  <div className="text-[9px] text-primary uppercase tracking-wider mb-1">Focus Score</div>
                  <div className="text-3xl font-bold text-white">{currentScreen.focus}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white/5 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold text-green-400">{currentScreen.speed}</div>
                    <div className="text-[8px] text-white/40">Avg Speed</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold text-white">{currentScreen.accuracy}</div>
                    <div className="text-[8px] text-white/40">Accuracy</div>
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-2">
                  <div className="flex justify-between text-[8px] text-white/40 mb-1">
                    <span>Progress</span>
                    <span>78%</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: '78%' }} />
                  </div>
                </div>
              </div>
            )}
            
            {screenIndex === 2 && (
              <div className="space-y-2">
                <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl p-3 text-center border border-purple-500/30">
                  <div className="text-[9px] text-purple-300 uppercase tracking-wider mb-1">Cognitive Age</div>
                  <div className="text-3xl font-bold text-white">{currentScreen.age}</div>
                  <div className="text-[10px] text-green-400">{currentScreen.improvement}</div>
                </div>
                <div className="bg-white/5 rounded-lg p-2">
                  <div className="text-[8px] text-white/40 mb-1">Peak Performance</div>
                  <div className="text-lg font-bold text-white">{currentScreen.peak}</div>
                </div>
                <div className="bg-white/5 rounded-lg p-2">
                  <div className="text-[8px] text-white/40 mb-1">Weekly Sessions</div>
                  <div className="flex gap-1">
                    {[1,1,1,0,1,0,0].map((done, i) => (
                      <div key={i} className={`w-4 h-4 rounded ${done ? 'bg-primary' : 'bg-white/10'}`} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Html>
      
      {/* Camera notch */}
      <mesh position={[0, 2, 0.09]}>
        <cylinderGeometry args={[0.05, 0.05, 0.02, 16]} />
        <meshStandardMaterial color="#0a0a0a" />
      </mesh>
    </group>
  );
}

// Scene with lighting
function Scene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.3} />
      <spotLight position={[0, 5, 5]} angle={0.3} penumbra={1} intensity={0.5} />
      
      <Float speed={1} rotationIntensity={0.1} floatIntensity={0.3}>
        <IPhoneMockup />
      </Float>
      
      {/* Orbiting metrics */}
      {appMetrics.map((metric, i) => (
        <OrbitingMetric
          key={metric.label}
          metric={metric}
          orbitRadius={3.5}
          orbitSpeed={0.2 + i * 0.05}
          startAngle={(i * Math.PI * 2) / 3}
          yOffset={-0.5 + i * 0.5}
        />
      ))}
    </>
  );
}

export function HeroAnimatedBackground() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-primary/5" />
      
      {/* 3D Canvas */}
      <div className="absolute inset-0">
        <Canvas
          camera={{ position: [0, 0, 8], fov: 45 }}
          style={{ background: 'transparent' }}
        >
          <Suspense fallback={null}>
            <Scene />
          </Suspense>
        </Canvas>
      </div>
      
      {/* Gradient overlays for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-white/80 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-transparent to-white/90 pointer-events-none" />
    </div>
  );
}
