import React from 'react';
import { PencilIcon, TrashIcon, XCircleIcon } from './icons/IconComponents';

interface BulkActionBarProps {
  count: number;
  onEdit: () => void;
  onDelete: () => void;
  onClear: () => void;
}

export const BulkActionBar: React.FC<BulkActionBarProps> = ({ count, onEdit, onDelete, onClear }) => {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-auto max-w-lg z-40">
      <div className="bg-slate-900 dark:bg-slate-950/95 backdrop-blur-sm border border-slate-700/50 text-white rounded-lg shadow-2xl flex items-center justify-between p-3 space-x-6 animate-fade-in-up">
        <span className="font-semibold text-sm px-2">{count} task{count > 1 ? 's' : ''} được chọn</span>
        <div className="flex items-center space-x-2">
          <button onClick={onEdit} className="p-2 rounded-md hover:bg-slate-700/50 dark:hover:bg-slate-800/50 transition-colors" title="Chỉnh sửa các task đã chọn">
            <PencilIcon className="h-5 w-5" />
          </button>
          <button onClick={onDelete} className="p-2 rounded-md hover:bg-slate-700/50 dark:hover:bg-slate-800/50 transition-colors" title="Xóa các task đã chọn">
            <TrashIcon className="h-5 w-5 text-red-400" />
          </button>
        </div>
        <button onClick={onClear} className="p-2 rounded-md hover:bg-slate-700/50 dark:hover:bg-slate-800/50 transition-colors" title="Bỏ chọn">
          <XCircleIcon className="h-6 w-6" />
        </button>
      </div>
       <style>{`
        @keyframes fade-in-up {
          0% {
            opacity: 0;
            transform: translate(-50%, 20px);
          }
          100% {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};