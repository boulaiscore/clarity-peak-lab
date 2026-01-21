import { NeuroLoopLogo } from "@/components/ui/NeuroLoopLogo";

export function Footer() {
  return (
    <footer className="bg-white py-16 border-t border-black/10">
      <div className="container px-6">
        <div className="flex flex-col items-center justify-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <NeuroLoopLogo size={22} className="text-black" />
            <span className="text-black font-bold text-lg tracking-tight">NEUROLOOP</span>
          </div>

          {/* Copyright */}
          <p className="text-xs text-black/30">
            © {new Date().getFullYear()} SuperHuman Labs
          </p>
        </div>
      </div>
    </footer>
  );
}