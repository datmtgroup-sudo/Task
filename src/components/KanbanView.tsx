
import React, { useState, useMemo } from 'react';
import { Task, TaskStatus, Priority, ActionItem, ActionItemStatus, WorkType, Filters, ApprovalStatus } from '../types';
import { 
    PlusIcon, 
    DotsVerticalIcon, 
    XCircleIcon,
    ClipboardListIcon,
} from './icons/IconComponents';
import { 
    TASK_STATUS_OPTIONS, 
    PRIORITY_OPTIONS, 
    CHANNEL_OPTIONS,
} from '../constants';
import { TaskDetailDrawer } from './TaskDetailDrawer';

// --- PROP TYPES ---
interface KanbanViewProps {
  tasks: Task[];
  actionItems: ActionItem[];
  assignees: string[];
  projects: string[];
  tags: string[];
  currentUser: string;
  viewMode: 'user' | 'manager';
  onTaskStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onUpdateActionItem?: (actionItemId: string, updates: Partial<ActionItem>) => void;
  onAddActionItem?: (taskId: string) => void;
  onDeleteTask?: (taskId: string) => void;
  onOpenQuickCreate: (initialData?: Partial<Task>) => void;
  // Removed approval props
  onAddComment: (taskId: string, content: string) => void;
  onApprovalAction: (taskId: string, action: 'approve' | 'reject', comment?: string) => void;
}

const statusConfig: Record<TaskStatus, { name: string; color: string }> = {
  [TaskStatus.Todo]: { name: 'Cần làm', color: 'border-slate-500' },
  [TaskStatus.Doing]: { name: 'Đang làm', color: 'border-blue-500' },
  [TaskStatus.PendingReview]: { name: 'Đang duyệt', color: 'border-purple-500' },
  [TaskStatus.Done]: { name: 'Hoàn thành', color: 'border-green-500' },
  [TaskStatus.Defer]: { name: 'Tạm hoãn', color: 'border-yellow-500' },
};

const priorityConfig: Record<Priority, { label: string; classes: string }> = {
    [Priority.Thap]: { label: 'Thấp', classes: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'},
    [Priority.TrungBinh]: { label: 'Trung bình', classes: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'},
    [Priority.Cao]: { label: 'Cao', classes: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'},
    [Priority.KhanCap]: { label: 'Khẩn cấp', classes: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'},
};

const AssigneeAvatar: React.FC<{ name: string }> = ({ name }) => {
    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2);
    return (
        <div title={name} className="h-7 w-7 bg-slate-200 dark:bg-slate-600 rounded-full flex items-center justify-center text-xs font-bold text-slate-500 dark:text-slate-300 ring-2 ring-white dark:ring-slate-800/50">
            {initials}
        </div>
    );
};

const AvatarGroup: React.FC<{ names: string[] }> = ({ names }) => {
    if (!names || names.length === 0) return null;
    const displayNames = names.slice(0, 3);
    const remainder = names.length - 3;
    return (
        <div className="flex -space-x-2 overflow-hidden">
            {displayNames.map(name => <AssigneeAvatar key={name} name={name} />)}
            {remainder > 0 && <div className="flex items-center justify-center h-7 w-7 rounded-full ring-2 ring-white dark:ring-slate-800/50 bg-slate-100 dark:bg-slate-700 text-slate-500 text-[10px] font-medium">+{remainder}</div>}
        </div>
    );
}

export const DraggableKanbanCard: React.FC<{ task: Task; actionItems: ActionItem[]; onClick?: () => void }> = ({ task, actionItems, onClick }) => {
    const today = new Date(); today.setHours(0,0,0,0);
    const deadline = new Date(task.deadline);
    const isOverdue = deadline < today && task.status !== TaskStatus.Done;
    const doneActionItems = actionItems.filter(ai => ai.status === ActionItemStatus.Done).length;
    
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => { e.dataTransfer.setData('taskId', task.id); e.currentTarget.style.opacity = '0.5'; };
    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => { e.currentTarget.style.opacity = '1'; };

    return (
        <div draggable onDragStart={handleDragStart} onDragEnd={handleDragEnd} onClick={onClick} className="bg-white dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-card hover:shadow-card-hover hover:border-primary-300 dark:hover:border-primary-500 hover:-translate-y-px cursor-pointer transition-all duration-200 space-y-3">
            <div className="flex justify-between items-start gap-2">
                <p className="font-semibold text-sm text-slate-800 dark:text-slate-100 line-clamp-2">{task.name}</p>
            </div>
            {task.tags && task.tags.length > 0 && (
                 <div className="flex flex-wrap gap-1.5">
                    {task.tags.slice(0, 3).map(tag => <span key={tag} className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">#{tag}</span>)}
                </div>
            )}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-md ${priorityConfig[task.priority].classes}`}>{priorityConfig[task.priority].label}</span>
                    {actionItems.length > 0 && <span className="flex items-center text-xs text-slate-500 dark:text-slate-400 font-medium"><ClipboardListIcon className="h-4 w-4 mr-1"/>{doneActionItems}/{actionItems.length}</span>}
                </div>
                <AvatarGroup names={task.assignees} />
            </div>
        </div>
    );
};

const KanbanColumn: React.FC<{ status: TaskStatus; tasks: Task[]; onDrop: (taskId: string, newStatus: TaskStatus) => void; onAddTask: (status: TaskStatus) => void; children: React.ReactNode }> = ({ status, tasks, onDrop, onAddTask, children }) => {
    const [isOver, setIsOver] = useState(false);
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsOver(true); };
    const handleDragLeave = () => setIsOver(false);
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); const taskId = e.dataTransfer.getData('taskId'); if (taskId) onDrop(taskId, status); setIsOver(false); };
    const { name, color } = statusConfig[status];
    return (
        <div className="flex-shrink-0 w-[340px]" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl h-full flex flex-col">
                <div className={`flex items-center justify-between p-4 border-b-4 ${color}`}>
                    <div className="flex items-center gap-2"><h3 className="font-semibold text-base text-slate-800 dark:text-slate-100">{name}</h3><span className="text-sm font-medium text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-700 rounded-full px-2.5 py-0.5">{tasks.length}</span></div>
                    <div className="flex items-center gap-1">
                        <button onClick={() => onAddTask(status)} className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"><PlusIcon className="h-5 w-5" /></button>
                        <button className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"><DotsVerticalIcon className="h-5 w-5" /></button>
                    </div>
                </div>
                <div className={`flex-1 overflow-y-auto p-4 bg-slate-100/50 dark:bg-slate-900/30 transition-colors rounded-b-2xl ${isOver ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}>
                    <div className="space-y-4">{children}</div>
                </div>
            </div>
        </div>
    );
};

export const KanbanView: React.FC<KanbanViewProps> = (props) => {
    const { tasks, actionItems, assignees, projects, currentUser, viewMode, onTaskStatusChange, onUpdateTask, onOpenQuickCreate, onUpdateActionItem, onAddActionItem, onDeleteTask } = props;

    const [filters, setFilters] = useState<Filters>({ assignee: viewMode === 'user' ? currentUser : 'all', project: 'all', status: 'all', priority: 'all', workType: 'all', channel: 'all', tags: 'all' });
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    const filteredTasks = useMemo(() => tasks.filter(task => {
        return (filters.assignee === 'all' || task.assignees.includes(filters.assignee)) &&
               (filters.project === 'all' || task.project === filters.project) &&
               (filters.status === 'all' || task.status === filters.status);
    }), [tasks, filters]);
    
    const handleFilterChange = (key: keyof Filters, value: string) => setFilters(prev => ({ ...prev, [key]: value }));
    const resetFilters = () => setFilters({ assignee: viewMode === 'user' ? currentUser : 'all', project: 'all', status: 'all', priority: 'all', workType: 'all', channel: 'all', tags: 'all' });
    const activeFilters = useMemo(() => Object.entries(filters).filter(([, value]) => value !== 'all'), [filters]);
    
    return (
        <div className="space-y-8 bg-slate-100 dark:bg-slate-950/70 -m-6 lg:-m-10 p-6 lg:p-10 min-h-screen">
            <div className="sticky top-4 z-30">
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700/50 space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <select value={filters.assignee} onChange={e => handleFilterChange('assignee', e.target.value)} className="form-select"><option value="all">Tất cả nhân sự</option>{assignees.map(a => <option key={a} value={a}>{a}</option>)}</select>
                        <select value={filters.project} onChange={e => handleFilterChange('project', e.target.value)} className="form-select"><option value="all">Tất cả dự án</option>{projects.map(p => <option key={p} value={p}>{p}</option>)}</select>
                        <select value={filters.channel} onChange={e => handleFilterChange('channel', e.target.value)} className="form-select"><option value="all">Tất cả kênh</option>{CHANNEL_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}</select>
                        <select value={filters.status} onChange={e => handleFilterChange('status', e.target.value)} className="form-select"><option value="all">Tất cả trạng thái</option>{TASK_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}</select>
                    </div>
                    {activeFilters.length > 0 && (
                        <div className="pt-3 border-t border-slate-200 dark:border-slate-700/50 flex flex-wrap items-center gap-2">
                            {activeFilters.map(([key, value]) => <div key={key} className="flex items-center bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300 text-xs font-medium px-2.5 py-1 rounded-full"><span>{`${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`}</span><button onClick={() => handleFilterChange(key as keyof Filters, 'all')} className="ml-1.5 -mr-1 text-primary-500 hover:text-primary-700"><XCircleIcon className="h-4 w-4" /></button></div>)}
                            <button onClick={resetFilters} className="text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 ml-2">Xóa bộ lọc</button>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="flex justify-between items-center px-2">
                <div><h2 className="text-2xl font-bold text-slate-900 dark:text-white">Bảng Kanban</h2><p className="text-sm text-slate-500 dark:text-slate-400">Theo dõi luồng công việc Todo → Done</p></div>
                <button onClick={() => onOpenQuickCreate()} className="flex items-center justify-center h-10 px-5 border border-transparent shadow-sm text-sm font-semibold rounded-full text-white bg-primary-600 hover:bg-primary-700 transition-colors"><PlusIcon className="h-5 w-5 mr-2 -ml-1" /> Thêm Task</button>
            </div>

            <div className="flex gap-6 overflow-x-auto pb-6 -mx-6 lg:-mx-10 px-6 lg:px-10">
                {TASK_STATUS_OPTIONS.map(status => (
                    <KanbanColumn key={status} status={status} tasks={filteredTasks.filter(t => t.status === status)} onDrop={onTaskStatusChange} onAddTask={(s) => onOpenQuickCreate({ status: s })}>
                        {filteredTasks.filter(t => t.status === status).map(task => (
                            <DraggableKanbanCard key={task.id} task={task} actionItems={actionItems.filter(ai => ai.taskId === task.id)} onClick={() => setSelectedTask(task)} />
                        ))}
                    </KanbanColumn>
                ))}
            </div>

            <TaskDetailDrawer 
                isOpen={!!selectedTask}
                task={selectedTask}
                actionItems={selectedTask ? actionItems.filter(ai => ai.taskId === selectedTask.id) : []}
                assignees={assignees}
                currentUser={currentUser}
                onClose={() => setSelectedTask(null)}
                onUpdateTask={onUpdateTask}
                onUpdateActionItem={(id, updates) => onUpdateActionItem?.(id, updates)}
                onAddActionItem={(taskId) => onAddActionItem?.(taskId)}
                onDeleteTask={(taskId) => { onDeleteTask?.(taskId); setSelectedTask(null); }}
                onCloneTask={(taskId) => onOpenQuickCreate(selectedTask ? { ...selectedTask, id: undefined, name: `[Clone] ${selectedTask.name}`, status: TaskStatus.Todo } : {})}
            />

            <style>{`.form-select { @apply w-full h-10 bg-white/50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition; -webkit-appearance: none; -moz-appearance: none; appearance: none; }`}</style>
        </div>
    );
};
