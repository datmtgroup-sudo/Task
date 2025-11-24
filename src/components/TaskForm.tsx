import React, { useState, useEffect, useRef } from 'react';
import { Task, WorkType, TaskStatus, AdhocOrigin, Priority, ActionItem, ActionItemStatus, Attachment, TaskTemplate, Channel, Objective, KeyResult, ReviewStatus, SuggestedActionItem, SuggestedScoring, SuggestedAssignee, ApprovalStatus } from '../types';
import { WORK_TYPE_OPTIONS, TASK_STATUS_OPTIONS, ADHOC_ORIGIN_OPTIONS, POINT_OPTIONS, PRIORITY_OPTIONS, CHANNEL_OPTIONS, DEFAULT_TAGS } from '../constants';
import { generateChecklist, generateScoring, generateAssigneeSuggestions } from '../services/geminiService';
import { ChecklistSuggestionModal } from './ChecklistSuggestionModal';
import { PlusIcon, LinkIcon, FileIcon, DriveIcon, FigmaIcon, XCircleIcon, ChevronDownIcon, SparklesIcon, CalendarIcon } from './icons/IconComponents';

interface TaskFormProps {
  onAddTask: (task: Omit<Task, 'id'>, actionItems: Omit<ActionItem, 'id' | 'taskId' | 'meetingNoteId'>[], callback?: () => void) => void;
  assignees: string[];
  projects: string[];
  taskTemplates: TaskTemplate[];
  objectives: Objective[];
  keyResults: KeyResult[];
  initialData?: Partial<Task> | null;
  onCancel?: () => void;
  onSubmitSuccess?: (keepOpen: boolean) => void;
  formType?: 'page' | 'panel';
}

// Helper
const statusMap: Record<string, ActionItemStatus> = {
    'todo': ActionItemStatus.Todo,
    'doing': ActionItemStatus.Doing,
    'done': ActionItemStatus.Done,
    'blocked': ActionItemStatus.Blocked,
    'defer': ActionItemStatus.Defer,
};

const FormField: React.FC<{ label: string, helperText?: string, required?: boolean, children: React.ReactNode, className?: string }> = ({ label, helperText, required, children, className }) => (
    <div className={className}>
        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        {children}
        {helperText && <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{helperText}</p>}
    </div>
);

const AttachmentIcon: React.FC<{ provider: Attachment['provider'], className?: string }> = ({ provider, className }) => {
    switch(provider) {
        case 'gdrive': return <DriveIcon className={className} />;
        case 'figma': return <FigmaIcon className={className} />;
        case 'generic': return <LinkIcon className={className} />;
        default: return <FileIcon className={className} />;
    }
};

export const TaskForm: React.FC<TaskFormProps> = ({ onAddTask, assignees, projects, taskTemplates, objectives, keyResults, initialData, onCancel, onSubmitSuccess, formType }) => {
  
  const formRef = useRef<HTMLFormElement>(null);
  
  const resetFormState = (data: Partial<Task> | null = null) => ({
    name: data?.name || '',
    description: data?.description || '',
    attachments: data?.attachments || [],
    keyResultId: data?.keyResultId || '',
    // actionItemsText: '', // Bỏ cái này, dùng state actionItems riêng
    currentStatusNote: data?.currentStatusNote || '',
    assignees: data?.assignees || [assignees[0]] || [], 
    project: data?.project || projects[0] || '',
    tags: data?.tags || [],
    tagInput: '',
    channel: data?.channel || Channel.Other,
    workType: data?.workType || WorkType.Plan,
    status: data?.status || TaskStatus.Todo,
    priority: data?.priority || Priority.TrungBinh,
    adhocOrigin: data?.adhocOrigin || ADHOC_ORIGIN_OPTIONS[0],
    points: data?.points || 5,
    estimatedHours: data?.estimated_hours?.toString() || '',
    startDate: data?.startDate || new Date().toISOString().split('T')[0],
    deadline: data?.deadline || new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0],
  });
  
  const [formState, setFormState] = useState(resetFormState(initialData));
  
  // --- NEW: State cho Action Items ---
  const [actionItems, setActionItems] = useState<{ description: string; owners: string[]; dueDate: string }[]>([]);
  const [newItemText, setNewItemText] = useState('');
  const [newItemOwner, setNewItemOwner] = useState(assignees[0]);
  const [newItemDueDate, setNewItemDueDate] = useState(new Date().toISOString().split('T')[0]);

  const [isMetaCollapsed, setIsMetaCollapsed] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createAnother, setCreateAnother] = useState(false);

  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [isChecklistLoading, setIsChecklistLoading] = useState(false);
  const [checklistSuggestions, setChecklistSuggestions] = useState<SuggestedActionItem[]>([]);
  const [isScoringLoading, setIsScoringLoading] = useState(false);
  const [scoringSuggestion, setScoringSuggestion] = useState<SuggestedScoring | null>(null);
  const [isAssigneeLoading, setIsAssigneeLoading] = useState(false);
  const [assigneeSuggestions, setAssigneeSuggestions] = useState<SuggestedAssignee[]>([]);

  useEffect(() => {
    setFormState(resetFormState(initialData));
    // Reset action items when initialData changes
    setActionItems([]);
  }, [initialData]);

  // --- Handlers ---
  const handleChange = (field: keyof typeof formState, value: any) => {
      setFormState(prev => ({ ...prev, [field]: value }));
      if (errors[field]) {
          setErrors(prev => ({ ...prev, [field]: '' }));
      }
  };
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formState.name.trim()) newErrors.name = 'Tên công việc không được để trống.';
    if (formState.assignees.length === 0) newErrors.assignees = 'Vui lòng chọn ít nhất một người phụ trách.';
    if (!formState.deadline) newErrors.deadline = 'Vui lòng chọn deadline.';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- Add Action Item Handler ---
  const handleAddActionItem = () => {
      if (newItemText.trim()) {
          setActionItems(prev => [...prev, {
              description: newItemText.trim(),
              owners: [newItemOwner],
              dueDate: newItemDueDate
          }]);
          setNewItemText('');
          // Keep owner and date for convenience
      }
  };

  const handleRemoveActionItem = (index: number) => {
      setActionItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleApplyTemplate = (templateId: string) => {
    const template = taskTemplates.find(t => t.id === templateId);
    if (!template) return;

    if (formState.name && !window.confirm("Áp dụng template sẽ ghi đè dữ liệu. Tiếp tục?")) return;
    
    setFormState(prev => ({
        ...prev,
        name: template.defaultTitle || '',
        description: template.defaultDescription || '',
        tags: template.defaultTags || [],
        channel: template.defaultChannel || Channel.Other,
        priority: template.defaultPriority || Priority.TrungBinh,
        points: template.defaultPoints || 5,
        estimatedHours: template.defaultEstimatedHours?.toString() || '',
    }));

    // Apply template action items (default date to task deadline)
    if (template.defaultActionItems) {
        const newItems = template.defaultActionItems.map(desc => ({
            description: desc,
            owners: [assignees[0]],
            dueDate: formState.deadline
        }));
        setActionItems(newItems);
    }
  };

  // ... (Giữ nguyên các hàm handleAddAttachment, Tag, Assignee...)
    const handleAddAttachment = () => {
    const url = prompt("Nhập URL tài liệu (Google Drive, Figma,...) hoặc tên file:");
    if (!url || !url.trim()) return;

    let provider: Attachment['provider'] = 'generic';
    let displayName = url;

    if (url.includes('figma.com')) {
        provider = 'figma';
        displayName = 'Figma Design';
    } else if (url.includes('drive.google.com')) {
        provider = 'gdrive';
        displayName = 'Google Drive File';
    } else if (url.toLowerCase().endsWith('.pdf')) {
        provider = 'pdf';
    }

    const newAttachment: Attachment = {
        id: `att-${Date.now()}`,
        type: url.startsWith('http') ? 'link' : 'file',
        provider,
        url,
        displayName
    };
    handleChange('attachments', [...formState.attachments, newAttachment]);
  };
  
  const handleRemoveAttachment = (id: string) => handleChange('attachments', formState.attachments.filter(a => a.id !== id));
  
  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && formState.tagInput.trim()) {
        e.preventDefault();
        const newTag = formState.tagInput.trim().toLowerCase();
        if (!formState.tags.includes(newTag)) {
            handleChange('tags', [...formState.tags, newTag]);
        }
        handleChange('tagInput', '');
    }
  };
  
  const handleRemoveTag = (tagToRemove: string) => handleChange('tags', formState.tags.filter(tag => tag !== tagToRemove));

  const toggleAssignee = (assignee: string) => {
    const current = new Set(formState.assignees);
    if (current.has(assignee)) {
        current.delete(assignee);
    } else {
        current.add(assignee);
    }
    handleChange('assignees', Array.from(current));
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || isSubmitting) return;

    setIsSubmitting(true);

    const taskData: Omit<Task, 'id'> = {
      name: formState.name.trim(),
      description: formState.description,
      attachments: formState.attachments,
      keyResultId: formState.keyResultId || undefined,
      currentStatusNote: formState.currentStatusNote,
      assignees: formState.assignees, 
      project: formState.project,
      tags: formState.tags,
      channel: formState.channel,
      workType: formState.workType,
      status: formState.status,
      priority: formState.priority,
      adhocOrigin: formState.workType === WorkType.Adhoc ? formState.adhocOrigin : undefined,
      points: formState.points,
      impact: 2, 
      estimated_hours: formState.estimatedHours ? parseFloat(formState.estimatedHours) : undefined,
      startDate: formState.startDate,
      deadline: formState.deadline,
      review_required: false,
      approver: undefined,
      reviewStatus: ReviewStatus.NotRequired,
      approvalStatus: ApprovalStatus.NotApplicable,
    };
    
    // Chuẩn bị dữ liệu Subtask
    const actionItemsData = actionItems.map((item, index) => ({
        description: item.description,
        owners: item.owners,
        dueDate: item.dueDate, // <--- ĐÃ CÓ DATE
        status: ActionItemStatus.Todo,
        stepOrder: index + 1
    }));
    
    onAddTask(taskData, actionItemsData, () => {
      if (createAnother) {
        setFormState(resetFormState({ assignees: formState.assignees, project: formState.project }));
        setActionItems([]);
        const nameInput = formRef.current?.querySelector('input[name="taskName"]');
        if (nameInput instanceof HTMLInputElement) nameInput.focus();
      }
      if (onSubmitSuccess) onSubmitSuccess(createAnother);
      setIsSubmitting(false);
    });
  };

  // --- AI Handlers (Checklist) ---
  const handleGenerateChecklist = async () => {
    setIsChecklistLoading(true);
    const suggestions = await generateChecklist({
        name: formState.name,
        description: formState.description,
        channel: formState.channel,
    });
    setChecklistSuggestions(suggestions);
    setIsChecklistLoading(false);
    setIsChecklistModalOpen(true);
  };
  
  const handleApplyChecklist = (selectedItems: string[]) => {
      // Convert suggestions to objects with default date
      const newItems = selectedItems.map(text => ({
          description: text,
          owners: [formState.assignees[0]],
          dueDate: formState.deadline
      }));
      setActionItems(prev => [...prev, ...newItems]);
      setIsChecklistModalOpen(false);
  };

  // ... (Giữ nguyên Scoring & Assignee Suggestions handlers)
    const handleGenerateScoring = async () => {
      setIsScoringLoading(true);
      setScoringSuggestion(null);
      const suggestion = await generateScoring({
          name: formState.name,
          description: formState.description,
          channel: formState.channel,
          startDate: formState.startDate,
      });
      setScoringSuggestion(suggestion);
      setIsScoringLoading(false);
  };

  const handleGenerateAssignees = async () => {
      setIsAssigneeLoading(true);
      setAssigneeSuggestions([]);
      const suggestions = await generateAssigneeSuggestions({
          name: formState.name,
          description: formState.description,
          channel: formState.channel,
      });
      setAssigneeSuggestions(suggestions);
      setIsAssigneeLoading(false);
  };

  // --- Styles ---
  const inputBaseStyle = "block w-full text-sm rounded-md shadow-sm transition-colors duration-150";
  const inputStyle = `${inputBaseStyle} bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-1 focus:ring-primary-500 focus:border-primary-500`;
  const largeInputStyle = `${inputStyle} text-base py-3 px-4`;
  const normalInputStyle = `${inputStyle} py-2 px-3`;

  return (
    <>
    <ChecklistSuggestionModal
        isOpen={isChecklistModalOpen}
        suggestions={checklistSuggestions}
        onClose={() => setIsChecklistModalOpen(false)}
        onApply={handleApplyChecklist}
    />
    <div className={`${formType === 'page' ? 'max-w-4xl mx-auto' : ''}`}>
        <div className={`${formType === 'page' ? 'bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700/50' : ''}`}>
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
                {/* --- Top Bar --- */}
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                    <div className="flex-grow w-full">
                        <input name="taskName" type="text" value={formState.name} onChange={e => handleChange('name', e.target.value)}
                            className={`${largeInputStyle} ${errors.name ? 'border-red-500' : ''}`}
                            placeholder="VD: Viết bài đăng Fanpage chiến dịch Q4 *" />
                        {errors.name && <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.name}</p>}
                    </div>
                     <div className="w-full sm:w-64 flex-shrink-0">
                         <select onChange={e => handleApplyTemplate(e.target.value)} defaultValue="" className={`${normalInputStyle} h-[46px]`}>
                            <option value="" disabled>Chọn từ template...</option>
                            {taskTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>
                </div>

                {/* --- Primary Context --- */}
                <div className="space-y-6">
                    <FormField label="Mô tả (Task description)">
                        <textarea value={formState.description} onChange={e => handleChange('description', e.target.value)} rows={4} className={normalInputStyle}></textarea>
                    </FormField>
                    
                    {/* --- SUBTASKS SECTION (NEW UI) --- */}
                    <FormField label="Danh sách công việc con (Sub-tasks)">
                         <div className="space-y-3 bg-slate-50 dark:bg-slate-900/30 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                            {/* List */}
                            {actionItems.length > 0 && (
                                <ul className="space-y-2 mb-4">
                                    {actionItems.map((item, idx) => (
                                        <li key={idx} className="flex items-center gap-3 bg-white dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700 shadow-sm">
                                            <span className="flex-grow text-sm">{item.description}</span>
                                            <span className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-slate-600">{item.owners[0]}</span>
                                            <span className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-slate-600 flex items-center">
                                                <CalendarIcon className="h-3 w-3 mr-1"/> {item.dueDate}
                                            </span>
                                            <button type="button" onClick={() => handleRemoveActionItem(idx)} className="text-red-500 hover:text-red-700 p-1"><XCircleIcon className="h-5 w-5"/></button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            
                            {/* Add New */}
                            <div className="flex flex-col sm:flex-row gap-2">
                                <input 
                                    type="text" 
                                    value={newItemText} 
                                    onChange={e => setNewItemText(e.target.value)} 
                                    placeholder="Nhập tên công việc con..." 
                                    className={`${normalInputStyle} flex-grow`}
                                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddActionItem())}
                                />
                                <select 
                                    value={newItemOwner} 
                                    onChange={e => setNewItemOwner(e.target.value)} 
                                    className={`${normalInputStyle} sm:w-40`}
                                >
                                    {assignees.map(u => <option key={u} value={u}>{u}</option>)}
                                </select>
                                <input 
                                    type="date" 
                                    value={newItemDueDate} 
                                    onChange={e => setNewItemDueDate(e.target.value)} 
                                    className={`${normalInputStyle} sm:w-40`} 
                                />
                                <button type="button" onClick={handleAddActionItem} className="px-4 py-2 bg-primary-100 text-primary-700 rounded-md hover:bg-primary-200 font-medium text-sm">Thêm</button>
                            </div>
                            
                            <div className="flex justify-end">
                                 <button type="button" onClick={handleGenerateChecklist} disabled={isChecklistLoading} className="inline-flex items-center gap-2 text-xs font-semibold text-primary-600 hover:text-primary-800">
                                    <SparklesIcon className="h-4 w-4" />
                                    {isChecklistLoading ? 'Đang tạo...' : 'AI gợi ý subtask'}
                                 </button>
                            </div>
                         </div>
                    </FormField>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        <FormField label="Ngày bắt đầu">
                            <div className="relative">
                                <input type="date" value={formState.startDate} onChange={e => handleChange('startDate', e.target.value)} className={`${normalInputStyle} pr-10`} />
                                <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
                            </div>
                        </FormField>
                        <FormField label="Deadline" required>
                            <div className="relative">
                                <input type="date" value={formState.deadline} onChange={e => handleChange('deadline', e.target.value)} className={`${normalInputStyle} ${errors.deadline ? 'border-red-500' : ''} pr-10`} />
                                <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
                            </div>
                            {errors.deadline && <p className="form-error">{errors.deadline}</p>}
                        </FormField>
                    </div>
                    
                     {/* Attachments, Linked Objective, etc. (Giữ nguyên phần dưới) */}
                    <FormField label="Tài liệu tham khảo">
                         <div className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-md border border-slate-200 dark:border-slate-700 space-y-2">
                            {formState.attachments.map(att => (
                               <div key={att.id} className="flex items-center justify-between bg-white dark:bg-slate-800 p-2 rounded-md shadow-sm">
                                   <span className="text-sm truncate">{att.displayName}</span>
                                   <button type="button" onClick={() => handleRemoveAttachment(att.id)}><XCircleIcon className="h-5 w-5 text-slate-400" /></button>
                               </div>
                            ))}
                            <button type="button" onClick={handleAddAttachment} className="w-full text-center py-2 border-2 border-dashed border-slate-300 rounded-lg text-sm font-semibold text-slate-500 hover:bg-slate-200 transition">
                                + Thêm tài liệu
                            </button>
                        </div>
                    </FormField>

                    <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                        <button type="button" onClick={() => setIsMetaCollapsed(!isMetaCollapsed)} className="flex items-center text-sm font-semibold text-slate-600">
                            <span>Chi tiết (Người phụ trách, Kênh, Phân loại...)</span>
                            <ChevronDownIcon className={`h-5 w-5 ml-2 transition-transform ${isMetaCollapsed ? '' : 'rotate-180'}`} />
                        </button>
                        
                        {!isMetaCollapsed && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mt-4 animate-fade-in">
                                <FormField label="Người phụ trách" required>
                                     <div className="space-y-2">
                                        {assignees.map(a => (
                                            <label key={a} className="flex items-center space-x-2">
                                                <input type="checkbox" checked={formState.assignees.includes(a)} onChange={() => toggleAssignee(a)} className="rounded text-primary-600" />
                                                <span className="text-sm">{a}</span>
                                            </label>
                                        ))}
                                     </div>
                                </FormField>
                                <FormField label="Project">
                                    <select value={formState.project} onChange={e => handleChange('project', e.target.value)} className={normalInputStyle}>
                                        {projects.map(p => <option key={p}>{p}</option>)}
                                    </select>
                                </FormField>
                                <FormField label="Priority">
                                     <div className="flex gap-2">
                                        {PRIORITY_OPTIONS.map(p => (
                                            <button type="button" key={p} onClick={() => handleChange('priority', p)} className={`px-3 py-1 text-sm rounded border ${formState.priority === p ? 'bg-primary-500 text-white' : 'bg-white text-slate-600'}`}>{p}</button>
                                        ))}
                                     </div>
                                </FormField>
                                 <FormField label="Loại việc">
                                     <div className="flex gap-2">
                                        {WORK_TYPE_OPTIONS.map(w => (
                                            <button type="button" key={w} onClick={() => handleChange('workType', w)} className={`px-3 py-1 text-sm rounded border ${formState.workType === w ? 'bg-primary-500 text-white' : 'bg-white text-slate-600'}`}>{w}</button>
                                        ))}
                                     </div>
                                </FormField>
                            </div>
                        )}
                    </div>
                </div>

                {/* --- Actions --- */}
                <div className="pt-6 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                     {onCancel && <button type="button" onClick={onCancel} className="px-6 py-2 rounded-full text-slate-600 hover:bg-slate-100">Hủy</button>}
                     <button type="submit" disabled={isSubmitting} className="px-6 py-2 rounded-full bg-primary-600 text-white hover:bg-primary-700 shadow-lg disabled:opacity-50">
                        {isSubmitting ? 'Đang tạo...' : 'Thêm Task'}
                     </button>
                </div>
            </form>
        </div>
        <style>{`
            .form-error { @apply mt-1.5 text-sm text-red-600 dark:text-red-400; }
            @keyframes fade-in { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
            .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        `}</style>
    </div>
    </>
  );
};