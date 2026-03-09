import React, { forwardRef, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "success" | "warning" | "error" | "info" | "neutral";
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "neutral", children, ...props }, ref) => {
    const variants = {
      success: "bg-green-500/10 text-green-400 border border-green-500/20",
      warning: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
      error: "bg-red-500/10 text-red-400 border border-red-500/20",
      info: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
      neutral: "bg-gray-500/10 text-gray-300 border border-gray-500/20",
    };

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider",
          variants[variant],
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);
Badge.displayName = "Badge";

export { Badge };
