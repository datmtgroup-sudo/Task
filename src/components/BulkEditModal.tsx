
import React, { useState } from 'react';
import { Task, TaskStatus, Priority, WorkType } from '../types';
import { TASK_STATUS_OPTIONS, PRIORITY_OPTIONS, WORK_TYPE_OPTIONS } from '../constants';
import { XCircleIcon } from './icons/IconComponents';

interface BulkEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<Omit<Task, 'id'>>, deadlineShift: number | null) => void;
  assignees: string[];
  projects: string[];
}

export const BulkEditModal: React.FC<BulkEditModalProps> = ({ isOpen, onClose, onSave, assignees, projects }) => {
  const [status, setStatus] = useState('');
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [assigneeChanged, setAssigneeChanged] = useState(false); // Track if user touched assignees
  const [project, setProject] = useState('');
  const [priority, setPriority] = useState('');
  const [workType, setWorkType] = useState('');
  const [deadlineShift, setDeadlineShift] = useState<number | ''>('');

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updates: Partial<Omit<Task, 'id'>> = {};
    if (status) updates.status = status as TaskStatus;
    if (assigneeChanged) updates.assignees = selectedAssignees;
    if (project) updates.project = project;
    if (priority) updates.priority = priority as Priority;
    if (workType) updates.workType = workType as WorkType;

    const shift = deadlineShift === '' ? null : Number(deadlineShift);
    
    onSave(updates, shift);
    
    // Reset form after save
    setStatus('');
    setSelectedAssignees([]);
    setAssigneeChanged(false);
    setProject('');
    setPriority('');
    setWorkType('');
    setDeadlineShift('');
  };

  const toggleAssignee = (assignee: string) => {
      setAssigneeChanged(true);
      setSelectedAssignees(prev => 
          prev.includes(assignee) ? prev.filter(a => a !== assignee) : [...prev, assignee]
      );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl transform transition-all" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Chỉnh sửa hàng loạt</h2>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                <XCircleIcon className="h-6 w-6 text-slate-500" />
            </button>
        </div>
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">Chỉ những trường bạn thay đổi mới được cập nhật. Để trống để không thay đổi giá trị hiện tại.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
                <label className="label">Trạng thái</label>
                <select value={status} onChange={e => setStatus(e.target.value)} className="form-select">
                    <option value="">-- Không thay đổi --</option>
                    {TASK_STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
            </div>
             <div className="sm:row-span-3">
                <label className="label mb-2 block">Người phụ trách (Chọn nhiều)</label>
                <div className="border border-slate-300 dark:border-slate-600 rounded-md p-2 max-h-48 overflow-y-auto bg-white dark:bg-slate-700/50">
                    {assignees.map(opt => (
                        <label key={opt} className="flex items-center space-x-2 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-600 rounded cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={selectedAssignees.includes(opt)} 
                                onChange={() => toggleAssignee(opt)}
                                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm text-slate-700 dark:text-slate-200">{opt}</span>
                        </label>
                    ))}
                </div>
                 <p className="text-xs text-slate-500 mt-1">Chọn ít nhất 1 người để thay đổi. Để trống để giữ nguyên.</p>
            </div>
             <div>
                <label className="label">Project</label>
                <select value={project} onChange={e => setProject(e.target.value)} className="form-select">
                    <option value="">-- Không thay đổi --</option>
                    {projects.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
            </div>
             <div>
                <label className="label">Độ ưu tiên</label>
                <select value={priority} onChange={e => setPriority(e.target.value)} className="form-select">
                    <option value="">-- Không thay đổi --</option>
                    {PRIORITY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
            </div>
             <div>
                <label className="label">Loại công việc</label>
                <select value={workType} onChange={e => setWorkType(e.target.value)} className="form-select">
                    <option value="">-- Không thay đổi --</option>
                    {WORK_TYPE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
            </div>
            <div>
                <label className="label">Dời Deadline (số ngày)</label>
                <input type="number" value={deadlineShift} onChange={e => setDeadlineShift(e.target.value === '' ? '' : parseInt(e.target.value, 10))} className="form-input" placeholder="VD: 7 hoặc -3" />
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button type="button" onClick={onClose} className="btn-secondary">Hủy</button>
              <button type="submit" className="btn-primary">Áp dụng thay đổi</button>
          </div>
        </form>
      </div>
      <style>{`
        .label { @apply block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1; }
        .form-input { @apply block w-full px-3 py-2 bg-white dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500; }
        .form-select { @apply block w-full pl-3 pr-10 py-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700/50 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 rounded-md; }
        .btn-primary { @apply inline-flex justify-center py-2 px-5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors; }
        .btn-secondary { @apply py-2 px-5 border border-slate-300 dark:border-slate-600 shadow-sm text-sm font-medium rounded-md text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors; }
      `}</style>
    </div>
  );
};
