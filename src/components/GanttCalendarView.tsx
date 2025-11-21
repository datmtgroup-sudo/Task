
import React, { useState, useMemo, FC, useRef, useEffect } from 'react';
import { Task, WorkType, TaskStatus, Priority, Channel, ActionItem, ActionItemStatus } from '../types';
import { 
    GanttChartIcon, 
    CalendarIcon, 
    XMarkIcon,
    ArrowsPointingOutIcon,
    ClockIcon,
    ChartBarSquareIcon
} from './icons/IconComponents';
import { QuickCreatePanel } from './QuickCreatePanel';
import { 
    PRIORITY_OPTIONS, 
    TASK_STATUS_OPTIONS, 
    WORK_TYPE_OPTIONS,
    CHANNEL_OPTIONS
} from '../constants';

// --- Types & Constants ---
interface GanttCalendarViewProps {
  tasks: Task[];
  actionItems: ActionItem[];
  assignees: string[];
  projects: string[];
  onDateClick: (date: string) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
}

type ViewMode = 'gantt' | 'month' | 'week';

const statusLegend: { status: TaskStatus | 'Overdue', label: string, color: string }[] = [
    { status: 'Overdue', label: 'Quá hạn', color: 'bg-red-500' },
    { status: TaskStatus.Todo, label: 'Đúng tiến độ', color: 'bg-green-500' },
    { status: TaskStatus.Doing, label: 'Đang làm', color: 'bg-blue-500' },
    { status: TaskStatus.PendingReview, label: 'Đang duyệt', color: 'bg-orange-500' },
    { status: TaskStatus.Done, label: 'Hoàn thành', color: 'bg-purple-500' },
];

const barColorClasses: Record<TaskStatus | 'Overdue', string> = {
    'Overdue': 'bg-red-500',
    [TaskStatus.Done]: 'bg-purple-500',
    [TaskStatus.Doing]: 'bg-blue-500',
    [TaskStatus.PendingReview]: 'bg-orange-500',
    [TaskStatus.Todo]: 'bg-green-500',
    [TaskStatus.Defer]: 'bg-slate-500',
};

// --- Helper Functions ---
const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getDayOfWeek = (year: number, month: number, day: number) => new Date(year, month, day).getDay(); // 0=Sun, 1=Mon...
const getMonthName = (monthIndex: number, year: number) => new Date(year, monthIndex, 1).toLocaleString('vi-VN', { month: 'long', year: 'numeric' });
const toISODateString = (date: Date) => date.toISOString().split('T')[0];

// --- Sub-Components ---

const Header: FC<{ 
    currentDate: Date;
    setCurrentDate: (date: Date) => void;
    viewMode: ViewMode; 
    setViewMode: (mode: ViewMode) => void;
}> = ({ currentDate, setCurrentDate, viewMode, setViewMode }) => {
    const views: { id: ViewMode, label: string, icon: FC<{className?: string}> }[] = [
        { id: 'gantt', label: 'Gantt', icon: GanttChartIcon },
        { id: 'month', label: 'Tháng', icon: CalendarIcon },
        { id: 'week', label: 'Tuần', icon: ClockIcon },
    ];

    const handleDateChange = (increment: number) => {
        const newDate = new Date(currentDate);
        if (viewMode === 'month') {
            newDate.setMonth(newDate.getMonth() + increment);
        } else if (viewMode === 'week') {
            newDate.setDate(newDate.getDate() + (7 * increment));
        } else { // gantt is monthly
             newDate.setMonth(newDate.getMonth() + increment);
        }
        setCurrentDate(newDate);
    };

    return (
        <div className="sticky top-0 z-30 bg-slate-100/80 dark:bg-slate-950/80 backdrop-blur-sm -mx-6 lg:-mx-10 px-6 lg:px-10 py-4">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tiến độ & Lịch dự án</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Theo dõi tiến độ theo thời gian, nhân sự, dự án và loại công việc (Plan/Ad-hoc).</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="hidden sm:flex items-center p-1 bg-slate-200 dark:bg-slate-800 rounded-full">
                        {views.map(v => (
                             <button key={v.id} onClick={() => setViewMode(v.id)} className={`flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-full transition-colors ${viewMode === v.id ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-700/50'}`}>
                                <v.icon className="h-4 w-4" /> {v.label}
                            </button>
                        ))}
                    </div>
                     <div className="flex items-center space-x-1">
                        <button onClick={() => handleDateChange(-1)} className="p-2.5 rounded-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600">&lt;</button>
                        <span className="font-semibold text-slate-700 dark:text-slate-200 w-36 text-center">{getMonthName(currentDate.getMonth(), currentDate.getFullYear())}</span>
                        <button onClick={() => handleDateChange(1)} className="p-2.5 rounded-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600">&gt;</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const FilterAndLegendCard: FC<{
    filters: any;
    onFilterChange: (key: string, value: string) => void;
    assignees: string[];
    projects: string[];
}> = ({ filters, onFilterChange, assignees, projects }) => {
    const activeFilters = Object.entries(filters).filter(([, value]) => value !== 'all');
    return (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-card border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-2">CHÚ THÍCH:</span>
                {statusLegend.map(item => (
                    <div key={item.label} className="flex items-center">
                        <span className={`h-2.5 w-2.5 rounded-full mr-2 ${item.color}`}></span>
                        <span className="text-xs text-slate-600 dark:text-slate-400">{item.label}</span>
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
                <select value={filters.assignee} onChange={e => onFilterChange('assignee', e.target.value)} className="form-select"><option value="all">Tất cả nhân sự</option>{assignees.map(a=><option key={a} value={a}>{a}</option>)}</select>
                <select value={filters.project} onChange={e => onFilterChange('project', e.target.value)} className="form-select"><option value="all">Tất cả dự án</option>{projects.map(p=><option key={p} value={p}>{p}</option>)}</select>
                <select value={filters.workType} onChange={e => onFilterChange('workType', e.target.value)} className="form-select"><option value="all">Tất cả loại</option>{WORK_TYPE_OPTIONS.map(o=><option key={o} value={o}>{o}</option>)}</select>
                <select value={filters.status} onChange={e => onFilterChange('status', e.target.value)} className="form-select"><option value="all">Tất cả trạng thái</option>{TASK_STATUS_OPTIONS.map(o=><option key={o} value={o}>{o}</option>)}</select>
                <select value={filters.priority} onChange={e => onFilterChange('priority', e.target.value)} className="form-select"><option value="all">Tất cả ưu tiên</option>{PRIORITY_OPTIONS.map(o=><option key={o} value={o}>{o}</option>)}</select>
                <select value={filters.channel} onChange={e => onFilterChange('channel', e.target.value)} className="form-select"><option value="all">Tất cả kênh</option>{CHANNEL_OPTIONS.map(o=><option key={o} value={o}>{o}</option>)}</select>
                <button onClick={() => Object.keys(filters).forEach(key => onFilterChange(key, 'all'))} className="text-sm text-slate-500 hover:text-primary-600 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700">Xóa bộ lọc</button>
            </div>
             {activeFilters.length > 0 && (
                <div className="pt-2 flex flex-wrap items-center gap-2">
                    {activeFilters.map(([key, value]) => (
                        <div key={key} className="flex items-center bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300 text-xs font-medium pl-2.5 pr-1.5 py-1 rounded-full">
                            <span>{`${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`}</span>
                            <button onClick={() => onFilterChange(key, 'all')} className="ml-1.5 text-primary-500 hover:text-primary-700"><XMarkIcon className="h-3.5 w-3.5" /></button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const TaskDetailPanel: FC<{task: Task | null, actionItems: ActionItem[], onClose: () => void, onUpdateTask: (id: string, updates:Partial<Task>) => void}> = ({task, actionItems, onClose, onUpdateTask}) => {
    if (!task) return null;
    return (
        <QuickCreatePanel isOpen={!!task} onClose={onClose} title={task.name}>
             <div className="space-y-6 text-sm">
                <div>
                    <h3 className="panel-label">Mô tả</h3>
                    <textarea value={task.description || ''} onChange={e => onUpdateTask(task.id, {description: e.target.value})} rows={4} className="panel-content w-full bg-transparent border-none focus:ring-0 p-0"></textarea>
                </div>
                <div>
                     <h3 className="panel-label">Chi tiết</h3>
                     <div className="panel-content grid grid-cols-2 gap-x-4 gap-y-2">
                         <div className="panel-data-item"><span className="font-medium">Người phụ trách:</span> {task.assignees.join(', ')}</div>
                         <div className="panel-data-item"><span className="font-medium">Dự án:</span> {task.project}</div>
                         <div className="panel-data-item"><span className="font-medium">Độ ưu tiên:</span> {task.priority}</div>
                         <div className="panel-data-item"><span className="font-medium">Kênh:</span> {task.channel || 'N/A'}</div>
                         <div className="panel-data-item"><span className="font-medium">Deadline:</span> {task.deadline}</div>
                         <div className="panel-data-item"><span className="font-medium">Points:</span> {task.points}</div>
                     </div>
                </div>
                 {actionItems.length > 0 && (
                    <div>
                        <h3 className="panel-label">Action Items ({actionItems.filter(i => i.status === 'Done').length}/{actionItems.length})</h3>
                        <ul className="panel-content space-y-2">
                           {actionItems.map(item => (
                               <li key={item.id} className="flex items-center">
                                   <input type="checkbox" checked={item.status === 'Done'} readOnly className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"/>
                                   <span className={`ml-2 ${item.status === 'Done' ? 'line-through text-slate-500' : ''}`}>{item.description}</span>
                               </li>
                           ))}
                        </ul>
                    </div>
                 )}
             </div>
             <style>{`
                .panel-label { @apply text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2; }
                .panel-content { @apply p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700; }
                .panel-data-item { @apply text-slate-700 dark:text-slate-300; }
             `}</style>
        </QuickCreatePanel>
    )
}

const GanttView: FC<{tasks: Task[], assignees: string[], year: number, month: number, onUpdateTask: (id: string, updates: Partial<Task>) => void, onTaskClick: (task: Task) => void}> = ({ tasks, assignees, year, month, onUpdateTask, onTaskClick }) => {
    const daysInMonth = getDaysInMonth(year, month);
    const today = new Date();
    const todayDate = today.getFullYear() === year && today.getMonth() === month ? today.getDate() : 0;

    const tasksByAssignee = useMemo(() => {
        const grouped: Record<string, Task[]> = {};
        tasks.forEach(task => {
            task.assignees.forEach(assignee => {
                if (!grouped[assignee]) grouped[assignee] = [];
                grouped[assignee].push(task);
            });
        });
        return grouped;
    }, [tasks]);
    
    const GanttTaskBar: FC<{task: Task, startCol: number, duration: number, assignee: string}> = ({ task, startCol, duration, assignee }) => {
        const isOverdue = new Date(task.deadline) < new Date() && task.status !== TaskStatus.Done;
        const barColor = barColorClasses[isOverdue ? 'Overdue' : task.status];
        const [isResizing, setIsResizing] = useState<'left' | 'right' | null>(null);

        const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
            e.dataTransfer.setData('taskId', task.id);
            e.dataTransfer.setData('taskDuration', String(duration));
            e.currentTarget.style.opacity = '0.6';
        };
        const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => e.currentTarget.style.opacity = '1';

        return (
            <div className="group relative h-full flex items-center px-2" style={{ gridColumn: `${startCol} / span ${duration}` }} onClick={() => onTaskClick(task)}>
                <div draggable onDragStart={handleDragStart} onDragEnd={handleDragEnd}
                    className={`w-full h-8 rounded-lg text-white flex items-center px-2 ${barColor} transition-all duration-200 hover:ring-2 hover:ring-offset-2 hover:ring-offset-white dark:hover:ring-offset-slate-800 hover:ring-primary-400 cursor-pointer`}>
                    {task.workType === WorkType.Adhoc && <div className="absolute inset-0 rounded-lg" style={{backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.2) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.2) 75%, transparent 75%, transparent)' , backgroundSize: '10px 10px'}}></div>}
                    <p className="text-xs font-semibold truncate relative">{task.name}</p>
                </div>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 bg-slate-950 text-white text-xs rounded-lg p-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-xl ring-1 ring-black/5">
                    <div className="font-bold text-sm mb-1.5">{task.name}</div>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-slate-300">
                        <span><span className="font-semibold text-slate-400">Nhân sự:</span> {task.assignees.join(', ')}</span>
                        <span><span className="font-semibold text-slate-400">Dự án:</span> {task.project}</span>
                        <span><span className="font-semibold text-slate-400">Bắt đầu:</span> {task.startDate}</span>
                        <span><span className="font-semibold text-slate-400">Kết thúc:</span> {task.deadline}</span>
                        <span><span className="font-semibold text-slate-400">Trạng thái:</span> {task.status}</span>
                        <span><span className="font-semibold text-slate-400">Loại:</span> {task.workType}</span>
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-700 font-semibold">{task.points} Points • Ưu tiên: {task.priority}</div>
                </div>
            </div>
        )
    }

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, assignee: string, day: number) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('taskId');
        const taskDuration = parseInt(e.dataTransfer.getData('taskDuration'), 10);
        if (!taskId) return;
        
        const newStartDate = new Date(year, month, day);
        const newEndDate = new Date(newStartDate);
        newEndDate.setDate(newStartDate.getDate() + taskDuration - 1);
        
        // Updating assignee on drop in Gantt view is tricky with multi-select. 
        // We will just update dates for now, or replace the assignee list with this single assignee? 
        // Let's just update dates to be safe.
        onUpdateTask(taskId, {
            startDate: toISODateString(newStartDate),
            deadline: toISODateString(newEndDate),
        });
    }

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-card border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
                <div className="relative" style={{ minWidth: '1200px' }}>
                    <div className="grid text-sm" style={{ gridTemplateColumns: `200px repeat(${daysInMonth}, minmax(40px, 1fr))`, gridTemplateRows: `auto repeat(${assignees.length}, 52px)` }}>
                        <div className="sticky top-0 left-0 z-20 bg-white dark:bg-slate-900 border-r border-b border-slate-200 dark:border-slate-800"></div>
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const dayOfWeek = getDayOfWeek(year, month, day);
                            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                            return (
                                <div key={day} className={`sticky top-0 z-10 text-center p-2 border-b border-slate-200 dark:border-slate-800 ${isWeekend ? 'bg-slate-50 dark:bg-slate-800/50' : 'bg-white dark:bg-slate-900'}`}>
                                    <span className={`font-semibold ${day === todayDate ? 'text-primary-600' : ''}`}>{day}</span>
                                </div>
                            );
                        })}
                        {assignees.map((assignee, rowIndex) => (
                            <React.Fragment key={assignee}>
                                <div className={`sticky left-0 z-10 p-2 border-r border-slate-200 dark:border-slate-800 flex items-center font-semibold text-slate-700 dark:text-slate-200 ${rowIndex % 2 === 1 ? 'bg-slate-50 dark:bg-slate-800/50' : 'bg-white dark:bg-slate-900'}`}>{assignee}</div>
                                <div className={`col-start-2 col-span-full grid grid-cols-subgrid ${rowIndex % 2 === 1 ? 'bg-slate-50 dark:bg-slate-800/50' : 'bg-white dark:bg-slate-900'}`}
                                     onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, assignee, 1)}>
                                    {(tasksByAssignee[assignee] || []).map(task => {
                                        const taskStart = new Date(task.startDate);
                                        const taskEnd = new Date(task.deadline);
                                        const monthStart = new Date(year, month, 1);
                                        const monthEnd = new Date(year, month + 1, 0);

                                        if (taskEnd < monthStart || taskStart > monthEnd) return null;
                                        const startDay = taskStart < monthStart ? 1 : taskStart.getDate();
                                        const endDay = taskEnd > monthEnd ? daysInMonth : taskEnd.getDate();
                                        const duration = endDay - startDay + 1;
                                        if (duration <= 0) return null;
                                        
                                        return <GanttTaskBar key={`${task.id}-${assignee}`} task={task} startCol={startDay} duration={duration} assignee={assignee} />;
                                    })}
                                </div>
                            </React.Fragment>
                        ))}
                    </div>
                     <div className="absolute top-0 left-[200px] right-0 bottom-0 grid pointer-events-none" style={{ gridTemplateColumns: `repeat(${daysInMonth}, minmax(40px, 1fr))` }}>
                        {Array.from({ length: daysInMonth }).map((_, i) => <div key={i} className="border-r border-slate-200/70 dark:border-slate-800/70"></div>)}
                        {todayDate > 0 && <div className="absolute top-10 bottom-0 w-0.5 bg-red-500" style={{ left: `calc(${((todayDate - 1) / daysInMonth) * 100}% + ${((1 / daysInMonth) * 100) / 2}%)` }}></div>}
                    </div>
                </div>
            </div>
        </div>
    );
};

const MonthCalendarView: FC<{tasks: Task[], currentDate: Date, onUpdateTask: (id: string, updates: Partial<Task>) => void, onTaskClick: (task: Task) => void }> = ({ tasks, currentDate, onUpdateTask, onTaskClick }) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfWeek = getDayOfWeek(year, month, 1); // 0=Sun, 1=Mon...
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

    const tasksByDay = useMemo(() => {
        const grouped: Record<number, Task[]> = {};
        tasks.forEach(task => {
            const start = new Date(task.startDate);
            const end = new Date(task.deadline);
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                if (d.getFullYear() === year && d.getMonth() === month) {
                    const day = d.getDate();
                    if (!grouped[day]) grouped[day] = [];
                    grouped[day].push(task);
                }
            }
        });
        return grouped;
    }, [tasks, year, month]);

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, day: number) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('taskId');
        if(!taskId) return;

        const task = tasks.find(t => t.id === taskId);
        if(!task) return;
        
        const newDeadline = toISODateString(new Date(year, month, day));
        const duration = new Date(task.deadline).getTime() - new Date(task.startDate).getTime();
        const newStartDate = toISODateString(new Date(new Date(newDeadline).getTime() - duration));

        onUpdateTask(taskId, { deadline: newDeadline, startDate: newStartDate });
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-card border border-slate-200 dark:border-slate-800 p-4">
            <div className="grid grid-cols-7 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {dayNames.map(day => <div key={day} className="py-2">{day}</div>)}
            </div>
            <div className="grid grid-cols-7 grid-rows-5 gap-px bg-slate-200 dark:bg-slate-700 border-t border-l border-slate-200 dark:border-slate-700">
                {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`empty-${i}`} className="bg-slate-50 dark:bg-slate-800/50"></div>)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const isToday = new Date().getFullYear() === year && new Date().getMonth() === month && new Date().getDate() === day;
                    return (
                        <div key={day} className="relative min-h-[120px] bg-white dark:bg-slate-800 p-2" onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, day)}>
                            <span className={`absolute top-2 left-2 text-sm font-semibold ${isToday ? 'bg-primary-500 text-white rounded-full h-6 w-6 flex items-center justify-center' : 'text-slate-700 dark:text-slate-300'}`}>{day}</span>
                            <div className="mt-8 space-y-1">
                                {(tasksByDay[day] || []).map(task => {
                                    const isOverdue = new Date(task.deadline) < new Date() && task.status !== TaskStatus.Done;
                                    const barColor = barColorClasses[isOverdue ? 'Overdue' : task.status];
                                    return (
                                        <div key={task.id} draggable onDragStart={e => e.dataTransfer.setData('taskId', task.id)} onClick={() => onTaskClick(task)}
                                            className={`p-1 rounded text-white text-xs font-semibold truncate cursor-pointer ${barColor}`}>
                                            {task.name}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    )
};

// --- Main View Component ---
export const GanttCalendarView: React.FC<GanttCalendarViewProps> = ({ tasks, assignees, projects, onDateClick, onUpdateTask, actionItems }) => {
    const [viewMode, setViewMode] = useState<ViewMode>('gantt');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    const [filters, setFilters] = useState({
        assignee: 'all', project: 'all', workType: 'all', status: 'all', priority: 'all', channel: 'all'
    });
    
    const filteredTasks = useMemo(() => {
        return tasks.filter(task => 
            (filters.assignee === 'all' || task.assignees.includes(filters.assignee)) &&
            (filters.project === 'all' || task.project === filters.project) &&
            (filters.workType === 'all' || task.workType === filters.workType) &&
            (filters.status === 'all' || task.status === filters.status) &&
            (filters.priority === 'all' || task.priority === filters.priority) &&
            (filters.channel === 'all' || task.channel === filters.channel)
        );
    }, [tasks, filters]);

    const handleFilterChange = (key: string, value: string) => setFilters(prev => ({ ...prev, [key]: value }));
    
    return (
        <>
        <div className="bg-slate-100 dark:bg-slate-950 -m-6 lg:-m-10 p-6 lg:p-10 min-h-screen space-y-6">
            <Header viewMode={viewMode} setViewMode={setViewMode} currentDate={currentDate} setCurrentDate={setCurrentDate} />
            <FilterAndLegendCard filters={filters} onFilterChange={handleFilterChange} assignees={assignees} projects={projects} />
            
            {viewMode === 'gantt' && <GanttView tasks={filteredTasks} assignees={assignees} year={currentDate.getFullYear()} month={currentDate.getMonth()} onUpdateTask={onUpdateTask} onTaskClick={setSelectedTask} />}
            {viewMode === 'month' && <MonthCalendarView tasks={filteredTasks} currentDate={currentDate} onUpdateTask={onUpdateTask} onTaskClick={setSelectedTask} />}
            {viewMode === 'week' && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-card border border-slate-200 dark:border-slate-800 p-8 text-center">
                    <h3 className="text-lg font-semibold">Chế độ xem Tuần sắp ra mắt</h3>
                    <p className="text-slate-500 mt-2">Chế độ xem lịch theo tuần đang được xây dựng.</p>
                </div>
            )}
            
            <style>{`
                .form-select {
                    @apply w-full h-10 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors;
                    -webkit-appearance: none; -moz-appearance: none; appearance: none;
                    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
                    background-position: right 0.5rem center; background-repeat: no-repeat; background-size: 1.5em 1.5em;
                }
                .dark .form-select {
                    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
                }
            `}</style>
        </div>
        <TaskDetailPanel 
            task={selectedTask} 
            actionItems={selectedTask ? actionItems.filter(ai => ai.taskId === selectedTask.id) : []} 
            onClose={() => setSelectedTask(null)}
            onUpdateTask={onUpdateTask}
        />
        </>
    );
};
