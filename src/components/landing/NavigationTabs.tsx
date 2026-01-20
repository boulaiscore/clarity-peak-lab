const tabs = [
  { id: "subscriptions", label: "SUBSCRIPTIONS" },
  { id: "how-it-works", label: "HOW IT WORKS" },
  { id: "assessment", label: "ASSESSMENT" },
  { id: "why-neuroloop", label: "WHY NEUROLOOP" },
  { id: "protocols", label: "PROTOCOLS" },
];

interface NavigationTabsProps {
  onTabClick?: (tabId: string) => void;
}

export function NavigationTabs({ onTabClick }: NavigationTabsProps) {
  const handleTabClick = (tabId: string) => {
    // Scroll to section
    const element = document.getElementById(tabId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    // Notify parent (e.g., to close mobile menu)
    onTabClick?.(tabId);
  };

  return (
    <div className="hidden lg:flex items-center gap-8">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => handleTabClick(tab.id)}
          className="text-[11px] uppercase tracking-[0.15em] font-medium text-black/50 hover:text-black transition-colors"
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// Export tabs for use in mobile menu
export { tabs };