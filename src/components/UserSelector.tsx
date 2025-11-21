import React from 'react';
import { UserIcon } from './icons/IconComponents';

interface UserSelectorProps {
    users: string[];
    currentUser: string;
    onUserChange: (user: string) => void;
}

export const UserSelector: React.FC<UserSelectorProps> = ({ users, currentUser, onUserChange }) => {
    return (
        <div className="p-2 bg-slate-100 dark:bg-slate-800/50 rounded-lg">
            <label htmlFor="user-selector" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                Xem với tư cách
            </label>
            <div className="relative">
                 <UserIcon className="h-5 w-5 text-slate-400 absolute top-1/2 left-3 transform -translate-y-1/2 pointer-events-none" />
                <select 
                    id="user-selector" 
                    value={currentUser} 
                    onChange={e => onUserChange(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                    {users.map(user => (
                        <option key={user} value={user}>{user}</option>
                    ))}
                </select>
            </div>
        </div>
    );
};
