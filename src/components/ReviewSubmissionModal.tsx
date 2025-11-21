
import React, { useState, useEffect, useRef } from 'react';
import { Task, ApprovalStatus } from '../types';
import { PaperAirplaneIcon, XMarkIcon, UserIcon } from './icons/IconComponents';

interface ReviewSubmissionModalProps {
  isOpen: boolean;
  task: Task | null;
  assignees: string[];
  onClose: () => void;
  onSubmit: (taskId: string, comment: string, mentions: string[]) => void;
}

export const ReviewSubmissionModal: React.FC<ReviewSubmissionModalProps> = ({ isOpen, task, assignees, onClose, onSubmit }) => {
  const [comment, setComment] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen && task) {
      // Pre-fill if needed, or keep empty
      setComment('');
    }
  }, [isOpen, task]);

  if (!isOpen || !task) return null;

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setComment(val);

    // Simple detection of @ for mention
    const lastWord = val.split(/\s+/).pop();
    if (lastWord && lastWord.startsWith('@')) {
      setShowMentions(true);
      setMentionQuery(lastWord.substring(1).toLowerCase());
    } else {
      setShowMentions(false);
    }
  };

  const insertMention = (name: string) => {
    const words = comment.split(/\s+/);
    words.pop(); // Remove the incomplete @mention
    const newText = words.join(' ') + (words.length > 0 ? ' ' : '') + `@${name} `;
    setComment(newText);
    setShowMentions(false);
    textareaRef.current?.focus();
  };

  const filteredAssignees = assignees.filter(a => 
    a.toLowerCase().includes(mentionQuery) && 
    a !== 'Unassigned'
  ).sort((a, b) => {
      // Prioritize the approver
      if (a === task.approver) return -1;
      if (b === task.approver) return 1;
      return 0;
  });

  const handleSubmit = () => {
    // Extract mentions from final text just to be sure
    const mentions = assignees.filter(a => comment.includes(`@${a}`));
    onSubmit(task.id, comment, mentions);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg transform transition-all scale-100">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700">
            <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Gửi yêu cầu duyệt</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Công việc: <span className="font-semibold">{task.name}</span></p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                <XMarkIcon className="h-6 w-6" />
            </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-4 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200 flex items-start">
                   <span className="mr-2">💡</span>
                   Hãy @tag người duyệt <strong>{task.approver ? `(@${task.approver})` : ''}</strong> để họ nhận được thông báo ngay lập tức.
                </p>
            </div>

            <div className="relative">
                <textarea 
                    ref={textareaRef}
                    value={comment}
                    onChange={handleTextChange}
                    placeholder={`Ví dụ: Em đã hoàn thành bản draft, nhờ anh @${task.approver || '...'} duyệt giúp ạ...`}
                    className="w-full h-32 p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none text-sm"
                />
                
                {/* Mention Autocomplete Popover */}
                {showMentions && filteredAssignees.length > 0 && (
                    <div className="absolute bottom-full left-0 w-64 mb-1 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-20">
                         <div className="px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-600 text-xs font-semibold text-slate-500">
                            Gợi ý người dùng
                        </div>
                        <ul className="max-h-40 overflow-y-auto">
                            {filteredAssignees.map(name => (
                                <li 
                                    key={name} 
                                    onClick={() => insertMention(name)}
                                    className="px-4 py-2 text-sm cursor-pointer hover:bg-primary-50 dark:hover:bg-slate-700 flex items-center"
                                >
                                    <UserIcon className="h-4 w-4 mr-2 text-slate-400"/>
                                    <span className={name === task.approver ? 'font-bold text-primary-700 dark:text-primary-400' : 'text-slate-700 dark:text-slate-200'}>
                                        {name} {name === task.approver && '(Người duyệt)'}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-5 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 rounded-b-xl">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
                Để sau
            </button>
            <button 
                onClick={handleSubmit}
                disabled={!comment.trim()}
                className="flex items-center px-4 py-2 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-md transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
                <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                Gửi & Hoàn thành
            </button>
        </div>

      </div>
    </div>
  );
};
