import { LayoutDashboard, UploadCloud, History, Settings, Database } from 'lucide-react';
import type { NavItem } from '../types';

interface SidebarProps {
  currentNav: NavItem;
  onSelectNav: (nav: NavItem) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentNav, onSelectNav }) => {
  const navItems = [
    { id: 'overview' as NavItem, label: 'Overview', icon: LayoutDashboard },
    { id: 'upload' as NavItem, label: 'Upload Dataset', icon: UploadCloud },
    { id: 'history' as NavItem, label: 'Cleaning History', icon: History },
    { id: 'settings' as NavItem, label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 shrink-0">
      <div className="p-6 flex items-center space-x-3 border-b border-slate-800">
        <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20">
          <Database className="w-5 h-5" />
        </div>
        <div>
          <span className="font-semibold text-lg text-white tracking-tight">CleanSight AI</span>
          <span className="block text-xs text-indigo-400 font-medium">EDA Dataset Prep</span>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentNav === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectNav(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="p-4 m-4 rounded-xl bg-slate-800/60 border border-slate-700/50 text-xs">
        <div className="flex items-center space-x-2 text-indigo-400 font-medium mb-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Phase 1: UI & Upload</span>
        </div>
        <p className="text-slate-400 text-[11px] leading-relaxed">
          Dataset ingestion and verification interface active.
        </p>
      </div>
    </aside>
  );
};
