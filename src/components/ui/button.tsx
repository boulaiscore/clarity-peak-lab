import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-button hover:bg-primary/90 active:scale-[0.98]",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-border bg-card text-foreground hover:bg-muted",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "text-muted-foreground hover:bg-muted hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline font-normal",
        // Premium teal button with soft shadow
        premium: "bg-primary text-primary-foreground shadow-button hover:shadow-lg active:scale-[0.98]",
        // Soft pastel style
        soft: "bg-muted text-foreground hover:bg-muted/70",
        // Subtle outline
        subtle: "border border-border/60 bg-card text-foreground hover:bg-muted",
        // Ghost with accent
        "ghost-accent": "text-primary hover:bg-primary/10 hover:text-primary",
        // Pastel variants
        "pastel-teal": "bg-pastel-teal text-foreground hover:bg-pastel-teal/80",
        "pastel-pink": "bg-pastel-pink text-foreground hover:bg-pastel-pink/80",
        "pastel-green": "bg-pastel-green text-foreground hover:bg-pastel-green/80",
        "pastel-purple": "bg-pastel-purple text-foreground hover:bg-pastel-purple/80",
        // Legacy variants
        hero: "bg-primary text-primary-foreground shadow-button hover:shadow-lg active:scale-[0.98]",
        "hero-outline": "border border-border bg-card text-foreground hover:bg-muted",
        glow: "bg-primary text-primary-foreground shadow-lg active:scale-[0.98]",
        control: "bg-card border border-border text-foreground hover:bg-muted",
        dark: "bg-foreground text-background hover:bg-foreground/90",
      },
      size: {
        default: "h-12 px-6 py-2",
        sm: "h-10 rounded-xl px-4 text-xs",
        lg: "h-14 rounded-2xl px-8",
        xl: "h-16 rounded-2xl px-10 text-base font-semibold",
        icon: "h-12 w-12 rounded-2xl",
        "icon-sm": "h-10 w-10 rounded-xl",
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
