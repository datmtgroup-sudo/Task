
import React, { useState, useMemo, useCallback } from 'react';
import { Task, TaskStatus, Priority, ActionItem, WorkType, AdhocOrigin, ReviewStatus, ApprovalStatus } from '../types';
import { getTaskSuggestionsForMyDay } from '../services/geminiService';
import { SunIcon, CalendarIcon, SparklesIcon } from './icons/IconComponents';

const statusClasses: Record<TaskStatus, string> = {
    [TaskStatus.Todo]: 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200',
    [TaskStatus.Doing]: 'bg-blue-200 text-blue-800 dark:bg-blue-700 dark:text-blue-200',
    [TaskStatus.PendingReview]: 'bg-purple-200 text-purple-800 dark:bg-purple-700 dark:text-purple-200',
    [TaskStatus.Done]: 'bg-green-200 text-green-800 dark:bg-green-700 dark:text-green-200',
    [TaskStatus.Defer]: 'bg-yellow-200 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-200',
};

const priorityClasses: Record<Priority, string> = {
    [Priority.Thap]: 'border-slate-300 dark:border-slate-600',
    [Priority.TrungBinh]: 'border-blue-400 dark:border-blue-500',
    [Priority.Cao]: 'border-yellow-400 dark:border-yellow-500',
    [Priority.KhanCap]: 'border-red-500 dark:border-red-500',
};

const TaskCard: React.FC<{ task: Task; tag?: 'Overdue' | 'Due Today' | 'Suggested' }> = ({ task, tag }) => {
    let tagColor = 'text-slate-600 dark:text-slate-300';
    let tagText = task.deadline;
    if (tag === 'Overdue') {
        tagColor = 'text-red-500 dark:text-red-400';
        tagText = `Quá hạn: ${task.deadline}`;
    } else if (tag === 'Due Today') {
        tagText = 'Hạn hôm nay';
    }

    return (
        <div className={`bg-white dark:bg-slate-800 p-4 rounded-lg border-l-4 ${priorityClasses[task.priority]} shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200`}>
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">{task.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{task.project}</p>
                </div>
                <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClasses[task.status]}`}>
                    {task.status}
                </span>
            </div>
            <div className="flex items-center justify-between mt-3 text-sm">
                <span className={`font-medium flex items-center ${tagColor}`}>
                    <CalendarIcon className="h-4 w-4 inline-block mr-1.5" />
                    {tagText}
                </span>
                <span className="text-slate-500 dark:text-slate-400">{task.priority}</span>
            </div>
        </div>
    );
};

interface MyDayViewProps {
    tasks: Task[];
    currentUser: string;
    onAddTask: (task: Omit<Task, 'id'>, actionItems: Omit<ActionItem, 'id' | 'taskId' | 'meetingNoteId'>[], callback?: () => void) => void;
    projects: string[];
}

export const MyDayView: React.FC<MyDayViewProps> = ({ tasks, currentUser, onAddTask, projects }) => {
    const [suggestedTasks, setSuggestedTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [quickTaskName, setQuickTaskName] = useState('');
    const todayString = new Date().toISOString().split('T')[0];

    const { overdueTasks, dueTodayTasks, unfinishedTasks } = useMemo(() => {
        const userTasks = tasks.filter(task => task.assignees.includes(currentUser) && task.status !== TaskStatus.Done);
        
        const overdue = userTasks
            .filter(task => task.deadline < todayString)
            .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

        const today = userTasks
            .filter(task => task.deadline === todayString);
            
        return { overdueTasks: overdue, dueTodayTasks: today, unfinishedTasks: userTasks };
    }, [tasks, currentUser, todayString]);

    const handleGetSuggestions = async () => {
        setIsLoading(true);
        const suggestedIds = await getTaskSuggestionsForMyDay(unfinishedTasks);
        const suggested = unfinishedTasks.filter(task => suggestedIds.includes(task.id));
        setSuggestedTasks(suggested);
        setIsLoading(false);
    };
    
    const handleQuickAdd = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (!quickTaskName.trim()) return;

        const newTask: Omit<Task, 'id'> = {
            name: quickTaskName.trim(),
            assignees: [currentUser],
            project: projects[0] || 'General',
            workType: WorkType.Adhoc,
            status: TaskStatus.Todo,
            priority: Priority.TrungBinh,
            points: 3,
            impact: 2,
            startDate: todayString,
            deadline: todayString,
            adhocOrigin: AdhocOrigin.Khac,
            review_required: false,
            reviewStatus: ReviewStatus.NotRequired,
            approvalStatus: ApprovalStatus.NotApplicable,
        };

        onAddTask(newTask, [], () => {
             setQuickTaskName('');
        });
    }, [quickTaskName, currentUser, projects, todayString, onAddTask]);


    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center">
                    <SunIcon className="h-8 w-8 text-amber-500 mr-4" />
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">My Day</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Chào {currentUser}, đây là những gì cần tập trung hôm nay.</p>
                    </div>
                </div>
                <button
                    onClick={handleGetSuggestions}
                    disabled={isLoading}
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
                >
                    <SparklesIcon className="h-5 w-5 mr-2" />
                    {isLoading ? 'Đang phân tích...' : 'Gợi ý cho hôm nay'}
                </button>
            </div>

            <div className="space-y-8">
                {/* AI Suggestions Section */}
                {(isLoading || suggestedTasks.length > 0) && (
                     <section>
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center"><SparklesIcon className="h-5 w-5 mr-2 text-primary-500"/> Gợi ý cho bạn</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {isLoading ? (
                                Array.from({length: 3}).map((_, i) => <div key={i} className="h-28 bg-white dark:bg-slate-800 rounded-lg animate-pulse"></div>)
                            ) : (
                                suggestedTasks.map(task => <TaskCard key={task.id} task={task} tag="Suggested" />)
                            )}
                        </div>
                    </section>
                )}

                {/* Due Today Section */}
                {dueTodayTasks.length > 0 && (
                     <section>
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">Đến hạn hôm nay</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {dueTodayTasks.map(task => <TaskCard key={task.id} task={task} tag="Due Today" />)}
                        </div>
                    </section>
                )}

                {/* Overdue Section */}
                {overdueTasks.length > 0 && (
                    <section>
                        <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-3">Quá hạn</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {overdueTasks.map(task => <TaskCard key={task.id} task={task} tag="Overdue" />)}
                        </div>
                    </section>
                )}
                
                {unfinishedTasks.length === 0 && suggestedTasks.length === 0 && !isLoading && (
                     <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                        <SunIcon className="mx-auto h-12 w-12 text-slate-400" />
                        <p className="mt-4 font-semibold text-slate-600 dark:text-slate-300">Không có công việc nào cần làm hôm nay!</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Tận hưởng một ngày tuyệt vời.</p>
                    </div>
                )}
            </div>
            
            <form onSubmit={handleQuickAdd} className="mt-8">
                <div className="relative">
                    <input
                        type="text"
                        value={quickTaskName}
                        onChange={(e) => setQuickTaskName(e.target.value)}
                        placeholder={`+ Thêm công việc cho hôm nay (gán cho ${currentUser})`}
                        className="w-full pl-4 pr-24 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition shadow-sm"
                    />
                    <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 text-sm font-semibold rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-slate-400" disabled={!quickTaskName.trim()}>
                        Thêm
                    </button>
                </div>
            </form>
        </div>
    );
};