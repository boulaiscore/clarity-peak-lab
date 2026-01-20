import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="bg-black py-16 border-t border-white/10">
      <div className="container px-6">
        <div className="flex flex-col items-center justify-center gap-4">
          {/* Logo */}
          <div className="flex items-center">
            <span className="text-white font-bold text-lg tracking-tight">NEUROLOOP</span>
          </div>

          {/* Copyright */}
          <p className="text-xs text-white/30">
            © {new Date().getFullYear()} SuperHuman Labs
          </p>
        </div>
      </div>
    </footer>
  );
}
