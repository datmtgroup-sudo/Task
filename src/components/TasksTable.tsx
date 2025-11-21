
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Task, TaskStatus, Priority, ActionItem, MeetingNote, ActionItemStatus, ApprovalStatus, NoteHistoryEntry } from '../types';
import { 
    DocumentDuplicateIcon, 
    TrashIcon, 
    ChevronDownIcon,
    CheckCircleIcon,
    XCircleIcon,
    PaperAirplaneIcon,
    PlusIcon,
    UserIcon,
    CalendarIcon,
    ChatBubbleLeftEllipsisIcon,
    DotsVerticalIcon
} from './icons/IconComponents';
import { PRIORITY_OPTIONS, TASK_STATUS_OPTIONS } from '../constants';

interface TasksTableProps {
  tasks: Task[];
  actionItems: ActionItem[];
  meetingNotes: MeetingNote[];
  currentUser: string;
  assignees: string[];
  projects: string[]; 
  onAddProject?: (name: string) => void; // Callback to add new project
  onDeleteTask?: (taskId: string) => void;
  onUpdateTask?: (taskId:string, updates: Partial<Task>) => void;
  onUpdateActionItem?: (actionItemId: string, updates: Partial<ActionItem>) => void;
  onAddActionItem: (taskId: string) => void;
  onCloneTask?: (taskId: string) => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  selectedTaskIds: Set<string>;
  onToggleSelectTask: (taskId: string) => void;
  onToggleSelectAll: () => void;
  isAllSelected: boolean;
  isReadOnly?: boolean;
  recentlyCompletedTaskId?: string | null;
  onApprovalAction: (taskId: string, action: 'approve' | 'reject', comment?: string) => void;
  onAddComment: (taskId: string, content: string) => void;
}

// --- Helper Components ---

const AssigneeAvatar: React.FC<{ name: string, size?: 'sm' | 'xs' | 'md' }> = ({ name, size = 'sm' }) => {
    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2);
    let sizeClasses = 'h-7 w-7 text-xs';
    if (size === 'xs') sizeClasses = 'h-6 w-6 text-[10px]';
    if (size === 'md') sizeClasses = 'h-8 w-8 text-xs';

    return (
        <div title={name} className={`${sizeClasses} bg-slate-200 dark:bg-slate-600 rounded-full flex items-center justify-center font-bold text-slate-500 dark:text-slate-300 ring-2 ring-white dark:ring-slate-800 flex-shrink-0`}>
            {initials}
        </div>
    );
};

// Custom Multi-Select for Users
const MultiSelectUser: React.FC<{ 
    selected: string[]; 
    options: string[]; 
    onSave: (val: string[]) => void; 
    disabled?: boolean 
}> = ({ selected, options, onSave, disabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleUser = (user: string) => {
        const newSelected = selected.includes(user) 
            ? selected.filter(u => u !== user) 
            : [...selected, user];
        onSave(newSelected);
    };

    const displayUsers = selected.slice(0, 3);
    const remainder = selected.length - 3;

    return (
        <div className="relative" ref={wrapperRef}>
            <div 
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`flex -space-x-2 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity p-1 rounded ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
            >
                {selected.length === 0 ? (
                    <div className="h-7 w-7 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:border-primary-400 hover:text-primary-500">
                        <PlusIcon className="h-3 w-3"/>
                    </div>
                ) : (
                    <>
                        {displayUsers.map(name => <AssigneeAvatar key={name} name={name} size="sm" />)}
                        {remainder > 0 && (
                            <div className="flex items-center justify-center h-7 w-7 rounded-full ring-2 ring-white dark:ring-slate-800 bg-slate-100 dark:bg-slate-700 text-slate-500 font-medium text-[10px]">
                                +{remainder}
                            </div>
                        )}
                    </>
                )}
            </div>

            {isOpen && (
                <div className="absolute left-0 z-50 mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-2">
                    <div className="mb-2 px-2 py-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">Chọn người phụ trách</div>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                        {options.map(user => (
                            <div 
                                key={user} 
                                onClick={() => toggleUser(user)}
                                className={`flex items-center px-2 py-2 rounded-lg cursor-pointer transition-colors ${selected.includes(user) ? 'bg-primary-50 dark:bg-primary-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                            >
                                <div className={`w-4 h-4 mr-3 rounded border flex items-center justify-center transition-colors ${selected.includes(user) ? 'bg-primary-600 border-primary-600' : 'border-slate-300 dark:border-slate-500'}`}>
                                    {selected.includes(user) && <CheckCircleIcon className="h-3 w-3 text-white" />}
                                </div>
                                <AssigneeAvatar name={user} size="xs" />
                                <span className="ml-2 text-sm text-slate-700 dark:text-slate-200">{user}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// Project Select with Create capability
const ProjectSelect: React.FC<{
    value: string;
    options: string[];
    onSave: (val: string) => void;
    disabled?: boolean;
    placeholder?: string;
    onAddProject?: (val: string) => void;
}> = ({ value, options, onSave, disabled, placeholder, onAddProject }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [filter, setFilter] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredOptions = options.filter(o => o.toLowerCase().includes(filter.toLowerCase()));
    const showCreate = filter && !options.some(o => o.toLowerCase() === filter.toLowerCase());

    return (
        <div className="relative" ref={wrapperRef}>
             <div 
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 px-1.5 py-1 rounded text-xs truncate ${!value ? 'text-slate-400 italic' : 'text-slate-600 dark:text-slate-300'} ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
            >
                {value || placeholder || 'Chọn dự án'}
            </div>
            {isOpen && (
                <div className="absolute z-50 mt-1 w-56 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 p-2 left-0">
                    <input 
                        autoFocus
                        type="text" 
                        className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded focus:ring-1 focus:ring-primary-500 mb-2"
                        placeholder="Tìm hoặc thêm dự án..."
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                    />
                    <div className="max-h-48 overflow-y-auto space-y-0.5">
                        {filteredOptions.map(opt => (
                             <div key={opt} onClick={() => { onSave(opt); setIsOpen(false); setFilter(''); }} className="px-2 py-1.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer rounded text-slate-700 dark:text-slate-200">
                                {opt}
                             </div>
                        ))}
                        {showCreate && (
                             <div onClick={() => { 
                                 onSave(filter); 
                                 if(onAddProject) onAddProject(filter);
                                 setIsOpen(false); 
                                 setFilter(''); 
                             }} className="px-2 py-1.5 text-xs text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 cursor-pointer rounded font-medium border-t border-slate-100 dark:border-slate-700 mt-1 flex items-center">
                                <PlusIcon className="h-3 w-3 mr-1"/> Tạo "{filter}"
                             </div>
                        )}
                        {filteredOptions.length === 0 && !showCreate && (
                            <div className="px-2 py-1.5 text-xs text-slate-400 italic">Không tìm thấy dự án.</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

const InlineEditField: React.FC<{
    value: any; 
    onSave: (val: any) => void; 
    type?: 'text' | 'number' | 'date' | 'select' | 'textarea'; 
    options?: string[]; 
    disabled?: boolean; 
    className?: string; 
    children?: React.ReactNode; 
    placeholder?: string
}> = ({ value, onSave, type = 'text', options = [], disabled = false, className = '', children, placeholder }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [currentValue, setCurrentValue] = useState(value);
    const inputRef = useRef<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(null);

    useEffect(() => { setCurrentValue(value); }, [value]);
    
    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    const commitChange = () => { 
        setIsEditing(false); 
        if (currentValue != value) onSave(currentValue); 
    };

    const handleKeyDown = (e: React.KeyboardEvent) => { 
        if (e.key === 'Enter' && type !== 'textarea') commitChange(); 
        if (e.key === 'Escape') { setCurrentValue(value); setIsEditing(false); }
    };

    if (disabled) return <div className={`opacity-80 cursor-not-allowed truncate ${className}`}>{children || value}</div>;

    if (isEditing) {
        const commonClasses = "w-full p-1.5 text-xs bg-white dark:bg-slate-800 border border-primary-500 rounded shadow-sm focus:outline-none z-20 relative";
        if (type === 'select') {
            return (
                <select 
                    ref={inputRef as any}
                    value={currentValue} 
                    onChange={(e) => { setCurrentValue(e.target.value); onSave(e.target.value); setIsEditing(false); }} 
                    onBlur={() => setIsEditing(false)} 
                    className={commonClasses}
                >
                    {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
            );
        }
        if (type === 'textarea') {
             return <textarea ref={inputRef as any} value={currentValue} onChange={(e) => setCurrentValue(e.target.value)} onBlur={commitChange} className={commonClasses} rows={3} placeholder={placeholder} />
        }
        return <input ref={inputRef as any} type={type} value={currentValue} onChange={(e) => setCurrentValue(e.target.value)} onBlur={commitChange} onKeyDown={handleKeyDown} className={commonClasses} placeholder={placeholder} />;
    }

    return (
        <div 
            onClick={() => setIsEditing(true)} 
            className={`cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded px-1.5 py-1 -ml-1.5 transition-colors duration-150 min-h-[24px] flex items-center ${className}`} 
            title="Click to edit"
        >
            {children || (value ? String(value) : <span className="text-slate-400 italic text-xs">{placeholder || 'Empty'}</span>)}
        </div>
    );
};

const ApprovalStatusChip: React.FC<{ status: ApprovalStatus, isApprover: boolean, onAction: (action: 'approve' | 'reject') => void }> = ({ status, isApprover, onAction }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    let badgeClass = "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400";
    let label = "—";
    
    if (status === ApprovalStatus.Pending) {
        badgeClass = "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 ring-1 ring-yellow-400/50";
        label = "CHỜ DUYỆT";
    }
    if (status === ApprovalStatus.Approved) {
        badgeClass = "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
        label = "ĐÃ DUYỆT";
    }
    if (status === ApprovalStatus.Rejected) {
        badgeClass = "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
        label = "YÊU CẦU SỬA";
    }

    const canAct = isApprover && status === ApprovalStatus.Pending;

    return (
        <div className="relative inline-block" ref={wrapperRef}>
             <button 
                onClick={(e) => { e.stopPropagation(); canAct && setIsOpen(!isOpen); }}
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase whitespace-nowrap transition-opacity ${badgeClass} ${canAct ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
            >
                {label}
            </button>
            {isOpen && (
                <div className="absolute right-0 z-50 mt-1 w-48 bg-white dark:bg-slate-800 shadow-xl rounded-lg py-1 ring-1 ring-black ring-opacity-5 focus:outline-none border border-slate-100 dark:border-slate-700">
                    <div className="px-4 py-2 text-xs text-slate-500 border-b border-slate-100 dark:border-slate-700 uppercase font-bold">
                        Xử lý duyệt
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); onAction('approve'); setIsOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 dark:hover:bg-slate-700/50 flex items-center">
                        <CheckCircleIcon className="h-4 w-4 mr-2"/> Duyệt task
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onAction('reject'); setIsOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-slate-700/50 flex items-center">
                        <XCircleIcon className="h-4 w-4 mr-2"/> Yêu cầu chỉnh sửa
                    </button>
                </div>
            )}
        </div>
    )
}

const ExpandedRowPanel: React.FC<{
    task: Task;
    actionItems: ActionItem[];
    currentUser: string;
    assignees: string[];
    projects: string[];
    onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
    onUpdateActionItem: (id: string, updates: Partial<ActionItem>) => void;
    onAddActionItem: (taskId: string) => void;
    onApprovalAction: (action: 'approve' | 'reject', comment?: string) => void;
    onAddComment: (content: string) => void;
    onAddProject?: (name: string) => void;
}> = ({ task, actionItems, currentUser, assignees, projects, onUpdateTask, onUpdateActionItem, onAddActionItem, onApprovalAction, onAddComment, onAddProject }) => {
    
    const [commentText, setCommentText] = useState('');
    const isApprover = currentUser === task.approver || currentUser === 'Admin'; 
    const isLocked = task.approvalStatus === ApprovalStatus.Approved;
    const doneActionItems = actionItems.filter(ai => ai.status === ActionItemStatus.Done).length;

    const handleCommentSubmit = () => {
        if(!commentText.trim()) return;
        onAddComment(commentText);
        setCommentText('');
    }

    return (
        <div className="p-6 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-700 shadow-inner grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
            {/* LEFT COLUMN */}
            <div className="lg:col-span-7 space-y-6">
                {/* Description */}
                <div className="group">
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-1 flex items-center">Mô tả công việc</h4>
                    <InlineEditField 
                        type="textarea" 
                        value={task.description || ''} 
                        onSave={(v) => onUpdateTask(task.id, { description: v })} 
                        disabled={isLocked}
                        placeholder="Mô tả chi tiết mục tiêu, phạm vi, yêu cầu của công việc này..."
                        className="w-full text-sm text-slate-700 dark:text-slate-300"
                    />
                </div>

                 {/* Progress Note */}
                 <div className="group">
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-1 flex items-center">Ghi chú tiến độ (kỳ hiện tại)</h4>
                    <InlineEditField 
                        type="textarea" 
                        value={task.currentStatusNote || ''} 
                        onSave={(v) => onUpdateTask(task.id, { currentStatusNote: v })} 
                        placeholder="Ghi nhanh những gì đã làm, đang vướng, bước tiếp theo..."
                        className="w-full text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md p-2 min-h-[60px]"
                    />
                    <p className="mt-1 text-[10px] text-slate-400 italic">Nội dung này sẽ được lưu vào ‘Kết quả cuối cùng’ và tự xóa vào Thứ 7 hằng tuần.</p>
                </div>

                {/* Final Result Log */}
                <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Kết quả cuối cùng {isLocked && <span className="text-green-600 ml-2 normal-case bg-green-50 px-1.5 rounded text-[10px]">Đã chốt kết quả</span>}</h4>
                    <div className="w-full p-3 bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm min-h-[100px] max-h-[200px] overflow-y-auto space-y-2 custom-scrollbar">
                        {task.noteHistory && task.noteHistory.length > 0 ? (
                            [...task.noteHistory].reverse().map((entry, idx) => (
                                <div key={idx} className="text-slate-700 dark:text-slate-300 text-xs border-b border-slate-200 dark:border-slate-700/50 pb-2 last:border-0">
                                    <div className="font-mono text-[10px] text-slate-500 mb-0.5">{new Date(entry.date).toLocaleString('vi-VN')}</div>
                                    <div className="whitespace-pre-wrap">{entry.note}</div>
                                </div>
                            ))
                        ) : (
                            <span className="text-slate-400 italic text-xs">Chưa có ghi nhận kết quả.</span>
                        )}
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="lg:col-span-5 space-y-6">
                
                {/* Approval Block */}
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="text-xs font-bold text-slate-400 uppercase">Trạng thái duyệt</h4>
                        <ApprovalStatusChip status={task.approvalStatus} isApprover={false} onAction={() => {}} />
                    </div>
                    
                    {task.approved_at && (
                        <div className="text-xs text-slate-500 mb-3 p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-100 dark:border-green-800/50 flex items-start">
                            <CheckCircleIcon className="h-4 w-4 text-green-600 mr-1.5 mt-0.5"/>
                            <div>
                                Duyệt bởi <strong>{task.approved_by}</strong><br/>
                                <span className="opacity-75">{new Date(task.approved_at).toLocaleString('vi-VN')}</span>
                            </div>
                        </div>
                    )}

                    {isApprover && task.approvalStatus === ApprovalStatus.Pending && (
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => {
                                if(confirm('Xác nhận duyệt task này?')) onApprovalAction('approve');
                            }} className="flex justify-center items-center py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm">
                                <CheckCircleIcon className="h-4 w-4 mr-1"/> Duyệt task
                            </button>
                            <button onClick={() => {
                                const reason = prompt("Vui lòng mô tả rõ nội dung cần chỉnh sửa:");
                                if(reason) onApprovalAction('reject', reason);
                            }} className="flex justify-center items-center py-2 bg-white dark:bg-slate-700 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 text-xs font-bold rounded-lg transition-colors shadow-sm">
                                <XCircleIcon className="h-4 w-4 mr-1"/> Yêu cầu sửa
                            </button>
                        </div>
                    )}
                </div>

                {/* Action Items (Subtasks) */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="text-xs font-bold text-slate-400 uppercase">Action Items ({doneActionItems}/{actionItems.length})</h4>
                        {!isLocked && (
                            <button onClick={() => onAddActionItem(task.id)} className="text-xs text-primary-600 hover:text-primary-700 font-semibold flex items-center px-2 py-1 rounded hover:bg-primary-50 dark:hover:bg-primary-900/20">
                                <PlusIcon className="h-3 w-3 mr-1"/> Thêm
                            </button>
                        )}
                    </div>
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                        {actionItems.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500">
                                        <tr>
                                            <th className="w-8 p-2"></th>
                                            <th className="p-2 text-left font-semibold min-w-[120px]">Tên Action Item</th>
                                            <th className="p-2 text-left font-semibold w-28">Dự án</th>
                                            <th className="p-2 text-left font-semibold w-24">Phụ trách</th>
                                            <th className="p-2 text-right font-semibold w-24">Deadline</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                        {actionItems.map(item => (
                                            <tr key={item.id} className="group hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                                <td className="p-2 text-center align-top pt-3">
                                                    <input type="checkbox" checked={item.status === ActionItemStatus.Done} onChange={() => !isLocked && onUpdateActionItem(item.id, { status: item.status === ActionItemStatus.Done ? ActionItemStatus.Todo : ActionItemStatus.Done })} disabled={isLocked} className="h-3.5 w-3.5 rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
                                                </td>
                                                <td className="p-2 align-top">
                                                    <InlineEditField 
                                                        value={item.description} 
                                                        onSave={(v) => onUpdateActionItem(item.id, { description: v })} 
                                                        disabled={isLocked}
                                                        className={`${item.status === ActionItemStatus.Done ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}
                                                    />
                                                </td>
                                                <td className="p-2 align-top">
                                                     <ProjectSelect value={item.project || ''} options={projects} onSave={(v) => onUpdateActionItem(item.id, { project: v })} onAddProject={onAddProject} disabled={isLocked} placeholder="--"/>
                                                </td>
                                                <td className="p-2 align-top">
                                                    <MultiSelectUser selected={item.owners} options={assignees} onSave={(val) => onUpdateActionItem(item.id, { owners: val })} disabled={isLocked} />
                                                </td>
                                                <td className="p-2 align-top text-right">
                                                    <div className="flex flex-col items-end gap-0.5">
                                                        <InlineEditField type="date" value={item.dueDate} onSave={(v) => onUpdateActionItem(item.id, { dueDate: v })} disabled={isLocked} />
                                                        {item.points !== undefined && (
                                                            <div className="flex items-center text-[10px] text-slate-400">
                                                                <InlineEditField type="number" value={item.points} onSave={(v) => onUpdateActionItem(item.id, { points: Number(v) })} disabled={isLocked} className="font-bold" /> pts
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="p-4 text-center text-xs text-slate-400 italic">Chưa có action item nào.</div>
                        )}
                    </div>
                </div>

                {/* Comments */}
                <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Bình luận & Trao đổi</h4>
                    <div className="space-y-3 max-h-48 overflow-y-auto mb-3 pr-1 custom-scrollbar">
                        {task.comments?.map(comment => (
                            <div key={comment.id} className="flex gap-2 text-xs">
                                <div className="h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center font-bold text-slate-500 dark:text-slate-300 flex-shrink-0 text-[10px]">
                                    {comment.author.substring(0,2)}
                                </div>
                                <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold text-slate-700 dark:text-slate-200">{comment.author}</span>
                                        <span className="text-[10px] text-slate-400">{new Date(comment.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    </div>
                                    <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                                        {comment.content.split(/(@[\w\s\p{L}]+)/u).map((part, i) => 
                                            part.startsWith('@') ? <span key={i} className="text-primary-600 dark:text-primary-400 font-semibold">{part}</span> : part
                                        )}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="relative">
                        <input 
                            type="text" 
                            value={commentText}
                            onChange={e => setCommentText(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleCommentSubmit()}
                            placeholder="Viết bình luận, dùng @ để tag..." 
                            className="w-full pl-3 pr-9 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                         <button onClick={handleCommentSubmit} className="absolute right-1.5 top-1.5 p-1 text-primary-500 hover:text-primary-600 rounded-full hover:bg-primary-50 dark:hover:bg-primary-900/20">
                             <PaperAirplaneIcon className="h-4 w-4" />
                         </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

const statusConfig: Record<string, { name: string; classes: string }> = {
    [TaskStatus.Todo]: { name: 'Todo', classes: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300' },
    [TaskStatus.Doing]: { name: 'Đang làm', classes: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300' },
    [TaskStatus.PendingReview]: { name: 'Đang duyệt', classes: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300' },
    [TaskStatus.Done]: { name: 'Hoàn thành', classes: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300' },
    [TaskStatus.Defer]: { name: 'Tạm hoãn', classes: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300' },
    'Overdue': { name: 'Quá hạn', classes: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300' },
};

export const TasksTable: React.FC<TasksTableProps> = (props) => {
  const { tasks, recentlyCompletedTaskId, selectedTaskIds, onToggleSelectTask, onToggleSelectAll, isAllSelected, onCloneTask, onDeleteTask, onUpdateTask, assignees, projects, onAddProject, actionItems, currentUser, onUpdateActionItem, onAddActionItem, onApprovalAction, onAddComment } = props;

  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(new Set());

  const handleUpdate = (taskId: string, updates: Partial<Task>) => {
      onUpdateTask?.(taskId, updates);
  }
  
  const toggleExpand = (taskId: string) => {
      setExpandedTaskIds(prev => {
          const newSet = new Set(prev);
          if (newSet.has(taskId)) newSet.delete(taskId);
          else newSet.add(taskId);
          return newSet;
      });
  }

  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Danh sách Task ({tasks.length})</h2>
            <div className="text-xs text-slate-400 italic">💡 Click vào mũi tên để xem chi tiết & duyệt. Click vào ô để sửa nhanh.</div>
        </div>
        
        <div className="overflow-x-auto min-h-[400px]">
            <table className="min-w-full text-sm text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
                    <tr>
                        <th className="w-10 px-2 py-3 text-center"></th>
                        <th className="w-8 px-2 py-3 text-center"><input type="checkbox" className="rounded border-slate-300 text-primary-600 focus:ring-primary-500" checked={isAllSelected} onChange={onToggleSelectAll} /></th>
                        <th className="px-3 py-3 min-w-[220px]">Công việc</th>
                        <th className="px-2 py-3 w-32">Trạng thái</th>
                        <th className="px-2 py-3 w-28">Phụ trách</th>
                        <th className="px-2 py-3 w-28">Dự án</th>
                        <th className="px-2 py-3 w-24">Duyệt</th>
                        <th className="px-2 py-3 w-24">Ưu tiên</th>
                        <th className="px-2 py-3 w-24 text-right">Hạn / Điểm</th>
                        <th className="px-2 py-3 w-10"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {tasks.map((task) => {
                        const isSelected = selectedTaskIds.has(task.id);
                        const isExpanded = expandedTaskIds.has(task.id);
                        const isOverdue = new Date(task.deadline) < today && task.status !== TaskStatus.Done;
                        const isDone = task.status === TaskStatus.Done;
                        const isApprover = currentUser === task.approver || currentUser === 'Admin';
                        
                        let rowClasses = "group transition-colors duration-200 hover:bg-slate-50 dark:hover:bg-slate-700/30";
                        if (isSelected) rowClasses = "bg-primary-50 dark:bg-primary-900/20";
                        if (recentlyCompletedTaskId === task.id) rowClasses += " animate-highlight-light dark:animate-highlight-dark";
                        if (isExpanded) rowClasses += " bg-slate-50 dark:bg-slate-800/60 border-b-0";

                        return (
                            <React.Fragment key={task.id}>
                                <tr className={rowClasses}>
                                    <td className="px-2 py-3 text-center cursor-pointer" onClick={() => toggleExpand(task.id)}>
                                        <ChevronDownIcon className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isExpanded ? '' : '-rotate-90'}`} />
                                    </td>
                                    <td className="px-2 py-3 text-center">
                                        <input type="checkbox" className="rounded border-slate-300 text-primary-600 focus:ring-primary-500" checked={isSelected} onChange={() => onToggleSelectTask(task.id)} />
                                    </td>
                                    <td className="px-3 py-3">
                                        <div className="flex flex-col">
                                            <InlineEditField value={task.name} onSave={(v) => handleUpdate(task.id, { name: v })} disabled={isDone} className={`font-semibold ${isDone ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-100'}`} />
                                        </div>
                                    </td>
                                    <td className="px-2 py-3">
                                        <InlineEditField type="select" options={TASK_STATUS_OPTIONS} value={task.status} onSave={(v) => props.onStatusChange(task.id, v)}>
                                             <span className={`px-2 py-0.5 inline-flex text-[10px] font-bold uppercase rounded-full leading-4 ${isOverdue ? statusConfig['Overdue'].classes : statusConfig[task.status]?.classes}`}>{isOverdue ? 'Quá hạn' : task.status}</span>
                                        </InlineEditField>
                                    </td>
                                    <td className="px-2 py-3">
                                        <MultiSelectUser selected={task.assignees} options={assignees} onSave={(v) => handleUpdate(task.id, { assignees: v })} disabled={isDone} />
                                    </td>
                                    <td className="px-2 py-3">
                                        <ProjectSelect value={task.project} options={projects} onSave={(v) => handleUpdate(task.id, { project: v })} onAddProject={onAddProject} disabled={isDone} />
                                    </td>
                                    <td className="px-2 py-3">
                                        <ApprovalStatusChip 
                                            status={task.approvalStatus || ApprovalStatus.NotApplicable} 
                                            isApprover={isApprover} 
                                            onAction={(action) => onApprovalAction(task.id, action)}
                                        />
                                    </td>
                                    <td className="px-2 py-3">
                                        <InlineEditField type="select" options={PRIORITY_OPTIONS} value={task.priority} onSave={(v) => handleUpdate(task.id, { priority: v })} disabled={isDone}>
                                            <span className={`px-2 py-0.5 inline-flex text-[10px] font-semibold rounded border ${task.priority === Priority.KhanCap ? 'border-red-200 bg-red-50 text-red-700' : 'border-slate-200 bg-white text-slate-600'}`}>{task.priority}</span>
                                        </InlineEditField>
                                    </td>
                                    <td className="px-2 py-3 text-right">
                                        <div className="flex flex-col items-end gap-0.5">
                                            <InlineEditField type="date" value={task.deadline} onSave={(v) => handleUpdate(task.id, { deadline: v })} disabled={isDone} className={`text-xs font-medium ${isOverdue ? 'text-red-600' : 'text-slate-600 dark:text-slate-300'}`} />
                                            <div className="flex items-center justify-end text-[10px] text-slate-400">
                                                <InlineEditField type="number" value={task.points} onSave={(v) => handleUpdate(task.id, { points: Number(v) })} disabled={isDone} className="mr-1 font-bold text-slate-500" />
                                                pts
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-2 py-3 text-right relative">
                                         <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end gap-1">
                                            <div className="relative group/menu">
                                                <button className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-400"><DotsVerticalIcon className="h-4 w-4"/></button>
                                                <div className="absolute right-0 top-6 w-32 bg-white dark:bg-slate-800 shadow-lg rounded-lg border border-slate-200 dark:border-slate-700 py-1 z-50 hidden group-hover/menu:block">
                                                    {onCloneTask && <button onClick={() => onCloneTask(task.id)} className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center text-slate-700 dark:text-slate-200"><DocumentDuplicateIcon className="h-3 w-3 mr-2"/> Nhân bản</button>}
                                                    {onDeleteTask && <button onClick={() => onDeleteTask(task.id)} className="w-full text-left px-3 py-1.5 text-xs hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center text-red-600"><TrashIcon className="h-3 w-3 mr-2"/> Xóa</button>}
                                                </div>
                                            </div>
                                         </div>
                                    </td>
                                </tr>
                                {isExpanded && (
                                    <tr>
                                        <td colSpan={11} className="p-0 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20">
                                            <ExpandedRowPanel 
                                                task={task}
                                                actionItems={actionItems.filter(ai => ai.taskId === task.id)}
                                                assignees={assignees}
                                                currentUser={currentUser}
                                                projects={projects}
                                                onUpdateTask={handleUpdate}
                                                onUpdateActionItem={onUpdateActionItem!}
                                                onAddActionItem={onAddActionItem}
                                                onApprovalAction={(action, comment) => onApprovalAction(task.id, action, comment)}
                                                onAddComment={(content) => onAddComment(task.id, content)}
                                                onAddProject={onAddProject}
                                            />
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        );
                    })}
                </tbody>
            </table>
        </div>
        <style>{`
            .custom-scrollbar::-webkit-scrollbar {
                width: 6px;
                height: 6px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
                background: transparent;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
                background-color: rgba(156, 163, 175, 0.5);
                border-radius: 3px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background-color: rgba(156, 163, 175, 0.8);
            }
             @keyframes fade-in {
              from { opacity: 0; transform: translateY(-5px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .animate-fade-in {
              animation: fade-in 0.2s ease-out forwards;
            }
        `}</style>
    </div>
  );
};
