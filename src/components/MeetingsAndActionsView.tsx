import React, { useState } from 'react';
import { ActionItem, MeetingNote, Task, ActionItemStatus } from '../types';
import { ClipboardListIcon, UserIcon } from './icons/IconComponents';

interface MeetingsAndActionsViewProps {
    actionItems: ActionItem[];
    meetingNotes: MeetingNote[];
    tasks: Task[];
    assignees: string[];
    // THÊM DÒNG NÀY ĐỂ SỬA LỖI:
    onUpdateActionItem?: (actionItemId: string, updates: Partial<ActionItem>) => void;
}

const statusClasses: Record<ActionItemStatus, string> = {
    [ActionItemStatus.Todo]: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
    [ActionItemStatus.Doing]: 'bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-blue-200',
    [ActionItemStatus.Done]: 'bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-200',
    [ActionItemStatus.Blocked]: 'bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-200',
    [ActionItemStatus.Defer]: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700 dark:text-yellow-200',
};

export const MeetingsAndActionsView: React.FC<MeetingsAndActionsViewProps> = ({ actionItems, meetingNotes, tasks, assignees, onUpdateActionItem }) => {
    
    const getTaskNameById = (taskId: string) => tasks.find(t => t.id === taskId)?.name || 'N/A';
    const getMeetingTitleById = (noteId?: string) => noteId ? meetingNotes.find(n => n.id === noteId)?.title || 'N/A' : 'N/A';
    
    return (
        <div className="space-y-8">
            {/* Meeting Notes Section */}
            <div>
                <div className="flex items-center mb-4">
                    <ClipboardListIcon className="h-6 w-6 text-primary-500 mr-3" />
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Ghi chú cuộc họp</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {meetingNotes.map(note => (
                        <div key={note.id} className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                            <h3 className="font-semibold text-slate-800 dark:text-slate-100">{note.title}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{new Date(note.date).toLocaleDateString('vi-VN')}</p>
                            <p className="text-sm mt-2 text-slate-600 dark:text-slate-300 line-clamp-3">{note.content}</p>
                            <div className="mt-3 text-xs text-slate-500">
                                <span className="font-medium">Tham gia:</span> {note.attendees.join(', ')}
                            </div>
                        </div>
                    ))}
                     <button className="h-full min-h-[150px] text-center flex flex-col items-center justify-center py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition">
                        + Thêm ghi chú mới
                    </button>
                </div>
            </div>

            {/* Action Items Section */}
            <div>
                <div className="flex items-center mb-4">
                    <UserIcon className="h-6 w-6 text-primary-500 mr-3" />
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Danh sách Action Items</h2>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                            <thead className="bg-slate-50 dark:bg-slate-700">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Mô tả</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Phụ trách</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Hạn chót</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Trạng thái</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Liên kết</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                                {actionItems.map(item => (
                                    <tr key={item.id}>
                                        <td className="px-6 py-4 whitespace-normal text-sm font-medium text-slate-900 dark:text-white">{item.description}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">{item.owners.join(', ')}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">
                                            <input 
                                                type="date" 
                                                value={item.dueDate || ''} 
                                                onChange={(e) => onUpdateActionItem && onUpdateActionItem(item.id, { dueDate: e.target.value })}
                                                className="bg-transparent border border-slate-200 dark:border-slate-600 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClasses[item.status]}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-normal text-sm text-slate-500 dark:text-slate-400">
                                            <div className="font-semibold text-slate-600 dark:text-slate-300">{getTaskNameById(item.taskId)}</div>
                                            {item.meetingNoteId && <div className="text-xs">{getMeetingTitleById(item.meetingNoteId)}</div>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};