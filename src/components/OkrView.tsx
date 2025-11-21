
import React, { useState, useMemo } from 'react';
import { Objective, KeyResult, Task, OkrLevel } from '../types';
import { OkrIcon, ChevronDownIcon, PlusCircleIcon, PencilIcon, ListBulletIcon } from './icons/IconComponents';

type ProcessedObjective = Objective & { progress: number; children: ProcessedObjective[] };

interface OkrViewProps {
    objectiveTree: ProcessedObjective[];
    keyResultsByObjectiveId: Record<string, (KeyResult & { progress: number })[]>;
    tasksByKrId: Record<string, Task[]>;
    allObjectives: Objective[];
    periods: string[];
    assignees: string[];
    onAddObjective: (objective: Omit<Objective, 'id'>) => void;
    onUpdateObjective: (objective: Objective) => void;
    onAddKeyResult: (keyResult: Omit<KeyResult, 'id'>) => void;
    onUpdateKeyResult: (keyResult: KeyResult) => void;
}

const ProgressBar: React.FC<{ progress: number }> = ({ progress }) => {
    const bgColor = progress < 40 ? 'bg-red-500' : progress < 70 ? 'bg-yellow-500' : 'bg-green-500';
    return (
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
            <div
                className={`${bgColor} h-2.5 rounded-full transition-all duration-500`}
                style={{ width: `${progress}%` }}
            ></div>
        </div>
    );
};

const KeyResultCard: React.FC<{ kr: KeyResult & { progress: number }, tasks: Task[], onEdit: () => void }> = ({ kr, tasks, onEdit }) => (
    <div className="bg-white dark:bg-slate-800/70 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-start gap-4">
            <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">{kr.title}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Owner: {kr.owner}</p>
            </div>
            <button onClick={onEdit} className="text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 p-1">
                <PencilIcon className="h-4 w-4" />
            </button>
        </div>
        <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700 dark:text-slate-300">{kr.progress.toFixed(0)}%</span>
                <span className="text-slate-500">{kr.currentValue} / {kr.targetValue} ({kr.unit})</span>
            </div>
            <ProgressBar progress={kr.progress} />
        </div>
        {tasks.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <h5 className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center">
                    <ListBulletIcon className="h-4 w-4 mr-1.5"/>
                    Công việc liên quan
                </h5>
                <ul className="mt-1 space-y-1">
                    {tasks.map(task => (
                        <li key={task.id} className="text-sm text-slate-500 dark:text-slate-400 truncate">
                            - {task.name}
                        </li>
                    ))}
                </ul>
            </div>
        )}
    </div>
);

const ObjectiveNode: React.FC<Omit<OkrViewProps, 'objectiveTree' | 'periods'> & { objective: ProcessedObjective, level: number, onEditObjective: () => void, onAddKeyResult: () => void }> = (props) => {
    const { objective, level, keyResultsByObjectiveId, tasksByKrId, onEditObjective, onAddKeyResult, onUpdateKeyResult, allObjectives, assignees, onAddObjective, onUpdateObjective } = props;
    const [isExpanded, setIsExpanded] = useState(level < 2);
    const keyResults = keyResultsByObjectiveId[objective.id] || [];

    return (
        <div style={{ marginLeft: `${level * 2}rem` }} className="space-y-4">
            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => setIsExpanded(!isExpanded)} className="p-1">
                        <ChevronDownIcon className={`h-5 w-5 text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">{objective.title}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{objective.level} • Owner: {objective.owner}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button onClick={onEditObjective} className="text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 p-1"><PencilIcon className="h-5 w-5" /></button>
                                <button onClick={onAddKeyResult} className="flex items-center text-sm font-medium text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300">
                                    <PlusCircleIcon className="h-5 w-5 mr-1" /> Thêm KR
                                </button>
                            </div>
                        </div>
                         <div className="mt-3 flex items-center gap-4">
                            <span className="font-semibold text-slate-800 dark:text-slate-200 w-12">{objective.progress.toFixed(0)}%</span>
                            <ProgressBar progress={objective.progress} />
                        </div>
                    </div>
                </div>
            </div>

            {isExpanded && (
                <div className="pl-8 pr-2 space-y-4 border-l-2 border-slate-200 dark:border-slate-700 ml-6">
                    {keyResults.map(kr => (
                       <KeyResultCard 
                          key={kr.id} 
                          kr={kr} 
                          tasks={tasksByKrId[kr.id] || []}
                          onEdit={() => {/* TODO: Implement edit functionality for KRs */}}
                       />
                    ))}
                    {objective.children.map(childObj => (
                        <ObjectiveNode 
                            key={childObj.id}
                            objective={childObj}
                            level={0} // Children are visually indented but logically at the next level
                            keyResultsByObjectiveId={keyResultsByObjectiveId}
                            tasksByKrId={tasksByKrId}
                            allObjectives={allObjectives}
                            assignees={assignees}
                            onAddObjective={onAddObjective}
                            onUpdateObjective={onUpdateObjective}
                            onAddKeyResult={() => {}}
                            onUpdateKeyResult={onUpdateKeyResult}
                            onEditObjective={() => {}}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};


export const OkrView: React.FC<OkrViewProps> = (props) => {
    const [selectedPeriod, setSelectedPeriod] = useState<string>(props.periods[0] || '');

    const filteredTree = useMemo(() => {
        return props.objectiveTree.filter(obj => obj.period === selectedPeriod);
    }, [props.objectiveTree, selectedPeriod]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="flex items-center">
                    <OkrIcon className="h-8 w-8 text-primary-500 mr-3" />
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Mục tiêu (OKR)</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Theo dõi mục tiêu và kết quả then chốt của toàn công ty.</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <select
                        value={selectedPeriod}
                        onChange={e => setSelectedPeriod(e.target.value)}
                        className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                    >
                        {props.periods.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <button className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700">
                        Thêm Mục tiêu Công ty
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                {filteredTree.map(objective => (
                    <ObjectiveNode 
                        key={objective.id} 
                        objective={objective} 
                        level={0}
                        {...props}
                        onEditObjective={() => {}} // Placeholder
                        onAddKeyResult={() => {}} // Placeholder
                    />
                ))}
                {filteredTree.length === 0 && (
                    <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-dashed border-slate-300 dark:border-slate-700">
                         <OkrIcon className="mx-auto h-12 w-12 text-slate-400" />
                        <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-white">Không có mục tiêu nào</h3>
                        <p className="mt-1 text-sm text-slate-500">Bắt đầu bằng cách thêm một mục tiêu cho công ty trong kỳ này.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
