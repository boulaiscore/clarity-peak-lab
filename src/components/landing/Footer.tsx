import { NeuroLoopWordmark } from "@/components/ui/NeuroLoopWordmark";

export function Footer() {
  return (
    <footer className="bg-white py-16 border-t border-black/10">
      <div className="container px-6">
        <div className="flex flex-col items-center justify-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <NeuroLoopWordmark
              logoSize={22}
              uppercase
              logoClassName="text-black"
              textClassName="text-black font-bold text-lg tracking-tight"
            />
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