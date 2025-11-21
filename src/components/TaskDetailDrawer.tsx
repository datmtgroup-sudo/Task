import React, { useState, useEffect, useRef } from 'react';
import { Task, TaskStatus, ActionItem, ActionItemStatus, ApprovalStatus, Comment } from '../types';
import { 
    XMarkIcon, 
    TrashIcon,
    DocumentDuplicateIcon,
    ChevronDownIcon,
    CheckCircleIcon,
    ArrowPathIcon,
    ChatBubbleLeftEllipsisIcon,
    PaperAirplaneIcon,
    UserIcon,
    XCircleIcon
} from './icons/IconComponents';
import { TASK_STATUS_OPTIONS, PRIORITY_OPTIONS, POINT_OPTIONS } from '../constants';

interface TaskDetailDrawerProps {
    isOpen: boolean;
    task: Task | null;
    actionItems: ActionItem[];
    assignees: string[];
    currentUser?: string;
    onClose: () => void;
    onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
    onUpdateActionItem: (actionItemId: string, updates: Partial<ActionItem>) => void;
    onAddActionItem: (taskId: string) => void;
    onDeleteTask: (taskId: string) => void;
    onCloneTask?: (taskId: string) => void;
    onAddComment: (taskId: string, content: string) => void;
    onApprovalAction: (taskId: string, action: 'approve' | 'reject', comment?: string) => void;
}

const SectionHeader: React.FC<{ title: string; icon?: React.ReactNode }> = ({ title, icon }) => (
    <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2 mt-6 first:mt-0">
        {icon} {title}
    </h3>
);

const CommentItem: React.FC<{ comment: Comment }> = ({ comment }) => (
    <div className="flex gap-3 group">
        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-200">
            {comment.author.substring(0,2)}
        </div>
        <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl rounded-tl-none border border-slate-100 dark:border-slate-700/50">
            <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{comment.author}</span>
                <span className="text-[10px] text-slate-400">{new Date(comment.timestamp).toLocaleString('vi-VN')}</span>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                {comment.content.split(/(@[\w\s\p{L}]+)/u).map((part, i) => 
                    part.startsWith('@') 
                    ? <span key={i} className="text-primary-600 dark:text-primary-400 font-semibold bg-primary-50 dark:bg-primary-900/20 px-1 rounded">{part}</span> 
                    : part
                )}
            </p>
        </div>
    </div>
);

const ApprovalStatusBadge: React.FC<{ status: ApprovalStatus }> = ({ status }) => {
    let colorClass = 'bg-slate-100 text-slate-600';
    if (status === ApprovalStatus.Pending) colorClass = 'bg-yellow-100 text-yellow-700';
    if (status === ApprovalStatus.Approved) colorClass = 'bg-green-100 text-green-700';
    if (status === ApprovalStatus.Rejected) colorClass = 'bg-red-100 text-red-700';

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${colorClass}`}>
            {status}
        </span>
    );
};

const DrawerMultiSelect: React.FC<{ label: string; value: string[]; options: string[]; onSave: (val: string[]) => void; disabled?: boolean }> = ({ label, value, options, onSave, disabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    const toggleOption = (option: string) => {
        const newValue = value.includes(option) ? value.filter(v => v !== option) : [...value, option];
        onSave(newValue);
    };
    return (
        <div className="group relative" ref={wrapperRef}>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{label}</label>
            <div className={`w-full min-h-[38px] bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex flex-wrap gap-1.5 ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`} onClick={() => !disabled && setIsOpen(!isOpen)}>
                {value.length === 0 && <span className="text-slate-400 text-sm">Chọn người...</span>}
                {value.map(assignee => <span key={assignee} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 shadow-sm">{assignee}</span>)}
                <div className="absolute right-2 top-2.5 pointer-events-none text-slate-400"><ChevronDownIcon className="h-4 w-4" /></div>
            </div>
            {isOpen && (
                <div className="absolute z-50 mt-1 w-full bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 max-h-60 overflow-y-auto">
                    {options.map(option => (
                        <div key={option} onClick={() => toggleOption(option)} className="flex items-center px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer">
                            <div className={`w-4 h-4 rounded border mr-3 flex items-center justify-center ${value.includes(option) ? 'bg-primary-600 border-primary-600' : 'border-slate-300'}`}>{value.includes(option) && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}</div>{option}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const InlineSelect: React.FC<{ label: string; value: string | number; options: string[] | number[]; onSave: (val: any) => void; disabled?: boolean }> = ({ label, value, options, onSave, disabled }) => (
    <div className="group relative">
        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{label}</label>
        <div className="relative">
            <select value={value} onChange={(e) => onSave(e.target.value)} disabled={disabled} className={`w-full appearance-none bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}>
                {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-500"><ChevronDownIcon className="w-4 h-4" /></div>
        </div>
    </div>
);

export const TaskDetailDrawer: React.FC<TaskDetailDrawerProps> = (props) => {
    const { isOpen, task, actionItems, assignees, onClose, onUpdateTask, onUpdateActionItem, onAddActionItem, onDeleteTask, onCloneTask, currentUser, onAddComment, onApprovalAction } = props;
    
    const [commentText, setCommentText] = useState('');
    const [showMentions, setShowMentions] = useState(false);
    const [mentionQuery, setMentionQuery] = useState('');
    const commentInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen || !task) return null;

    const isDone = task.status === TaskStatus.Done;
    const isLocked = task.approvalStatus === ApprovalStatus.Approved;
    const doneActionItems = actionItems.filter(ai => ai.status === ActionItemStatus.Done).length;
    const isApprover = currentUser && (task.approver === currentUser || currentUser === 'Admin');

    const handleCommentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setCommentText(val);
        const lastWord = val.split(/\s+/).pop();
        if (lastWord && lastWord.startsWith('@')) {
            setShowMentions(true);
            setMentionQuery(lastWord.substring(1).toLowerCase());
        } else {
            setShowMentions(false);
        }
    };

    const insertMention = (name: string) => {
        const words = commentText.split(/\s+/);
        words.pop();
        const newText = words.join(' ') + (words.length > 0 ? ' ' : '') + `@${name} `;
        setCommentText(newText);
        setShowMentions(false);
        commentInputRef.current?.focus();
    };

    const submitComment = () => {
        if (!commentText.trim()) return;
        onAddComment(task.id, commentText);
        setCommentText('');
    };

    return (
        <>
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 transition-opacity" onClick={onClose}></div>
            <div className="fixed inset-y-0 right-0 w-full sm:w-[550px] lg:w-[700px] bg-white dark:bg-slate-900 shadow-2xl z-50 transform transition-transform duration-300 flex flex-col">
                
                {/* Header */}
                <div className="flex flex-col px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 z-10">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex flex-wrap gap-2 items-center">
                             <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700">{task.project}</span>
                             <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${task.workType === 'Plan' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>{task.workType}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={() => onCloneTask?.(task.id)} className="p-2 text-slate-400 hover:text-primary-600 hover:bg-slate-50 rounded-full transition-colors"><DocumentDuplicateIcon className="h-5 w-5" /></button>
                            <button onClick={() => { if(window.confirm('Xóa task?')) onDeleteTask(task.id); }} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"><TrashIcon className="h-5 w-5" /></button>
                             <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-50 rounded-full transition-colors ml-2"><XMarkIcon className="h-6 w-6" /></button>
                        </div>
                    </div>
                    <input type="text" defaultValue={task.name} onBlur={(e) => { if(e.target.value !== task.name) onUpdateTask(task.id, { name: e.target.value }) }} className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white bg-transparent border-none p-0 focus:ring-0 placeholder-slate-300 w-full" disabled={isLocked}/>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Left Col */}
                        <div className="md:col-span-2 space-y-8">
                            <div>
                                <SectionHeader title="Mô tả" />
                                <textarea value={task.description || ''} onChange={(e) => onUpdateTask(task.id, { description: e.target.value })} placeholder="Thêm mô tả..." disabled={isLocked} className="w-full bg-transparent border border-transparent rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all resize-none hover:border-slate-200 dark:hover:border-slate-700" rows={3} />
                            </div>
                            
                            {/* Action Items */}
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <SectionHeader title={`Action Items (${doneActionItems}/${actionItems.length})`} />
                                    {!isLocked && <button onClick={() => onAddActionItem(task.id)} className="text-xs font-bold text-primary-600 hover:text-primary-700 bg-primary-50 px-2 py-1 rounded hover:bg-primary-100">+ Thêm mục</button>}
                                </div>
                                <div className="space-y-2 bg-slate-50 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                                    {actionItems.map(item => (
                                        <div key={item.id} className="flex items-start gap-2">
                                            <input type="checkbox" checked={item.status === ActionItemStatus.Done} onChange={() => !isLocked && onUpdateActionItem(item.id, { status: item.status === ActionItemStatus.Done ? ActionItemStatus.Todo : ActionItemStatus.Done })} disabled={isLocked} className="mt-1 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
                                            <input type="text" defaultValue={item.description} onBlur={(e) => { if(e.target.value !== item.description) onUpdateActionItem(item.id, { description: e.target.value }) }} disabled={isLocked} className={`flex-1 bg-transparent border-none p-0 text-sm focus:ring-0 ${item.status === ActionItemStatus.Done ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}`} />
                                        </div>
                                    ))}
                                    {actionItems.length === 0 && <p className="text-xs text-slate-400 italic text-center">Chưa có công việc con.</p>}
                                </div>
                            </div>
                        </div>

                        {/* Right Col: Meta & Approval */}
                        <div className="space-y-6">
                             {/* Approval Workflow Section */}
                            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
                                <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Quy trình duyệt</h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-600 dark:text-slate-300">Trạng thái</span>
                                        <ApprovalStatusBadge status={task.approvalStatus || ApprovalStatus.NotApplicable} />
                                    </div>
                                    
                                    <InlineSelect label="Người duyệt" value={task.approver || ''} options={assignees} onSave={(val) => onUpdateTask(task.id, { approver: val })} disabled={isLocked} />

                                    {/* Approval Actions */}
                                    {isApprover && task.approvalStatus === ApprovalStatus.Pending && (
                                        <div className="grid grid-cols-2 gap-2 pt-2">
                                            <button onClick={() => {
                                                if(window.confirm('Xác nhận duyệt công việc này?')) {
                                                    onApprovalAction(task.id, 'approve');
                                                }
                                            }} className="flex justify-center items-center px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm">
                                                <CheckCircleIcon className="h-4 w-4 mr-1"/> Duyệt
                                            </button>
                                            <button onClick={() => {
                                                const reason = window.prompt("Vui lòng nhập lý do trả lại / yêu cầu chỉnh sửa:");
                                                if (reason !== null && reason.trim() !== "") {
                                                    onApprovalAction(task.id, 'reject', reason);
                                                }
                                            }} className="flex justify-center items-center px-3 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold rounded-lg transition-colors shadow-sm">
                                                <XCircleIcon className="h-4 w-4 mr-1"/> Trả lại
                                            </button>
                                        </div>
                                    )}

                                    {/* Approval Metadata */}
                                    {task.approved_at && (
                                        <div className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-700/50 p-2 rounded border border-slate-100 dark:border-slate-700">
                                            Đã duyệt bởi <strong className="text-slate-700 dark:text-slate-200">{task.approved_by}</strong><br/>
                                            Lúc {new Date(task.approved_at).toLocaleString('vi-VN')}
                                        </div>
                                    )}
                                </div>
                            </div>

                             <DrawerMultiSelect label="Người phụ trách" value={task.assignees} options={assignees} onSave={(val) => onUpdateTask(task.id, { assignees: val })} disabled={isLocked} />
                             <InlineSelect label="Trạng thái" value={task.status} options={TASK_STATUS_OPTIONS} onSave={(val) => onUpdateTask(task.id, { status: val })} />
                             <InlineSelect label="Độ ưu tiên" value={task.priority} options={PRIORITY_OPTIONS} onSave={(val) => onUpdateTask(task.id, { priority: val })} disabled={isLocked} />
                             <div>
                                 <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Deadline</label>
                                 <input type="date" value={task.deadline} onChange={(e) => onUpdateTask(task.id, { deadline: e.target.value })} disabled={isLocked} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                             </div>
                             <InlineSelect label="Điểm (Points)" value={task.points} options={POINT_OPTIONS} onSave={(val) => onUpdateTask(task.id, { points: parseInt(val) })} disabled={isLocked} />
                        </div>
                    </div>
                    
                    <hr className="border-slate-100 dark:border-slate-800" />

                    {/* Comments Section */}
                    <div>
                        <SectionHeader title="Bình luận" icon={<ChatBubbleLeftEllipsisIcon className="h-4 w-4"/>} />
                        
                        {/* Comment List */}
                        <div className="space-y-4 mt-4 mb-6 pl-2 border-l-2 border-slate-100 dark:border-slate-800 ml-2">
                            {task.comments?.map(comment => (
                                <CommentItem key={comment.id} comment={comment} />
                            ))}
                            {(!task.comments || task.comments.length === 0) && <p className="text-sm text-slate-400 italic">Chưa có bình luận nào.</p>}
                        </div>

                        {/* Comment Input */}
                        <div className="flex items-start gap-3 relative">
                             <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-xs">ME</div>
                             <div className="flex-1 relative">
                                 <input 
                                    ref={commentInputRef}
                                    type="text" 
                                    value={commentText}
                                    onChange={handleCommentChange}
                                    onKeyDown={(e) => e.key === 'Enter' && submitComment()}
                                    placeholder="Viết bình luận, dùng @ để tag người duyệt..." 
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all pr-10" 
                                />
                                 <button onClick={submitComment} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-primary-500 hover:bg-primary-50 rounded-full transition-colors">
                                     <PaperAirplaneIcon className="h-4 w-4" />
                                 </button>

                                 {/* Mention Popover */}
                                 {showMentions && (
                                     <div className="absolute bottom-full left-0 mb-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
                                         {assignees.filter(a => a.toLowerCase().includes(mentionQuery)).map(name => (
                                             <div key={name} onClick={() => insertMention(name)} className="px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer flex items-center">
                                                <UserIcon className="h-3 w-3 mr-2 text-slate-400"/> {name}
                                             </div>
                                         ))}
                                     </div>
                                 )}
                             </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 z-10 flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                     <div className="text-xs text-slate-500">{doneActionItems}/{actionItems.length} sub-tasks hoàn thành</div>
                     <div className="flex gap-3">
                         <button onClick={onClose} className="px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Đóng</button>
                         {!isDone ? (
                             <button onClick={() => onUpdateTask(task.id, { status: TaskStatus.Done })} className="px-5 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-sm transition-colors flex items-center">
                                <CheckCircleIcon className="h-4 w-4 mr-2" /> Đánh dấu Hoàn thành
                             </button>
                         ) : (
                             <button onClick={() => onUpdateTask(task.id, { status: TaskStatus.Doing })} className="px-5 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center">
                                <ArrowPathIcon className="h-4 w-4 mr-2" /> Mở lại Task
                             </button>
                         )}
                     </div>
                </div>
            </div>
        </>
    );
};