import { useState } from "react";
import { cn } from "@/lib/utils";

export type HomeTabId = "overview" | "intuition" | "reasoning" | "capacity";

interface HomeTabsProps {
  activeTab: HomeTabId;
  onTabChange: (tab: HomeTabId) => void;
}

const tabs: { id: HomeTabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "intuition", label: "Intuition" },
  { id: "reasoning", label: "Reasoning" },
  { id: "capacity", label: "Capacity" },
];

export function HomeTabs({ activeTab, onTabChange }: HomeTabsProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-muted/30 rounded-xl mb-4">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all",
            activeTab === tab.id
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
