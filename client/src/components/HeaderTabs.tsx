import { NavLink } from 'react-router-dom';

interface Tab {
  label: string;
  value: string;
  to?: string; // For navigation tabs
  onClick?: () => void; // For click-based tabs
}

interface HeaderTabsProps {
  tabs: Tab[];
  activeTab?: string;
  onTabChange?: (value: string) => void;
  className?: string;
}

export default function HeaderTabs({ 
  tabs, 
  activeTab, 
  onTabChange, 
  className = 'mb-8' 
}: HeaderTabsProps) {
  return (
    <div className={`flex items-center gap-8 border-b border-slate-200 ${className}`}>
      {tabs.map((tab) => {
        // If tab has a 'to' prop, it's a navigation tab
        if (tab.to) {
          return (
            <NavLink
              key={tab.value}
              to={tab.to}
              className={({ isActive }) =>
                `pb-2 px-2 font-semibold transition-all duration-200 border-b-2 ${
                  isActive
                    ? 'text-blue-600 border-blue-600'
                    : 'text-slate-500 hover:text-slate-700 border-transparent'
                }`
              }
              end
            >
              {tab.label}
            </NavLink>
          );
        }
        
        // Otherwise, it's a click-based tab
        const isActive = activeTab === tab.value;
        return (
          <button
            key={tab.value}
            onClick={() => {
              onTabChange?.(tab.value);
              tab.onClick?.();
            }}
            className={`pb-2 px-2 font-semibold transition-all duration-200 border-b-2 ${
              isActive
                ? 'text-blue-600 border-blue-600'
                : 'text-slate-500 hover:text-slate-700 border-transparent'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
