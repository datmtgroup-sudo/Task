import React, { useState, useEffect } from 'react';
import { SuggestedActionItem } from '../types';
import { SparklesIcon, XMarkIcon } from './icons/IconComponents';

interface ChecklistSuggestionModalProps {
  isOpen: boolean;
  suggestions: SuggestedActionItem[];
  onClose: () => void;
  onApply: (selectedItems: string[]) => void;
}

export const ChecklistSuggestionModal: React.FC<ChecklistSuggestionModalProps> = ({ isOpen, suggestions, onClose, onApply }) => {
  const [checklist, setChecklist] = useState<SuggestedActionItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      setChecklist(suggestions);
      // Pre-select all suggestions by default, except warnings
      const initialSelected = new Set(suggestions.filter(s => !s.id.startsWith('warn-')).map(s => s.id));
      setSelectedIds(initialSelected);
    }
  }, [isOpen, suggestions]);

  if (!isOpen) {
    return null;
  }
  
  const handleToggle = (id: string) => {
    setSelectedIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        return newSet;
    });
  };

  const handleTextChange = (id: string, newText: string) => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, title: newText } : item));
  };
  
  const handleSelectAll = (select: boolean) => {
      if (select) {
          setSelectedIds(new Set(suggestions.filter(s => !s.id.startsWith('warn-')).map(s => s.id)));
      } else {
          setSelectedIds(new Set());
      }
  }

  const handleApply = () => {
    const selectedItems = checklist
        .filter(item => selectedIds.has(item.id))
        .map(item => `- ${item.title} ${item.suggestion ? `(${item.suggestion})` : ''}`);
    onApply(selectedItems);
  };
  
  const isWarning = suggestions.length > 0 && suggestions[0].id.startsWith('warn-');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl p-6 transform transition-all" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-700">
             <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
                <SparklesIcon className="h-6 w-6 text-primary-500 mr-3" />
                Checklist gợi ý bởi AI
            </h2>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                <XMarkIcon className="h-6 w-6 text-slate-500" />
            </button>
        </div>

        <div className="mt-6 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {isWarning ? (
                 <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-500/30 rounded-md">
                    <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">{suggestions[0].title}</h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">{suggestions[0].suggestion}</p>
                 </div>
            ) : (
                <>
                <div className="flex justify-end space-x-4">
                    <button onClick={() => handleSelectAll(true)} className="text-sm font-medium text-primary-600 dark:text-primary-400">Chọn tất cả</button>
                    <button onClick={() => handleSelectAll(false)} className="text-sm font-medium text-slate-500">Bỏ chọn tất cả</button>
                </div>
                {checklist.map(item => (
                    <div key={item.id} className="flex items-start space-x-3 p-3 rounded-md has-[:checked]:bg-primary-50 dark:has-[:checked]:bg-primary-900/20">
                        <input
                            type="checkbox"
                            checked={selectedIds.has(item.id)}
                            onChange={() => handleToggle(item.id)}
                            className="h-5 w-5 mt-0.5 rounded border-slate-300 text-primary-600 focus:ring-primary-500 flex-shrink-0"
                        />
                        <div className="flex-grow">
                             <input
                                type="text"
                                value={item.title}
                                onChange={e => handleTextChange(item.id, e.target.value)}
                                className="w-full bg-transparent text-sm text-slate-800 dark:text-slate-200 border-none p-0 focus:ring-0"
                            />
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.suggestion}</p>
                        </div>
                    </div>
                ))}
                </>
            )}
        </div>

        {!isWarning && (
            <div className="flex justify-end space-x-3 pt-6 border-t border-slate-200 dark:border-slate-700 mt-6">
                <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium rounded-md text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600"
                >
                Hủy
                </button>
                <button
                type="button"
                onClick={handleApply}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 disabled:bg-slate-400"
                disabled={selectedIds.size === 0}
                >
                Thêm {selectedIds.size > 0 ? `(${selectedIds.size})` : ''} mục vào checklist
                </button>
            </div>
        )}
      </div>
    </div>
  );
};