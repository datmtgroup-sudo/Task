import React, { useState, useEffect, useRef } from 'react';
import { Filters, TimeRange } from '../types';
import { PRIORITY_OPTIONS, TASK_STATUS_OPTIONS, WORK_TYPE_OPTIONS, CHANNEL_OPTIONS } from '../constants';
import { FilterIcon, XCircleIcon, CheckCircleIcon } from './icons/IconComponents';

interface FilterBarProps {
    filters: Filters;
    setFilters: React.Dispatch<React.SetStateAction<Filters>>;
    assignees: string[];
    projects: string[];
    tags: string[];
    currentUser: string;
    viewMode: 'user' | 'manager';
    taskCount: number;
    totalTaskCount: number;
    timeRange: TimeRange;
    setTimeRange: (range: TimeRange) => void;
}

const FilterDropdown: React.FC<{
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    options: string[];
    placeholder: string;
    className?: string;
}> = ({ value, onChange, options, placeholder, className = '' }) => (
    <select
        value={value}
        onChange={onChange}
        className={`form-select ${className}`}
    >
        <option value="all">{placeholder}</option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
);

const TimeRangeSelector: React.FC<{
    value: TimeRange;
    onChange: (value: TimeRange) => void;
}> = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const options: { id: TimeRange; label: string; tooltip: string }[] = [
        { id: 'week', label: 'Tuần này', tooltip: 'Hiển thị các công việc trong tuần hiện tại (Thứ 2 – Chủ nhật).' },
        { id: 'month', label: 'Tháng này', tooltip: 'Hiển thị các công việc có deadline trong tháng hiện tại.' },
        { id: 'quarter', label: 'Quý này', tooltip: 'Hiển thị các công việc có deadline trong quý hiện tại.' },
        { id: 'all', label: 'Toàn bộ', tooltip: 'Hiển thị tất cả công việc, không lọc theo thời gian.' },
    ];
    
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const handleSelect = (optionId: TimeRange) => {
        onChange(optionId);
        setIsOpen(false);
    };

    const selectedOption = options.find(opt => opt.id === value) || options[3];

    return (
        <div ref={wrapperRef} className="relative w-40">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="form-select w-full text-left bg-no-repeat"
                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`}}
            >
                <span className="truncate">{selectedOption.label}</span>
            </button>
            {isOpen && (
                <ul className="absolute z-10 mt-1 w-full bg-white dark:bg-slate-700 shadow-lg rounded-lg py-1 text-base ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                    {options.map(option => (
                        <li
                            key={option.id}
                            title={option.tooltip}
                            onClick={() => handleSelect(option.id)}
                            className={`cursor-pointer select-none relative py-2 pl-3 pr-9 text-slate-900 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 ${value === option.id ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}
                        >
                            <span className={`block truncate ${value === option.id ? 'font-semibold' : 'font-normal'}`}>{option.label}</span>
                            {value === option.id && (
                                <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-primary-600 dark:text-primary-400">
                                    <CheckCircleIcon className="h-5 w-5" aria-hidden="true" />
                                </span>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};


export const FilterBar: React.FC<FilterBarProps> = (props) => {
    const { filters, setFilters, assignees, projects, tags, currentUser, viewMode, taskCount, totalTaskCount, timeRange, setTimeRange } = props;
    
    const handleFilterChange = (key: keyof Filters, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };
    
    const resetFilters = () => {
        setFilters({
            assignee: viewMode === 'user' ? currentUser : 'all',
            project: 'all',
            status: 'all',
            priority: 'all',
            workType: 'all',
            channel: 'all',
            tags: 'all',
        });
        setTimeRange('month');
    };

    const activeFilters = Object.entries(filters).filter(([, value]) => value !== 'all');
    
    return (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-card border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                <div className="flex items-center gap-3">
                    <select className="form-select w-48">
                        <option>My Week</option>
                        <option>Overdue Tasks</option>
                        <option>Q4 Campaign - Design</option>
                    </select>
                    <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
                </div>
                <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden xl:block" />
                <div className="flex flex-wrap items-center gap-3 flex-grow">
                     <FilterDropdown value={filters.assignee} onChange={e => handleFilterChange('assignee', e.target.value)} options={assignees} placeholder="Tất cả nhân sự" className="w-40" />
                    <FilterDropdown value={filters.project} onChange={e => handleFilterChange('project', e.target.value)} options={projects} placeholder="Tất cả dự án" className="w-40" />
                    <FilterDropdown value={filters.status} onChange={e => handleFilterChange('status', e.target.value)} options={TASK_STATUS_OPTIONS} placeholder="Trạng thái" className="w-36" />
                    <FilterDropdown value={filters.priority} onChange={e => handleFilterChange('priority', e.target.value)} options={PRIORITY_OPTIONS} placeholder="Ưu tiên" className="w-32"/>
                </div>
                 <div className="ml-auto flex-shrink-0">
                    <button onClick={() => handleFilterChange('assignee', currentUser)} className={`text-sm font-medium px-4 py-2 rounded-lg ${filters.assignee === currentUser ? 'bg-primary-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>My tasks</button>
                </div>
            </div>
             
            {(activeFilters.length > 0 || timeRange !== 'all') && (
                <div className="pt-3 border-t border-slate-200 dark:border-slate-700/50 flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Hiển thị {taskCount} trên {totalTaskCount} tasks</span>
                    <span className="text-slate-300 dark:text-slate-600">|</span>
                    {activeFilters.map(([key, value]) => (
                        <div key={key} className="flex items-center bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300 text-xs font-medium px-2.5 py-1 rounded-full">
                            <span>{`${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`}</span>
                            <button onClick={() => handleFilterChange(key as keyof Filters, 'all')} className="ml-1.5 -mr-1 text-primary-500 hover:text-primary-700"><XCircleIcon className="h-4 w-4" /></button>
                        </div>
                    ))}
                    <button onClick={resetFilters} className="text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 ml-auto">Reset bộ lọc</button>
                </div>
            )}
            <style>{`
                .form-select {
                    @apply h-10 bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors;
                }
                select.form-select {
                    -webkit-appearance: none; -moz-appearance: none; appearance: none;
                    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
                    background-position: right 0.5rem center; background-repeat: no-repeat; background-size: 1.5em 1.5em;
                }
                .dark select.form-select {
                     background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
                }
            `}</style>
        </div>
    );
};