import React from 'react';
import {
  LayoutDashboard,
  FileText,
  History,
  Search,
  Settings,
  LogOut,
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface WorkspaceSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSignOut: () => void;
  onNavSelect: (id: string) => void;
  activeNavId: string;
}

export const WorkspaceSidebar: React.FC<WorkspaceSidebarProps> = ({
  isOpen,
  onClose,
  onSignOut,
  onNavSelect,
  activeNavId,
}) => {
  const navItems: NavItem[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'datasets', label: 'My Datasets', icon: <FileText className="w-4 h-4" /> },
    { id: 'history', label: 'Cleaning History', icon: <History className="w-4 h-4" /> },
    { id: 'enquire', label: 'AI Enquire', icon: <Search className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/20 z-40 sm:hidden" onClick={onClose} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-[#E1E5E3] transform transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } sm:relative sm:translate-x-0 sm:border-r sm:z-0`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-[#E1E5E3]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#2868A6] flex items-center justify-center text-[10px] font-bold text-white tracking-wider">
              CS
            </div>
            <span className="font-bold text-sm tracking-tight text-[#252A2E]">CleanSight</span>
          </div>
          <button onClick={onClose} className="text-[#69747D] hover:text-[#252A2E] sm:hidden">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const active = activeNavId === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavSelect(item.id)}
                className={`flex items-center gap-3 px-3 py-2 text-xs rounded-md transition-colors ${
                  active
                    ? 'bg-[#252A2E] text-white'
                    : 'text-[#69747D] hover:bg-[#F7F7F4] hover:text-[#252A2E]'
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-auto p-6 border-t border-[#E1E5E3]">
          <button
            onClick={onSignOut}
            className="flex items-center gap-3 w-full px-3 py-2 text-xs text-[#69747D] rounded-md transition-colors hover:bg-[#F7F7F4] hover:text-[#252A2E]"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
