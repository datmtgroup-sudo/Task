import React, { useState, useMemo } from 'react';
import { Task, ActionItem, Filters, Priority, WorkType, TaskStatus } from '../types';
import { getWeekNumber } from '../utils/reportUtils';
import { TaskDetailDrawer } from './TaskDetailDrawer';
import { ClipboardListIcon } from './icons/IconComponents';

interface PlanningViewProps {
  tasks: Task[];
  filters: Filters; 
  actionItems: ActionItem[];
  assignees: string[];
  currentUser: string;
  projects: string[];
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onOpenQuickCreate: (initialData?: Partial<Task>) => void;
  onUpdateActionItem?: (actionItemId: string, updates: Partial<ActionItem>) => void;
  onAddActionItem?: (taskId: string) => void;
  onDeleteTask?: (taskId: string) => void;
  onAddComment: (taskId: string, content: string) => void;
  onApprovalAction: (taskId: string, action: 'approve' | 'reject', comment?: string) => void;
}

// --- Constants & Types ---
type PlanningMode = 'week' | 'month' | 'quarter';

// --- Helper Functions ---
const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff));
};

const addDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

const getMonthName = (monthIndex: number) => {
    const date = new Date();
    date.setMonth(monthIndex);
    return date.toLocaleString('vi-VN', { month: 'long' });
};

// --- UI Components ---

const AssigneeAvatar: React.FC<{ name: string }> = ({ name }) => {
    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2);
    return (
        <div title={name} className="h-6 w-6 bg-slate-200 dark:bg-slate-600 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-500 dark:text-slate-300 ring-1 ring-white dark:ring-slate-800 -ml-1 first:ml-0">
            {initials}
        </div>
    );
};

const PlanningCard: React.FC<{ task: Task; actionItems: ActionItem[]; onClick: () => void }> = ({ task, actionItems, onClick }) => {
    const doneActionItems = actionItems.filter(ai => ai.status === 'Done').length;
    
    const priorityColors = {
        [Priority.Thap]: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
        [Priority.TrungBinh]: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300',
        [Priority.Cao]: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300',
        [Priority.KhanCap]: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300',
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        e.dataTransfer.setData('taskId', task.id);
        e.dataTransfer.effectAllowed = "move";
    };

    return (
        <div 
            draggable 
            onDragStart={handleDragStart} 
            onClick={onClick}
            className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-primary-300 dark:hover:border-primary-500 transition-all cursor-pointer group mb-3 relative"
        >
            <div className="mb-2 flex justify-between items-start">
                 <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/50 text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide max-w-[70%] truncate border border-slate-200 dark:border-slate-600">
                    {task.project}
                </span>
                {task.status === TaskStatus.Done && <span className="text-[10px] text-green-600 font-bold">✓ Done</span>}
            </div>
            
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug mb-2 line-clamp-2">
                {task.name}
            </h4>
            
            {task.tags && task.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                    {task.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-500 rounded-full">
                            #{tag}
                        </span>
                    ))}
                </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-1.5">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${priorityColors[task.priority]}`}>
                        {task.priority}
                    </span>
                     <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${task.workType === WorkType.Plan ? 'border-emerald-200 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/10 dark:border-emerald-800' : 'border-orange-200 text-orange-600 bg-orange-50 dark:bg-orange-900/10 dark:border-orange-800'}`}>
                        {task.workType === WorkType.Plan ? 'PLAN' : 'ADHOC'}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                     {actionItems.length > 0 && (
                        <div className="flex items-center text-[10px] text-slate-400 font-medium" title={`${doneActionItems} / ${actionItems.length} subtasks`}>
                            <ClipboardListIcon className="h-3 w-3 mr-0.5"/>
                            {doneActionItems}/{actionItems.length}
                        </div>
                    )}
                    <div className="flex pl-1">
                        {task.assignees.slice(0,2).map(a => <AssigneeAvatar key={a} name={a} />)}
                        {task.assignees.length > 2 && <span className="text-[9px] text-slate-400 ml-1 self-center">+{task.assignees.length - 2}</span>}
                    </div>
                </div>
            </div>
        </div>
    );
};

const DropZonePlaceholder: React.FC<{ text?: string }> = ({ text = "Kéo thả task vào đây" }) => (
    <div className="h-20 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center text-slate-400 mb-3">
        <span className="text-[10px] font-medium uppercase tracking-wider">{text}</span>
    </div>
);

// --- Main Component ---

export const PlanningView: React.FC<PlanningViewProps> = (props) => {
    const { tasks, filters, actionItems, assignees, currentUser, projects, onUpdateTask, onDeleteTask, onOpenQuickCreate } = props;
    
    const [mode, setMode] = useState<PlanningMode>('week');
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    
    // Navigation State
    const [currentDate, setCurrentDate] = useState(new Date()); 

    // --- Helpers for Time Manipulation ---
    
    const getTitle = () => {
        if (mode === 'week') {
            const start = getStartOfWeek(currentDate);
            const end = addDays(start, 6);
            return `Tuần ${getWeekNumber(start)} (${start.getDate()}/${start.getMonth()+1} - ${end.getDate()}/${end.getMonth()+1})`;
        }
        if (mode === 'month') {
            return `Tháng ${currentDate.getMonth() + 1}, ${currentDate.getFullYear()}`;
        }
        if (mode === 'quarter') {
            const q = Math.floor(currentDate.getMonth() / 3) + 1;
            return `Quý ${q}, ${currentDate.getFullYear()}`;
        }
        return '';
    };

    const handlePrev = () => {
        const d = new Date(currentDate);
        if (mode === 'week') d.setDate(d.getDate() - 7);
        if (mode === 'month') d.setMonth(d.getMonth() - 1);
        if (mode === 'quarter') d.setMonth(d.getMonth() - 3);
        setCurrentDate(d);
    };

    const handleNext = () => {
        const d = new Date(currentDate);
        if (mode === 'week') d.setDate(d.getDate() + 7);
        if (mode === 'month') d.setMonth(d.getMonth() + 1);
        if (mode === 'quarter') d.setMonth(d.getMonth() + 3);
        setCurrentDate(d);
    };

    // --- Filtering Logic ---
    const filteredTasks = useMemo(() => {
        return tasks.filter(task => {
            const matchesAssignee = filters.assignee === 'all' || task.assignees.includes(filters.assignee);
            const matchesProject = filters.project === 'all' || task.project === filters.project;
            const matchesStatus = filters.status === 'all' || task.status === filters.status;
            const matchesPriority = filters.priority === 'all' || task.priority === filters.priority;
            return matchesAssignee && matchesProject && matchesStatus && matchesPriority;
        });
    }, [tasks, filters]);

    // --- Column Generation ---
    
    // 1. BACKLOG LOGIC
    const backlogTasks = useMemo(() => {
        if (mode === 'week') {
            const weekStart = getStartOfWeek(currentDate).toISOString().split('T')[0];
            const weekEnd = addDays(getStartOfWeek(currentDate), 6).toISOString().split('T')[0];
            return filteredTasks.filter(t => !t.plannedDate || t.plannedDate < weekStart || t.plannedDate > weekEnd);
        }
        if (mode === 'month') {
            const monthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
            return filteredTasks.filter(t => t.plannedMonth !== monthStr || !t.plannedWeekOfMonth);
        }
        if (mode === 'quarter') {
             const currentQuarter = Math.floor(currentDate.getMonth() / 3) + 1;
             const startMonth = (currentQuarter - 1) * 3; 
             const monthsInQuarter = [
                 `${currentDate.getFullYear()}-${String(startMonth + 1).padStart(2, '0')}`,
                 `${currentDate.getFullYear()}-${String(startMonth + 2).padStart(2, '0')}`,
                 `${currentDate.getFullYear()}-${String(startMonth + 3).padStart(2, '0')}`,
             ];
             return filteredTasks.filter(t => !t.plannedMonth || !monthsInQuarter.includes(t.plannedMonth));
        }
        return [];
    }, [filteredTasks, mode, currentDate]);

    // 2. TIME COLUMNS
    const columns = useMemo(() => {
        if (mode === 'week') {
            const start = getStartOfWeek(currentDate);
            return Array.from({ length: 7 }).map((_, i) => {
                const d = addDays(start, i);
                const dateStr = d.toISOString().split('T')[0];
                const isToday = dateStr === new Date().toISOString().split('T')[0];
                const dayName = d.toLocaleDateString('vi-VN', { weekday: 'long' });
                return {
                    id: dateStr,
                    title: dayName,
                    subtitle: d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
                    tasks: filteredTasks.filter(t => t.plannedDate === dateStr),
                    isToday
                };
            });
        }
        if (mode === 'month') {
            const monthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
            return [1, 2, 3, 4, 5].map(weekNum => {
                 const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                 const weekStart = new Date(firstDayOfMonth);
                 weekStart.setDate(1 + (weekNum - 1) * 7);
                 const weekEnd = new Date(weekStart);
                 weekEnd.setDate(weekStart.getDate() + 6);
                 const rangeStr = `${weekStart.getDate()}/${weekStart.getMonth()+1} - ${weekEnd.getDate()}/${weekEnd.getMonth()+1}`;

                return {
                    id: `week-${weekNum}`,
                    title: `TUẦN ${weekNum}`,
                    subtitle: rangeStr,
                    tasks: filteredTasks.filter(t => t.plannedMonth === monthStr && t.plannedWeekOfMonth === weekNum),
                    payload: { month: monthStr, week: weekNum }
                };
            });
        }
        if (mode === 'quarter') {
            const currentQuarter = Math.floor(currentDate.getMonth() / 3) + 1;
            const startMonthIndex = (currentQuarter - 1) * 3;
            
            return [0, 1, 2].map(offset => {
                const mIndex = startMonthIndex + offset;
                const year = currentDate.getFullYear();
                const mStr = `${year}-${String(mIndex + 1).padStart(2, '0')}`;
                return {
                    id: mStr,
                    title: getMonthName(mIndex).toUpperCase(),
                    subtitle: `Q${currentQuarter} / ${year}`,
                    tasks: filteredTasks.filter(t => t.plannedMonth === mStr),
                    payload: { quarter: `Q${currentQuarter}-${year}`, month: mStr }
                };
            });
        }
        return [];
    }, [mode, currentDate, filteredTasks]);

    // --- Drag & Drop Handlers ---

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetId: string, payload?: any) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('taskId');
        if (!taskId) return;

        if (targetId === 'backlog') {
             if (mode === 'week') onUpdateTask(taskId, { plannedDate: undefined, plannedWeek: undefined });
             if (mode === 'month') onUpdateTask(taskId, { plannedWeekOfMonth: undefined }); 
             if (mode === 'quarter') onUpdateTask(taskId, { plannedMonth: undefined, plannedQuarter: undefined });
        } else {
            if (mode === 'week') {
                const d = new Date(targetId);
                const weekStr = `${d.getFullYear()}-W${getWeekNumber(d)}`;
                onUpdateTask(taskId, { plannedDate: targetId, plannedWeek: weekStr });
            }
            if (mode === 'month') {
                onUpdateTask(taskId, { plannedMonth: payload.month, plannedWeekOfMonth: payload.week });
            }
            if (mode === 'quarter') {
                onUpdateTask(taskId, { plannedQuarter: payload.quarter, plannedMonth: payload.month });
            }
        }
    };
    
    const handleDragOver = (e: React.DragEvent) => e.preventDefault();

    // --- Render ---

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] bg-slate-50 dark:bg-slate-900/30 -m-6 lg:-m-10 p-6 lg:p-8">
            
            {/* 1. Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 flex-shrink-0">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Bảng Kế hoạch</h2>
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-1 flex items-center">
                         <button onClick={() => setMode('week')} className={`px-3 py-1.5 text-xs font-bold uppercase rounded-md transition-all ${mode === 'week' ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300 shadow-sm' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>Tuần</button>
                         <button onClick={() => setMode('month')} className={`px-3 py-1.5 text-xs font-bold uppercase rounded-md transition-all ${mode === 'month' ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300 shadow-sm' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>Tháng</button>
                         <button onClick={() => setMode('quarter')} className={`px-3 py-1.5 text-xs font-bold uppercase rounded-md transition-all ${mode === 'quarter' ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300 shadow-sm' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>Quý</button>
                    </div>
                </div>
                
                <div className="flex items-center bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-1">
                    <button onClick={handlePrev} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md text-slate-500 transition-colors">
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <span className="min-w-[180px] text-center text-sm font-bold text-slate-700 dark:text-slate-200 px-2 select-none">
                        {getTitle()}
                    </span>
                    <button onClick={handleNext} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md text-slate-500 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                </div>
            </div>

            {/* 2. Board Area */}
            <div className="flex-1 flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                
                {/* Backlog Column */}
                <div 
                    className="flex-shrink-0 w-[320px] flex flex-col bg-slate-100 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700 h-full"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, 'backlog')}
                >
                    <div className="p-3 sticky top-0 bg-inherit z-10 rounded-t-2xl border-b border-slate-200 dark:border-slate-700 backdrop-blur">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">BACKLOG</h3>
                                <p className="text-[10px] text-slate-500">
                                    {mode === 'week' ? 'Chưa lên lịch trong tuần' : mode === 'month' ? 'Chưa lên lịch tháng' : 'Chưa lên lịch quý'}
                                </p>
                            </div>
                            <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold px-2 py-1 rounded-full">
                                {backlogTasks.length}
                            </span>
                        </div>
                    </div>
                    <div className="p-3 overflow-y-auto flex-1 custom-scrollbar">
                        {backlogTasks.map(task => (
                            <PlanningCard 
                                key={task.id} 
                                task={task} 
                                actionItems={actionItems.filter(ai => ai.taskId === task.id)}
                                onClick={() => setSelectedTask(task)}
                            />
                        ))}
                        {backlogTasks.length === 0 && (
                            <div className="text-center py-10 text-slate-400 text-xs italic">
                                Không có task nào trong backlog.
                            </div>
                        )}
                    </div>
                </div>

                {/* Dynamic Time Columns */}
                {columns.map(col => (
                    <div
                        key={col.id}
                        className={`flex-shrink-0 w-[300px] flex flex-col rounded-2xl border transition-colors h-full ${
                            // @ts-ignore
                            col.isToday ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800' : 'bg-white dark:bg-gray-800/50'
                        }`}
                        onDragOver={handleDragOver}
                        // @ts-ignore
                        onDrop={(e) => handleDrop(e, col.id, col.payload)}
                    >
                        <div className={`p-4 border-b sticky top-0 z-10 rounded-t-2xl backdrop-blur-sm ${
                            // @ts-ignore
                            col.isToday ? 'border-blue-100 dark:border-blue-800/50 bg-blue-50/50' : ''
                        }`}>
                            <div className="flex justify-between items-center">
                                <div>
                                    <span className="font-semibold text-slate-700 dark:text-slate-200">{col.title}</span>
                                    {/* @ts-ignore */}
                                    <p className="text-xs text-slate-500">{col.subtitle}</p>
                                </div>
                                <span className="text-xs font-bold bg-white dark:bg-slate-700 px-2 py-1 rounded-full shadow-sm">
                                    {col.tasks.length}
                                </span>
                            </div>
                        </div>

                        <div className="p-3 flex-1 overflow-y-auto custom-scrollbar min-h-[100px]">
                            {col.tasks.map(task => (
                                <PlanningCard
                                    key={task.id}
                                    task={task}
                                    actionItems={actionItems.filter(ai => ai.taskId === task.id)}
                                    onClick={() => setSelectedTask(task)}
                                />
                            ))}
                            {col.tasks.length === 0 && <DropZonePlaceholder text="Trống" />}
                        </div>
                    </div>
                ))}
            </div>

            {/* Task Detail Drawer */}
            {selectedTask && (
                <TaskDetailDrawer
                    task={selectedTask}
                    isOpen={!!selectedTask}
                    onClose={() => setSelectedTask(null)}
                    currentUser={currentUser}
                    assignees={assignees}
                    actionItems={actionItems.filter(ai => ai.taskId === selectedTask.id)}
                    onUpdateTask={onUpdateTask}
                    onUpdateActionItem={props.onUpdateActionItem!}
                    onAddActionItem={props.onAddActionItem!}
                    onDeleteTask={onDeleteTask}
                    onAddComment={props.onAddComment}
                    onApprovalAction={props.onApprovalAction}
                />
            )}
        </div>
    );
};

export default PlanningView;
