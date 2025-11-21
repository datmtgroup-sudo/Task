import React, { useState, useEffect } from 'react';
import { Rule, TriggerType, RuleCondition, RuleAction, ActionType, ConditionField, ConditionOperator, TaskStatus, Priority, WorkType } from '../types';
import { TRIGGER_TYPE_OPTIONS, CONDITION_FIELD_OPTIONS, CONDITION_OPERATOR_OPTIONS, ACTION_TYPE_OPTIONS, TASK_STATUS_OPTIONS, PRIORITY_OPTIONS, WORK_TYPE_OPTIONS } from '../constants';
import { PlusCircleIcon, XCircleIcon } from './icons/IconComponents';

interface RuleEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rule: Rule) => void;
  initialRule: Rule | null;
  assignees: string[];
  projects: string[];
}

const EMPTY_CONDITION: RuleCondition = { field: ConditionField.Status, operator: ConditionOperator.Is, value: TaskStatus.Todo };
const EMPTY_RULE: Omit<Rule, 'id'> = {
    name: '',
    trigger: TriggerType.TaskCreated,
    conditions: [EMPTY_CONDITION],
    action: { type: ActionType.ChangeStatus, value: TaskStatus.Doing },
    priority: 10,
    isEnabled: true,
};

export const RuleEditorModal: React.FC<RuleEditorModalProps> = ({ isOpen, onClose, onSave, initialRule, assignees, projects }) => {
    const [rule, setRule] = useState<Omit<Rule, 'id'>>({ ...EMPTY_RULE, conditions: [{...EMPTY_CONDITION}] });
    const [ruleId, setRuleId] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            if (initialRule) {
                setRule({ ...initialRule });
                setRuleId(initialRule.id);
            } else {
                setRule({ ...EMPTY_RULE, conditions: [{...EMPTY_CONDITION}] });
                setRuleId(null);
            }
        }
    }, [isOpen, initialRule]);

    if (!isOpen) return null;

    const handleFieldChange = <K extends keyof Omit<Rule, 'id'>>(field: K, value: Omit<Rule, 'id'>[K]) => {
        setRule(prev => ({ ...prev, [field]: value }));
    };

    const handleConditionChange = (index: number, changes: Partial<RuleCondition>) => {
        const newConditions = [...rule.conditions];
        newConditions[index] = { ...newConditions[index], ...changes };
        setRule(prev => ({ ...prev, conditions: newConditions }));
    };
    
    const addCondition = () => {
        setRule(prev => ({ ...prev, conditions: [...prev.conditions, {...EMPTY_CONDITION}] }));
    };

    const removeCondition = (index: number) => {
        const newConditions = rule.conditions.filter((_, i) => i !== index);
        setRule(prev => ({ ...prev, conditions: newConditions }));
    };
    
    const handleActionChange = (changes: Partial<RuleAction>) => {
        setRule(prev => ({ ...prev, action: { ...prev.action, ...changes }}));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalRule: Rule = {
            ...rule,
            id: ruleId || `rule-${Date.now()}`,
        };
        onSave(finalRule);
    };

    const getValueOptions = (field: ConditionField): string[] => {
        switch (field) {
            case ConditionField.Status: return TASK_STATUS_OPTIONS;
            case ConditionField.Priority: return PRIORITY_OPTIONS;
            case ConditionField.WorkType: return WORK_TYPE_OPTIONS;
            case ConditionField.Project: return projects;
            default: return [];
        }
    };
    
    const getActionValueOptions = (type: ActionType): string[] => {
        switch (type) {
            case ActionType.ChangeStatus: return TASK_STATUS_OPTIONS;
            case ActionType.SetAssignee: return assignees;
            default: return [];
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl p-6 transform transition-all" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">{ruleId ? 'Chỉnh sửa quy tắc' : 'Tạo quy tắc mới'}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                        <XCircleIcon className="h-6 w-6 text-slate-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="mt-6 space-y-6 max-h-[70vh] overflow-y-auto pr-2">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="rule-name" className="label">Tên quy tắc</label>
                            <input type="text" id="rule-name" value={rule.name} onChange={e => handleFieldChange('name', e.target.value)} required className="form-input" />
                        </div>
                        <div>
                            <label htmlFor="rule-priority" className="label">Độ ưu tiên</label>
                            <input type="number" id="rule-priority" value={rule.priority} onChange={e => handleFieldChange('priority', parseInt(e.target.value, 10))} required className="form-input" min="1" />
                            <p className="mt-1 text-xs text-slate-500">Số nhỏ hơn sẽ chạy trước.</p>
                        </div>
                    </div>

                    {/* Trigger */}
                    <div>
                        <label htmlFor="rule-trigger" className="label">KHI (Trigger)</label>
                        <select id="rule-trigger" value={rule.trigger} onChange={e => handleFieldChange('trigger', e.target.value as TriggerType)} className="form-select">
                            {TRIGGER_TYPE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                    </div>

                    {/* Conditions */}
                    <div>
                        <label className="label">NẾU (Conditions)</label>
                        <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-md border border-slate-200 dark:border-slate-700">
                            {rule.conditions.map((cond, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                    <select value={cond.field} onChange={e => handleConditionChange(index, { field: e.target.value as ConditionField })} className="form-select flex-1">
                                        {CONDITION_FIELD_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                    <select value={cond.operator} onChange={e => handleConditionChange(index, { operator: e.target.value as ConditionOperator })} className="form-select w-24">
                                        {CONDITION_OPERATOR_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                    <select value={cond.value} onChange={e => handleConditionChange(index, { value: e.target.value })} className="form-select flex-1">
                                        {getValueOptions(cond.field).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                    <button type="button" onClick={() => removeCondition(index)} className="text-red-500 hover:text-red-700">
                                        <XCircleIcon className="h-6 w-6" />
                                    </button>
                                </div>
                            ))}
                             <button type="button" onClick={addCondition} className="flex items-center text-sm font-medium text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300">
                                <PlusCircleIcon className="h-5 w-5 mr-1" /> Thêm điều kiện
                            </button>
                        </div>
                    </div>

                    {/* Action */}
                    <div>
                        <label className="label">THÌ (Action)</label>
                         <div className="flex items-center space-x-2 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-md border border-slate-200 dark:border-slate-700">
                            <select value={rule.action.type} onChange={e => handleActionChange({ type: e.target.value as ActionType })} className="form-select flex-1">
                                {ACTION_TYPE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                             <select value={rule.action.value} onChange={e => handleActionChange({ value: e.target.value })} className="form-select flex-1">
                                {getActionValueOptions(rule.action.type).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                    </div>
                    
                    {/* Buttons */}
                    <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <button type="button" onClick={onClose} className="btn-secondary">Hủy</button>
                        <button type="submit" className="btn-primary">Lưu Quy tắc</button>
                    </div>
                </form>
            </div>
            <style>{`
                .label { @apply block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1; }
                .form-input { @apply mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500; }
                .form-select { @apply mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md; }
                .btn-primary { @apply inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500; }
                .btn-secondary { @apply py-2 px-6 border border-slate-300 dark:border-slate-600 shadow-sm text-sm font-medium rounded-md text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500; }
            `}</style>
        </div>
    );
};
