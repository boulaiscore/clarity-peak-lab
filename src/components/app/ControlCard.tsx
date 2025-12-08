import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface ControlCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
  gradient?: string;
  className?: string;
}

export function ControlCard({
  icon: Icon,
  title,
  description,
  onClick,
  gradient = "from-primary/20 to-accent/20",
  className,
}: ControlCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative w-full p-8 rounded-2xl bg-card border border-border",
        "hover:border-primary/50 hover:shadow-glow transition-all duration-300",
        "text-left overflow-hidden",
        className
      )}
    >
      {/* Gradient background */}
      <div
        className={cn(
          "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
          `bg-gradient-to-br ${gradient}`
        )}
      />

      {/* Content */}
      <div className="relative z-10">
        <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
          <Icon className="w-7 h-7 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>

      {/* Arrow indicator */}
      <div className="absolute bottom-8 right-8 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
        <svg
          className="w-4 h-4 text-primary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );
}
