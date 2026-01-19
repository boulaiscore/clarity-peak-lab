import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="bg-black py-16 border-t border-white/10">
      <div className="container px-6">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* Logo */}
          <div className="flex items-center">
            <span className="text-white font-bold text-lg tracking-tight">NEUROLOOP</span>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap justify-center gap-8 text-sm text-white/50">
            <a href="#how-it-works" className="hover:text-white transition-colors">
              Technology
            </a>
            <Link to="/brain-science" className="hover:text-white transition-colors">
              Science
            </Link>
            <Link to="/auth" className="hover:text-white transition-colors">
              Sign In
            </Link>
            <Link to="/privacy-policy" className="hover:text-white transition-colors">
              Privacy
            </Link>
          </nav>

          {/* Copyright */}
          <p className="text-xs text-white/30">
            © {new Date().getFullYear()} SuperHuman Labs
          </p>
        </div>
      </div>
    </footer>
  );
}
