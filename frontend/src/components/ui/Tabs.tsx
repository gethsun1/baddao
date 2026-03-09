import React from "react";
import { cn } from "@/lib/utils";

interface TabsProps {
  tabs: string[];
  activeTab: string;
  onChange: (tab: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div className={cn("flex space-x-2 border-b border-baddao-border", className)}>
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={cn(
            "px-4 py-3 text-sm font-medium transition-colors relative flex-1 sm:flex-none text-center cursor-pointer",
            activeTab === tab
              ? "text-baddao-highlight"
              : "text-gray-400 hover:text-gray-200"
          )}
        >
          {tab}
          {activeTab === tab && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-baddao-highlight rounded-t-full" />
          )}
        </button>
      ))}
    </div>
  );
}
