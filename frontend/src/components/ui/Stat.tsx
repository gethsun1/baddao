import React from "react";
import { cn } from "@/lib/utils";

interface StatProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  className?: string;
}

export function Stat({ label, value, icon, className }: StatProps) {
  return (
    <div className={cn("glass p-6 rounded-2xl border-white/5", className)}>
      <div className="flex items-center gap-4">
        {icon && (
          <div className="w-12 h-12 rounded-xl bg-baddao-primary flex items-center justify-center text-baddao-highlight border border-baddao-border/50">
            {icon}
          </div>
        )}
        <div>
          <p className="text-sm font-medium text-gray-400 mb-1">{label}</p>
          <h4 className="text-2xl font-bold text-white font-mono">{value}</h4>
        </div>
      </div>
    </div>
  );
}
