import React, { forwardRef } from "react";
import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';
import { hoverLift } from '@/lib/animations';

export interface CardProps extends Omit<HTMLMotionProps<"div">, "ref"> {
  variant?: 'default' | 'glass' | 'metallic';
  hoverEffect?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(({ 
  className, 
  variant = 'default', 
  hoverEffect = false,
  children, 
  ...props 
}, ref) => {
  const baseStyles = "rounded-2xl p-6 transition-colors shadow-lg";
  
  const variants = {
    default: "bg-communityCorner-card border border-communityCorner-border",
    glass: "glass",
    metallic: "metallic-surface"
  };

  return (
    <motion.div
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={ref as any}
      variants={hoverEffect ? hoverLift : undefined}
      whileHover={hoverEffect ? "whileHover" : undefined}
      className={cn(baseStyles, variants[variant], className)}
      {...props}
    >
      {children}
    </motion.div>
  );
});
Card.displayName = "Card";

export { Card };
