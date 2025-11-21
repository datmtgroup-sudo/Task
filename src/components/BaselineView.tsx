import React, { useState } from 'react';
import { Baseline, ActionItem, MeetingNote, TaskStatus } from '../types';
import { TasksTable } from './TasksTable';
import { BaselineIcon } from './icons/IconComponents';

interface BaselineViewProps {
    baselines: Baseline[];
    actionItems: ActionItem[];
    meetingNotes: MeetingNote[];
    currentUser: string;
    onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
    onReviewAction: (taskId: string, action: 'approve' | 'reject', comment?: string) => void;
}

export const BaselineView: React.FC<BaselineViewProps> = ({ baselines, actionItems, meetingNotes, currentUser, onStatusChange, onReviewAction }) => {
    // Default to the most recent baseline if it exists
    const [selectedPeriod, setSelectedPeriod] = useState<string | null>(
        baselines.length > 0 ? baselines[baselines.length - 1].periodName : null
    );

    const selectedBaseline = baselines.find(b => b.periodName === selectedPeriod);
    const sortedBaselines = [...baselines].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return (
        <div className="space-y-6">
            <div className="flex items-center">
                <BaselineIcon className="h-6 w-6 text-primary-500 mr-3" />
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Xem lại Baseline Kế hoạch</h2>
            </div>

            <div className="bg-white dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                <label htmlFor="baseline-select" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Chọn kỳ để xem lại:</label>
                <select
                    id="baseline-select"
                    value={selectedPeriod || ''}
                    onChange={e => setSelectedPeriod(e.target.value)}
                    className="w-full md:w-1/3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                    {sortedBaselines.map(b => (
                        <option key={b.id} value={b.periodName}>
                            {b.periodName} (Lưu lúc: {new Date(b.createdAt).toLocaleDateString('vi-VN')})
                        </option>
                    ))}
                </select>
            </div>
            
            {selectedBaseline ? (
                <TasksTable 
                    tasks={selectedBaseline.tasks} 
                    isReadOnly={true}
                    actionItems={[]}
                    meetingNotes={[]}
                    currentUser={currentUser}
                    onStatusChange={onStatusChange}
                    onReviewAction={onReviewAction}
                    // FIX: Provide required props for bulk actions. Since this table is read-only, these can be dummy values.
                    selectedTaskIds={new Set()}
                    onToggleSelectTask={() => {}}
                    onToggleSelectAll={() => {}}
                    isAllSelected={false}
                />
            ) : (
                <div className="text-center py-10 bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
                    <p className="text-slate-500 dark:text-slate-400">Chưa có baseline nào được lưu. Hãy "Bắt đầu kỳ mới" để tạo một baseline.</p>
                </div>
            )}
        </div>
    );
};