import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 press-effect",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-button hover:opacity-90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-border bg-transparent text-foreground hover:bg-muted",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "text-muted-foreground hover:bg-muted hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline font-normal",
        premium: "bg-gradient-gold text-primary-foreground shadow-button hover:opacity-95",
        gold: "bg-gradient-gold text-primary-foreground font-semibold shadow-button hover:shadow-glow",
        soft: "bg-muted/50 text-foreground hover:bg-muted",
        subtle: "border border-border/60 bg-card text-foreground hover:bg-muted",
        "ghost-accent": "text-primary hover:bg-primary/10 hover:text-primary",
        hero: "bg-gradient-gold text-primary-foreground font-semibold shadow-button hover:shadow-glow animate-glow-pulse",
        "hero-outline": "border border-border bg-card text-foreground hover:bg-muted",
        glow: "bg-primary text-primary-foreground shadow-lg",
        control: "bg-card border border-border text-foreground hover:bg-muted",
        dark: "bg-foreground text-background hover:bg-foreground/90",
      },
      size: {
        default: "h-12 px-5 py-3",
        sm: "h-10 rounded-lg px-4 text-sm",
        lg: "h-14 rounded-xl px-8 text-base",
        xl: "h-16 rounded-2xl px-10 text-lg font-semibold",
        icon: "h-12 w-12 rounded-xl",
        "icon-sm": "h-10 w-10 rounded-lg",
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
