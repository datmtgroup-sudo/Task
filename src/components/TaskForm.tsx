
import React, { useState, useEffect, useRef } from 'react';
import { Task, WorkType, TaskStatus, AdhocOrigin, Priority, ActionItem, ActionItemStatus, Attachment, TaskTemplate, Channel, Objective, KeyResult, ReviewStatus, SuggestedActionItem, SuggestedScoring, SuggestedAssignee, ApprovalStatus } from '../types';
import { WORK_TYPE_OPTIONS, TASK_STATUS_OPTIONS, ADHOC_ORIGIN_OPTIONS, POINT_OPTIONS, PRIORITY_OPTIONS, CHANNEL_OPTIONS, DEFAULT_TAGS } from '../constants';
import { generateChecklist, generateScoring, generateAssigneeSuggestions } from '../services/geminiService';
import { ChecklistSuggestionModal } from './ChecklistSuggestionModal';
import { PlusIcon, LinkIcon, FileIcon, DriveIcon, FigmaIcon, XCircleIcon, ChevronDownIcon, SparklesIcon, CalendarIcon } from './icons/IconComponents';

interface TaskFormProps {
  onAddTask: (task: Omit<Task, 'id'>, actionItems: Omit<ActionItem, 'id' | 'taskId' | 'meetingNoteId'>[], callback: () => void) => void;
  assignees: string[];
  projects: string[];
  taskTemplates: TaskTemplate[];
  objectives: Objective[];
  keyResults: KeyResult[];
  initialData?: Partial<Task> | null;
  onCancel?: () => void;
  onSubmitSuccess: (keepOpen: boolean) => void;
  formType: 'page' | 'panel';
}


// --- Helper Functions & Local Components ---
const statusMap: Record<string, ActionItemStatus> = {
    'todo': ActionItemStatus.Todo,
    'doing': ActionItemStatus.Doing,
    'done': ActionItemStatus.Done,
    'blocked': ActionItemStatus.Blocked,
    'defer': ActionItemStatus.Defer,
};

const parseActionItems = (text: string, defaultOwners: string[], defaultDueDate: string): Omit<ActionItem, 'id' | 'taskId' | 'meetingNoteId'>[] => {
    if (!text.trim()) return [];
    const lines = text.split('\n').filter(line => line.trim() !== '');
    return lines.map((line, index) => {
        let description = line.replace(/^[\s-•*]?\d*[.)]?\s*/, '').trim();
        const ownerMatch = description.match(/@([\w\s\p{L}]+)/u);
        // If specific owner mentioned in text, use it, otherwise use default owners
        const owners = ownerMatch ? [ownerMatch[1].trim()] : defaultOwners;
        if(ownerMatch) description = description.replace(ownerMatch[0], '').trim();
        const dueDateMatch = description.match(/due:(\S+)/);
        const dueDate = dueDateMatch ? dueDateMatch[1].trim() : defaultDueDate;
        if(dueDateMatch) description = description.replace(dueDateMatch[0], '').trim();
        const statusMatch = description.match(/\[(todo|doing|done|blocked|defer)\]/i);
        const statusString = statusMatch ? statusMatch[1].toLowerCase() : null;
        const status = statusString && statusMap[statusString] ? statusMap[statusString] : ActionItemStatus.Todo;
        if(statusMatch) description = description.replace(statusMatch[0], '').trim();
        return { description, owners, dueDate, status, stepOrder: index + 1 };
    });
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

// --- Main Form Component ---
export const TaskForm: React.FC<TaskFormProps> = ({ onAddTask, assignees, projects, taskTemplates, objectives, keyResults, initialData, onCancel, onSubmitSuccess, formType }) => {
  
  const formRef = useRef<HTMLFormElement>(null);
  
  const resetFormState = (data: Partial<Task> | null = null) => ({
    name: data?.name || '',
    description: data?.description || '',
    attachments: data?.attachments || [],
    keyResultId: data?.keyResultId || '',
    actionItemsText: '', // This is not stored on the task object
    currentStatusNote: data?.currentStatusNote || '',
    assignees: data?.assignees || [assignees[0]] || [], // Changed to array
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
  
  // --- State ---
  const [formState, setFormState] = useState(resetFormState(initialData));

  // --- UI & Validation State ---
  const [isMetaCollapsed, setIsMetaCollapsed] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createAnother, setCreateAnother] = useState(false);

  // --- AI Helpers State ---
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [isChecklistLoading, setIsChecklistLoading] = useState(false);
  const [checklistSuggestions, setChecklistSuggestions] = useState<SuggestedActionItem[]>([]);
  const [isScoringLoading, setIsScoringLoading] = useState(false);
  const [scoringSuggestion, setScoringSuggestion] = useState<SuggestedScoring | null>(null);
  const [isAssigneeLoading, setIsAssigneeLoading] = useState(false);
  const [assigneeSuggestions, setAssigneeSuggestions] = useState<SuggestedAssignee[]>([]);


  // --- Effects ---
  useEffect(() => {
    setFormState(resetFormState(initialData));
  }, [initialData]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            formRef.current?.requestSubmit();
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);


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
    if (formState.estimatedHours && parseFloat(formState.estimatedHours) < 0) newErrors.estimatedHours = 'Thời gian ước tính phải là số dương.';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleApplyTemplate = (templateId: string) => {
    const template = taskTemplates.find(t => t.id === templateId);
    if (!template) return;

    const isFormDirty = formState.name || formState.description || formState.actionItemsText || formState.tags.length > 0;
    if (isFormDirty && !window.confirm("Áp dụng template sẽ ghi đè lên một số trường đã nhập. Bạn có muốn tiếp tục?")) {
        return;
    }
    
    setFormState(prev => ({
        ...prev,
        name: template.defaultTitle || '',
        description: template.defaultDescription || '',
        actionItemsText: template.defaultActionItems?.join('\n') || '',
        tags: template.defaultTags || [],
        channel: template.defaultChannel || Channel.Other,
        priority: template.defaultPriority || Priority.TrungBinh,
        points: template.defaultPoints || 5,
        estimatedHours: template.defaultEstimatedHours?.toString() || '',
    }));
  };

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
      assignees: formState.assignees, // Array
      project: formState.project,
      tags: formState.tags,
      channel: formState.channel,
      workType: formState.workType,
      status: formState.status,
      priority: formState.priority,
      adhocOrigin: formState.workType === WorkType.Adhoc ? formState.adhocOrigin : undefined,
      points: formState.points,
      impact: 2, // Default impact
      estimated_hours: formState.estimatedHours ? parseFloat(formState.estimatedHours) : undefined,
      startDate: formState.startDate,
      deadline: formState.deadline,
      review_required: false,
      approver: undefined,
      reviewStatus: ReviewStatus.NotRequired,
      approvalStatus: ApprovalStatus.NotApplicable,
    };
    
    const actionItemsData = parseActionItems(formState.actionItemsText, formState.assignees, formState.deadline);
    
    onAddTask(taskData, actionItemsData, () => {
      if (createAnother) {
        setFormState(resetFormState({ assignees: formState.assignees, project: formState.project }));
        const nameInput = formRef.current?.querySelector('input[name="taskName"]');
        if (nameInput instanceof HTMLInputElement) {
            nameInput.focus();
        }
      }
      onSubmitSuccess(createAnother);
      setIsSubmitting(false);
    });
  };

  // --- AI Handlers ---
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
      const newText = selectedItems.join('\n');
      setFormState(prev => ({
          ...prev,
          actionItemsText: prev.actionItemsText ? `${prev.actionItemsText}\n${newText}` : newText
      }));
      setIsChecklistModalOpen(false);
  };

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
                {/* --- Top Bar: Accelerator Zone --- */}
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

                {/* --- Primary Context Zone --- */}
                <div className="space-y-6">
                    <FormField label="Mô tả (Task description)">
                        <textarea value={formState.description} onChange={e => handleChange('description', e.target.value)} rows={4} className={normalInputStyle}></textarea>
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
                    <FormField label="Tài liệu tham khảo (Reference materials)">
                        <div className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-md border border-slate-200 dark:border-slate-700 space-y-2">
                           {formState.attachments.map(att => (
                               <div key={att.id} className="flex items-center justify-between bg-white dark:bg-slate-800 p-2 rounded-md shadow-sm">
                                   <div className="flex items-center gap-2 flex-grow min-w-0">
                                       <AttachmentIcon provider={att.provider} className="h-5 w-5 text-slate-500 flex-shrink-0" />
                                       <span className="text-sm text-slate-700 dark:text-slate-200 truncate">{att.displayName}</span>
                                   </div>
                                   <button type="button" onClick={() => handleRemoveAttachment(att.id)} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 ml-2">
                                       <XCircleIcon className="h-5 w-5 text-slate-400" />
                                   </button>
                               </div>
                           ))}
                            <button type="button" onClick={handleAddAttachment} className="w-full text-center py-2 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition">
                                + Thêm tài liệu / link
                            </button>
                        </div>
                    </FormField>
                    <FormField label="Liên quan đến mục tiêu (Linked Objective / KR)">
                         <select value={formState.keyResultId} onChange={e => handleChange('keyResultId', e.target.value)} className={normalInputStyle}>
                            <option value="">Không có</option>
                            {objectives.map(obj => (
                                <optgroup key={obj.id} label={obj.title}>
                                    {keyResults.filter(kr => kr.objectiveId === obj.id).map(kr => (
                                        <option key={kr.id} value={kr.id}>{kr.title}</option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                    </FormField>
                </div>
                
                {/* --- Execution Plan Zone --- */}
                <div className="space-y-6">
                     <div className="space-y-2">
                         <button type="button" onClick={handleGenerateChecklist} disabled={isChecklistLoading} className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 disabled:opacity-50">
                            <SparklesIcon className="h-5 w-5" />
                            {isChecklistLoading ? 'Đang tạo checklist...' : 'AI gợi ý checklist'}
                         </button>
                         <FormField label="Action Items (mỗi dòng là một sub-task)" helperText="Dùng @Tên, due:YYYY-MM-DD, [status] để thêm chi tiết.">
                            <textarea value={formState.actionItemsText} onChange={e => handleChange('actionItemsText', e.target.value)} rows={5}
                                className={`${normalInputStyle} font-mono text-xs leading-5`}
                                placeholder="- Gửi brief cho team design @Nguyễn Văn A due:2024-10-20 [todo]&#10;- Duyệt thiết kế & góp ý [doing]"></textarea>
                        </FormField>
                     </div>
                     <FormField label="Ghi chú tiến độ" helperText="Cập nhật tiến độ, vướng mắc, bước tiếp theo. Sẽ được lưu trữ tự động.">
                         <textarea value={formState.currentStatusNote} onChange={e => handleChange('currentStatusNote', e.target.value)} rows={3}
                            className={`${normalInputStyle} bg-slate-100 dark:bg-slate-700/60`}></textarea>
                    </FormField>
                 </div>

                {/* --- Metadata & Scheduling Zone --- */}
                <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                    <div className="flex justify-between items-center mb-4">
                        <button type="button" onClick={() => setIsMetaCollapsed(!isMetaCollapsed)} className="flex-grow flex justify-between items-center text-left text-sm font-semibold text-slate-600 dark:text-slate-300">
                            <span>Chi tiết (Người phụ trách, Kênh, Phân loại...)</span>
                            <ChevronDownIcon className={`h-5 w-5 transition-transform ${isMetaCollapsed ? '' : 'rotate-180'}`} />
                        </button>
                         <button type="button" onClick={handleGenerateScoring} disabled={isScoringLoading} className="ml-4 inline-flex items-center gap-2 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 disabled:opacity-50 flex-shrink-0">
                            <SparklesIcon className="h-5 w-5"/>
                            {isScoringLoading ? 'Đang phân tích...' : 'AI gợi ý'}
                         </button>
                    </div>

                     {scoringSuggestion && (
                        <div className="mb-4 p-3 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-500/30 rounded-lg space-y-2">
                             <h4 className="text-sm font-semibold text-primary-800 dark:text-primary-200">Gợi ý bởi AI:</h4>
                             <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                                {scoringSuggestion.points && <button type="button" onClick={() => handleChange('points', scoringSuggestion.points)} className="ai-suggestion-btn">Points: {scoringSuggestion.points}</button>}
                                {scoringSuggestion.priority && <button type="button" onClick={() => handleChange('priority', scoringSuggestion.priority)} className="ai-suggestion-btn">Priority: {scoringSuggestion.priority}</button>}
                                {scoringSuggestion.deadline && <button type="button" onClick={() => handleChange('deadline', scoringSuggestion.deadline)} className="ai-suggestion-btn">Deadline: {scoringSuggestion.deadline}</button>}
                             </div>
                        </div>
                    )}

                    {!isMetaCollapsed && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 animate-fade-in">
                            <FormField label="Người phụ trách (Multi-select)" required>
                                <div className="flex items-start gap-2">
                                    <div className="flex-grow border border-slate-300 dark:border-slate-700 rounded-md p-2 bg-slate-50 dark:bg-slate-900/50 max-h-32 overflow-y-auto">
                                        {assignees.map(a => (
                                            <label key={a} className="flex items-center space-x-2 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    checked={formState.assignees.includes(a)} 
                                                    onChange={() => toggleAssignee(a)}
                                                    className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                                />
                                                <span className="text-sm text-slate-700 dark:text-slate-200">{a}</span>
                                            </label>
                                        ))}
                                    </div>
                                    <button type="button" onClick={handleGenerateAssignees} disabled={isAssigneeLoading} className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors mt-1" title="AI gợi ý người phụ trách">
                                        <SparklesIcon className="h-5 w-5 text-primary-500" />
                                    </button>
                                </div>
                                {isAssigneeLoading && <p className="mt-1.5 text-xs text-slate-500">Đang tìm người phù hợp...</p>}
                                {assigneeSuggestions.length > 0 && (
                                     <div className="mt-2 p-2 bg-slate-50 dark:bg-slate-700/50 rounded-md border border-slate-200 dark:border-slate-700">
                                        {assigneeSuggestions.map(sugg => (
                                            <button type="button" key={sugg.name} onClick={() => { handleChange('assignees', [sugg.name]); setAssigneeSuggestions([]); }} className="block w-full text-left p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-600">
                                                <span className="font-semibold text-sm">{sugg.name}</span>
                                                <span className="block text-xs text-slate-500 dark:text-slate-400">{sugg.reason}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {errors.assignees && <p className="form-error">{errors.assignees}</p>}
                            </FormField>
                            <FormField label="Project/Campaign">
                                <select value={formState.project} onChange={e => handleChange('project', e.target.value)} className={normalInputStyle}>
                                    {projects.map(p => <option key={p}>{p}</option>)}
                                </select>
                            </FormField>
                            <FormField label="Tags">
                                <div className="p-2 border border-slate-300 dark:border-slate-700 rounded-md flex flex-wrap gap-2">
                                    {formState.tags.map(tag => (
                                        <span key={tag} className="flex items-center bg-primary-100 dark:bg-primary-500/20 text-primary-700 dark:text-primary-300 text-xs font-medium px-2 py-1 rounded-full">
                                            {tag}
                                            <button type="button" onClick={() => handleRemoveTag(tag)} className="ml-1.5 -mr-0.5 text-primary-500 hover:text-primary-700">
                                                <XCircleIcon className="h-4 w-4" />
                                            </button>
                                        </span>
                                    ))}
                                    <input type="text" value={formState.tagInput} onChange={e => handleChange('tagInput', e.target.value)} onKeyDown={handleTagInputKeyDown} placeholder="Thêm tag..." className="flex-grow bg-transparent text-sm outline-none p-1" />
                                </div>
                            </FormField>
                             <FormField label="Kênh (Channel)">
                                <select value={formState.channel} onChange={e => handleChange('channel', e.target.value as Channel)} className={normalInputStyle}>
                                    {CHANNEL_OPTIONS.map(c => <option key={c}>{c}</option>)}
                                </select>
                            </FormField>
                            
                            <FormField label="Loại công việc">
                                <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-900/50 rounded-lg">
                                    {WORK_TYPE_OPTIONS.map(type => (
                                        <button type="button" key={type} onClick={() => handleChange('workType', type)}
                                            className={`flex-1 text-center text-sm font-semibold py-1.5 rounded-md transition-colors duration-200 ${formState.workType === type ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}>
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </FormField>
                            {formState.workType === WorkType.Adhoc && (
                                <FormField label="Nguồn phát sinh">
                                    <select value={formState.adhocOrigin} onChange={e => handleChange('adhocOrigin', e.target.value as AdhocOrigin)} required className={normalInputStyle}>
                                        {ADHOC_ORIGIN_OPTIONS.map(o => <option key={o}>{o}</option>)}
                                    </select>
                                </FormField>
                            )}
                             <FormField label="Độ ưu tiên">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {PRIORITY_OPTIONS.map(p => (
                                        <button type="button" key={p} onClick={() => handleChange('priority', p)}
                                            className={`text-center text-sm font-medium py-1.5 rounded-md border transition-colors duration-200 ${formState.priority === p ? 'bg-primary-500 text-white border-primary-500' : 'bg-transparent text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700/50'}`}>
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </FormField>
                            <FormField label="Điểm (Points)">
                                <select value={formState.points} onChange={e => handleChange('points', parseInt(e.target.value, 10))} className={normalInputStyle}>
                                    {POINT_OPTIONS.map(p => <option key={p}>{p}</option>)}
                                </select>
                            </FormField>
                            <FormField label="Thời gian ước tính (giờ)">
                                <input type="number" value={formState.estimatedHours} onChange={e => handleChange('estimatedHours', e.target.value)}
                                    className={`${normalInputStyle} ${errors.estimatedHours ? 'border-red-500' : ''}`}
                                    placeholder="e.g. 2.5" step="0.1" min="0" />
                                {errors.estimatedHours && <p className="form-error">{errors.estimatedHours}</p>}
                            </FormField>
                        </div>
                    )}
                </div>

                {/* --- Action Area --- */}
                 <div className="pt-6 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4">
                     <div>
                        {formType === 'panel' && (
                             <label className="flex items-center text-sm text-slate-600 dark:text-slate-300">
                                <input type="checkbox" checked={createAnother} onChange={e => setCreateAnother(e.target.checked)} className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500 bg-transparent mr-2" />
                                Tạo thêm task khác
                            </label>
                        )}
                    </div>
                    <div className="flex items-center space-x-3">
                        {onCancel && (
                             <button type="button" onClick={onCancel} className="px-6 h-11 text-sm font-semibold rounded-full text-slate-700 dark:text-slate-200 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                Hủy
                            </button>
                        )}
                        <button type="submit" disabled={isSubmitting} className="inline-flex items-center justify-center h-11 px-6 border border-transparent shadow-sm text-sm font-semibold rounded-full text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed">
                            <PlusIcon className="h-5 w-5 mr-2 -ml-1" />
                            {isSubmitting ? 'Đang tạo...' : 'Thêm Task'}
                            <span className="hidden sm:inline text-xs ml-2 opacity-70">(Ctrl+Enter)</span>
                        </button>
                    </div>
                </div>
            </form>
        </div>
        <style>{`
            .form-error { @apply mt-1.5 text-sm text-red-600 dark:text-red-400; }
            @keyframes fade-in {
              from { opacity: 0; transform: translateY(-10px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .animate-fade-in {
              animation: fade-in 0.3s ease-out forwards;
            }
            .ai-suggestion-btn {
                @apply px-2.5 py-1 text-xs font-semibold rounded-full bg-primary-100 dark:bg-primary-500/30 text-primary-700 dark:text-primary-200 hover:bg-primary-200 dark:hover:bg-primary-500/50 transition-colors;
            }
        `}</style>
    </div>
    </>
  );
};
