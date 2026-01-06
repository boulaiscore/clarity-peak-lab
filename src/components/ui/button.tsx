import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/85 active:scale-[0.98]",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-border/60 bg-transparent text-foreground hover:bg-card hover:border-border",
        secondary: "bg-card text-foreground hover:bg-muted border border-border/40",
        ghost: "text-muted-foreground hover:bg-card hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline font-normal",
        // WHOOP-style primary button - subtle glow
        premium: "bg-primary text-primary-foreground shadow-button hover:shadow-glow active:scale-[0.98]",
        // Subtle outline for secondary actions
        subtle: "border border-border/40 bg-card/50 text-foreground hover:bg-card hover:border-border/60 backdrop-blur-sm",
        // Ghost with teal accent
        "ghost-accent": "text-primary hover:bg-primary/10 hover:text-primary",
        // Dark solid button
        dark: "bg-card border border-border/40 text-foreground hover:bg-muted active:scale-[0.98]",
        // Legacy variants for compatibility
        hero: "bg-primary text-primary-foreground shadow-button hover:shadow-glow hover:bg-primary/90 hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.98] active:translate-y-0 transition-all duration-300 ease-out",
        "hero-outline": "border border-border/60 bg-card/50 text-foreground hover:bg-card hover:border-primary/30 backdrop-blur-sm",
        glow: "bg-primary text-primary-foreground shadow-glow hover:shadow-button active:scale-[0.98]",
        control: "bg-card border border-border/40 text-foreground hover:bg-muted hover:border-border/60",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 rounded-lg px-4 text-xs",
        lg: "h-12 rounded-xl px-8",
        xl: "h-14 rounded-xl px-10 text-base font-semibold",
        icon: "h-10 w-10 rounded-xl",
        "icon-sm": "h-8 w-8 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };