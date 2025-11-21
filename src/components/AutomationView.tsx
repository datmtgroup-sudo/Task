import React from 'react';
import { Rule, LogEntry } from '../types';
import { AutomationIcon, LogIcon, SparklesIcon, PencilIcon, DocumentDuplicateIcon, TrashIcon } from './icons/IconComponents';

interface AutomationViewProps {
    rules: Rule[];
    logs: LogEntry[];
    onOpenEditor: (rule: Rule | null) => void;
    onDeleteRule: (ruleId: string) => void;
    onToggleRule: (ruleId: string) => void;
    onCloneRule: (rule: Rule) => void;
}

const RuleCard: React.FC<{ rule: Rule, onEdit: () => void, onDelete: () => void, onToggle: () => void, onClone: () => void }> = ({ rule, onEdit, onDelete, onToggle, onClone }) => (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 flex items-start space-x-4">
        <div className={`p-2 rounded-full ${rule.isEnabled ? 'bg-green-100 dark:bg-green-900' : 'bg-slate-100 dark:bg-slate-700'}`}>
            <SparklesIcon className={`h-6 w-6 ${rule.isEnabled ? 'text-green-600' : 'text-slate-400'}`} />
        </div>
        <div className="flex-1">
            <div className="flex justify-between items-start">
                <h4 className="font-semibold text-slate-800 dark:text-slate-100 mr-4">{rule.name}</h4>
                <div className="flex items-center space-x-3 flex-shrink-0">
                    <span className="text-xs text-slate-400">Ưu tiên: {rule.priority}</span>
                    <label htmlFor={`toggle-${rule.id}`} className="flex items-center cursor-pointer" title={rule.isEnabled ? "Vô hiệu hóa" : "Kích hoạt"}>
                        <div className="relative" onClick={(e) => { e.stopPropagation(); onToggle(); }}>
                            <input type="checkbox" id={`toggle-${rule.id}`} className="sr-only" checked={rule.isEnabled} readOnly />
                            <div className={`block w-10 h-6 rounded-full ${rule.isEnabled ? 'bg-primary-500' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                            <div className={`dot absolute top-1 bg-white w-4 h-4 rounded-full transition-transform ${rule.isEnabled ? 'transform translate-x-full left-0' : 'left-1'}`}></div>
                        </div>
                    </label>
                </div>
            </div>
            <div className="mt-2 text-sm text-slate-600 dark:text-slate-400 space-y-1">
                <p><strong>Khi:</strong> <span className="font-mono bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">{rule.trigger}</span></p>
                <p><strong>Nếu:</strong> <span className="font-mono bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">{rule.conditions.map(c => `${c.field} ${c.operator.toLowerCase()} "${c.value}"`).join(' AND ')}</span></p>
                <p><strong>Thì:</strong> <span className="font-mono bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">{rule.action.type.toLowerCase().replace('_', ' ')} thành "{rule.action.value}"</span></p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end space-x-4">
                <button onClick={onEdit} className="flex items-center text-sm font-medium text-slate-600 hover:text-primary-600 dark:text-slate-300 dark:hover:text-primary-400">
                    <PencilIcon className="h-4 w-4 mr-1.5" /> Sửa
                </button>
                 <button onClick={onClone} className="flex items-center text-sm font-medium text-slate-600 hover:text-primary-600 dark:text-slate-300 dark:hover:text-primary-400">
                    <DocumentDuplicateIcon className="h-4 w-4 mr-1.5" /> Nhân bản
                </button>
                <button onClick={onDelete} className="flex items-center text-sm font-medium text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
                    <TrashIcon className="h-4 w-4 mr-1.5" /> Xóa
                </button>
            </div>
        </div>
    </div>
);

const LogItem: React.FC<{ log: LogEntry }> = ({ log }) => (
    <div className="flex items-start space-x-3 py-3 border-b border-slate-200 dark:border-slate-700 last:border-b-0">
        <div className="mt-0.5">
          {log.message.startsWith('Cảnh báo') ? 
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.636-1.1 2.152-1.1 2.788 0l5.866 10.132c.636 1.1-.122 2.519-1.394 2.519H3.785c-1.272 0-2.03-1.419-1.394-2.519L8.257 3.099zM10 12a1 1 0 110-2 1 1 0 010 2zm-1-3a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            : 
            <SparklesIcon className="h-5 w-5 text-slate-400" />
          }
        </div>
        <div>
            <p className={`text-sm ${log.message.startsWith('Cảnh báo') ? 'text-yellow-700 dark:text-yellow-300' : 'text-slate-700 dark:text-slate-300'}`}>{log.message}</p>
            <p className="text-xs text-slate-500">{new Date(log.timestamp).toLocaleString()}</p>
        </div>
    </div>
);


export const AutomationView: React.FC<AutomationViewProps> = ({ rules, logs, onOpenEditor, onDeleteRule, onToggleRule, onCloneRule }) => {
    const reversedLogs = [...logs].reverse();
    return (
        <div className="space-y-8">
            <div>
                <div className="flex items-center mb-4">
                     <AutomationIcon className="h-6 w-6 text-primary-500 mr-3" />
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Quy tắc tự động hóa</h2>
                </div>
                 <div className="space-y-4">
                    {rules.sort((a,b) => a.priority - b.priority).map(rule => 
                        <RuleCard 
                            key={rule.id} 
                            rule={rule}
                            onEdit={() => onOpenEditor(rule)}
                            onDelete={() => onDeleteRule(rule.id)}
                            onToggle={() => onToggleRule(rule.id)}
                            onClone={() => onCloneRule(rule)}
                        />
                    )}
                </div>
                 <div className="mt-6">
                    <button onClick={() => onOpenEditor(null)} className="w-full text-center py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition">
                        + Tạo quy tắc mới
                    </button>
                </div>
            </div>

            <div>
                 <div className="flex items-center mb-4">
                     <LogIcon className="h-6 w-6 text-primary-500 mr-3" />
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Nhật ký hoạt động tự động</h2>
                </div>
                <div className="bg-white dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700 max-h-96 overflow-y-auto">
                   {reversedLogs.length > 0 ? reversedLogs.map(log => <LogItem key={log.id} log={log} />) : <p className="text-sm text-center text-slate-500 py-4">Chưa có hoạt động nào được ghi lại.</p>}
                </div>
            </div>

        </div>
    );
};