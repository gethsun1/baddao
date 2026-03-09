import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from 'framer-motion';
import { buttonHover } from '@/lib/animations';

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    const variants = {
      primary: "bg-gradient-to-r from-communityCorner-accent to-blue-600 text-white hover:from-communityCorner-accent-hover hover:to-blue-500 shadow-[0_0_15px_rgba(47,107,255,0.4)]",
      secondary: "bg-white text-communityCorner-primary hover:bg-gray-100",
      outline: "border border-communityCorner-border text-gray-300 bg-transparent hover:bg-communityCorner-secondary hover:text-white hover:border-communityCorner-highlight/50",
      ghost: "text-gray-400 bg-transparent hover:text-white hover:bg-communityCorner-secondary/50",
    };

    const sizes = {
      sm: "px-4 py-2 text-sm",
      md: "px-6 py-3 font-medium",
      lg: "px-8 py-4 text-lg font-semibold",
    };

    const baseStyles = "inline-flex items-center justify-center rounded-full transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none gap-2 cursor-pointer";

    return (
      <motion.button
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ref={ref as any}
        variants={buttonHover}
        whileHover="whileHover"
        whileTap="whileTap"
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);
Button.displayName = "Button";

export { Button };
