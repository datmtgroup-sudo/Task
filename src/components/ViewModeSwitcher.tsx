import React from 'react';
import { UserIcon, TeamIcon } from './icons/IconComponents';

interface ViewModeSwitcherProps {
  viewMode: 'user' | 'manager';
  onViewModeChange: (mode: 'user' | 'manager') => void;
}

export const ViewModeSwitcher: React.FC<ViewModeSwitcherProps> = ({ viewMode, onViewModeChange }) => {
  return (
    <div className="p-1 bg-slate-100 dark:bg-slate-900/50 rounded-lg flex items-center space-x-1">
      <button
        onClick={() => onViewModeChange('user')}
        className={`flex-1 flex items-center justify-center text-center text-sm font-semibold py-2 rounded-md transition-colors duration-200 ${
          viewMode === 'user'
            ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-slate-100'
            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/40'
        }`}
        aria-pressed={viewMode === 'user'}
      >
        <UserIcon className="h-4 w-4 mr-2" />
        Cá nhân
      </button>
      <button
        onClick={() => onViewModeChange('manager')}
        className={`flex-1 flex items-center justify-center text-center text-sm font-semibold py-2 rounded-md transition-colors duration-200 ${
          viewMode === 'manager'
            ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-slate-100'
            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/40'
        }`}
        aria-pressed={viewMode === 'manager'}
      >
        <TeamIcon className="h-4 w-4 mr-2" />
        Quản lý
      </button>
    </div>
  );
};
