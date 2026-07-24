import React from 'react';

export type Page = 'akshara' | 'report' | 'ai';

interface NavItem {
  id: Page;
  label: string;
}

interface NavBarProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
  hasAnalysis: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'akshara', label: 'Analyze' },
  { id: 'report', label: 'Report' },
  { id: 'ai', label: 'AI Analysis' },
];

const NavBar: React.FC<NavBarProps> = ({ activePage, onNavigate, hasAnalysis }) => {
  return (
    <div className="sticky top-4 z-50 flex justify-center px-4">
      <nav className="flex items-center gap-1 sm:gap-2 bg-white/90 backdrop-blur-md border border-neutral-200/80 rounded-full pl-5 pr-2 py-2 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.12)]">
        {/* Brand */}
        <button
          onClick={() => onNavigate('akshara')}
          className="font-kannada text-lg font-bold text-neutral-900 pr-2 sm:pr-4 mr-1 sm:mr-2 border-r border-neutral-200"
        >
          ಅಕ್ಷರ
        </button>

        {/* Tabs */}
        <div className="flex items-center gap-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = activePage === item.id;
            const showDot = (item.id === 'report' || item.id === 'ai') && hasAnalysis && !isActive;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`relative px-3 sm:px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors duration-200 ${
                  isActive
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                {item.label}
                {showDot && (
                  <span className="absolute top-1 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500" title="Analysis ready" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default NavBar;
