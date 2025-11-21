import React, { useState } from 'react';
import { Task } from '../types';
import { ListBulletIcon, UserIcon, KanbanIcon, CalendarIcon } from './icons/IconComponents';

interface EditableListProps {
    title: string;
    icon: React.ReactNode;
    items: string[];
    noun: string; // e.g., 'nhân sự', 'dự án'
    onAddItem: (item: string) => void;
    onUpdateItem: (oldItem: string, newItem: string) => void;
    onDeleteItem: (item: string) => void;
}

const EditableList: React.FC<EditableListProps> = ({ title, icon, items, noun, onAddItem, onUpdateItem, onDeleteItem }) => {
    const [newItem, setNewItem] = useState('');
    const [editingItem, setEditingItem] = useState<{ old: string; current: string } | null>(null);

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (newItem.trim()) {
            onAddItem(newItem.trim());
            setNewItem('');
        }
    };

    const handleSaveEdit = () => {
        if (editingItem && editingItem.current.trim() && editingItem.old !== editingItem.current.trim()) {
            onUpdateItem(editingItem.old, editingItem.current.trim());
        }
        setEditingItem(null);
    };
    
    const handleDelete = (item: string) => {
        if (window.confirm(`Bạn có chắc muốn xóa "${item}"?`)) {
            onDeleteItem(item);
        }
    }

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center">
                {icon} <span className="ml-2">{title}</span>
            </h3>
            <div className="space-y-2 mb-4">
                {items.map(item => (
                    <div key={item} className="flex items-center justify-between p-2 rounded-md bg-slate-50 dark:bg-slate-700/50">
                        {editingItem?.old === item ? (
                            <input
                                type="text"
                                value={editingItem.current}
                                onChange={e => setEditingItem({ ...editingItem, current: e.target.value })}
                                className="flex-grow bg-white dark:bg-slate-600 border border-primary-300 rounded-md px-2 py-1 text-sm"
                                autoFocus
                            />
                        ) : (
                            <span className="text-sm text-slate-800 dark:text-slate-200">{item}</span>
                        )}
                        <div className="flex items-center space-x-2 ml-4">
                            {editingItem?.old === item ? (
                                <>
                                    <button onClick={handleSaveEdit} className="text-green-600 hover:text-green-800 text-sm font-medium">Lưu</button>
                                    <button onClick={() => setEditingItem(null)} className="text-slate-500 hover:text-slate-700 text-sm">Hủy</button>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => setEditingItem({ old: item, current: item })} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Sửa</button>
                                    <button onClick={() => handleDelete(item)} className="text-red-600 hover:text-red-800 text-sm">Xóa</button>
                                </>
                            )}
                        </div>
                    </div>
                ))}
                {items.length === 0 && <p className="text-sm text-slate-500 text-center py-2">Chưa có {noun} nào.</p>}
            </div>
            <form onSubmit={handleAdd} className="flex space-x-2">
                <input
                    type="text"
                    value={newItem}
                    onChange={e => setNewItem(e.target.value)}
                    placeholder={`Thêm ${noun} mới...`}
                    className="flex-grow mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
                <button type="submit" className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700">Thêm</button>
            </form>
        </div>
    );
};

interface MasterDataViewProps {
    tasks: Task[];
    assignees: string[];
    onAddAssignee: (item: string) => void;
    onUpdateAssignee: (oldItem: string, newItem: string) => void;
    onDeleteAssignee: (item: string) => void;
    
    projects: string[];
    onAddProject: (item: string) => void;
    onUpdateProject: (oldItem: string, newItem: string) => void;
    onDeleteProject: (item: string) => void;

    periods: string[];
    onAddPeriod: (item: string) => void;
    onUpdatePeriod: (oldItem: string, newItem: string) => void;
    onDeletePeriod: (item: string) => void;
}

export const MasterDataView: React.FC<MasterDataViewProps> = (props) => {
    return (
        <div className="space-y-8">
            <div className="flex items-center">
                <ListBulletIcon className="h-6 w-6 text-primary-500 mr-3" />
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Quản lý Dữ liệu gốc</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <EditableList
                    title="Quản lý Nhân sự"
                    icon={<UserIcon className="h-5 w-5 text-slate-500"/>}
                    items={props.assignees}
                    noun="nhân sự"
                    onAddItem={props.onAddAssignee}
                    onUpdateItem={props.onUpdateAssignee}
                    onDeleteItem={props.onDeleteAssignee}
                />
                <EditableList
                    title="Quản lý Dự án"
                    icon={<KanbanIcon className="h-5 w-5 text-slate-500"/>}
                    items={props.projects}
                    noun="dự án"
                    onAddItem={props.onAddProject}
                    onUpdateItem={props.onUpdateProject}
                    onDeleteItem={props.onDeleteProject}
                />
                <EditableList
                    title="Quản lý Kỳ làm việc"
                    icon={<CalendarIcon className="h-5 w-5 text-slate-500"/>}
                    items={props.periods}
                    noun="kỳ"
                    onAddItem={props.onAddPeriod}
                    onUpdateItem={props.onUpdatePeriod}
                    onDeleteItem={props.onDeletePeriod}
                />
            </div>
        </div>
    );
};