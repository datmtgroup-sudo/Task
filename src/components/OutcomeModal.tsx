import React, { useState, useEffect } from 'react';
import { ClipboardCheckIcon, PlusCircleIcon, XCircleIcon } from './icons/IconComponents';
import { TaskOutcome } from '../types';

interface OutcomeModalProps {
  isOpen: boolean;
  taskName: string;
  onClose: () => void;
  onSubmit: (outcome: TaskOutcome) => void;
}

export const OutcomeModal: React.FC<OutcomeModalProps> = ({ isOpen, taskName, onClose, onSubmit }) => {
  const [summary, setSummary] = useState('');
  const [links, setLinks] = useState<{ url: string; label: string }[]>([]);
  const [metrics, setMetrics] = useState<{ key: string; value: string }[]>([]);

  useEffect(() => {
    if (isOpen) {
      setSummary('');
      setLinks([]);
      setMetrics([]);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (summary.trim()) {
      onSubmit({
        summary,
        links: links.filter(l => l.url.trim()),
        metrics: metrics.filter(m => m.key.trim() && m.value.trim()),
      });
    }
  };
  
  const handleUpdateLink = (index: number, field: 'url' | 'label', value: string) => {
      const newLinks = [...links];
      newLinks[index][field] = value;
      setLinks(newLinks);
  };
  
  const handleAddLink = () => setLinks([...links, { url: '', label: '' }]);
  const handleRemoveLink = (index: number) => setLinks(links.filter((_, i) => i !== index));

  const handleUpdateMetric = (index: number, field: 'key' | 'value', value: string) => {
      const newMetrics = [...metrics];
      newMetrics[index][field] = value;
      setMetrics(newMetrics);
  };
  
  const handleAddMetric = () => setMetrics([...metrics, { key: '', value: '' }]);
  const handleRemoveMetric = (index: number) => setMetrics(metrics.filter((_, i) => i !== index));


  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl p-6 transform transition-all" onClick={e => e.stopPropagation()}>
        <div className="flex items-center">
            <div className="bg-green-100 dark:bg-green-900 p-2 rounded-full mr-4">
                <ClipboardCheckIcon className="h-6 w-6 text-green-600 dark:text-green-300" />
            </div>
            <div>
                 <h2 className="text-xl font-bold text-slate-900 dark:text-white">Hoàn thành công việc</h2>
                 <p className="text-sm text-slate-600 dark:text-slate-400">Tóm tắt kết quả cho: <span className="font-semibold">{taskName}</span></p>
            </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6 max-h-[70vh] overflow-y-auto pr-2">
          <div>
            <label htmlFor="outcome-summary" className="label">Tóm tắt Kết quả / Outcome</label>
            <textarea
              id="outcome-summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={4}
              className="form-input"
              placeholder="- Đã giao được cái gì? (VD: file thiết kế, link bài đăng...)- Có quyết định quan trọng nào được đưa ra không?"
              required
              autoFocus
            ></textarea>
          </div>
          
          <div>
            <label className="label">Links liên quan</label>
            <div className="space-y-2">
              {links.map((link, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input type="text" value={link.url} onChange={e => handleUpdateLink(index, 'url', e.target.value)} placeholder="URL" className="form-input flex-grow"/>
                  <input type="text" value={link.label} onChange={e => handleUpdateLink(index, 'label', e.target.value)} placeholder="Tên hiển thị (tùy chọn)" className="form-input flex-grow"/>
                  <button type="button" onClick={() => handleRemoveLink(index)}><XCircleIcon className="h-5 w-5 text-red-500"/></button>
                </div>
              ))}
              <button type="button" onClick={handleAddLink} className="flex items-center text-sm font-medium text-primary-600 hover:text-primary-800"><PlusCircleIcon className="h-5 w-5 mr-1"/>Thêm Link</button>
            </div>
          </div>
          
           <div>
            <label className="label">Các chỉ số chính</label>
            <div className="space-y-2">
              {metrics.map((metric, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input type="text" value={metric.key} onChange={e => handleUpdateMetric(index, 'key', e.target.value)} placeholder="Tên chỉ số (VD: Views)" className="form-input flex-grow"/>
                  <input type="text" value={metric.value} onChange={e => handleUpdateMetric(index, 'value', e.target.value)} placeholder="Giá trị (VD: 10,000)" className="form-input flex-grow"/>
                  <button type="button" onClick={() => handleRemoveMetric(index)}><XCircleIcon className="h-5 w-5 text-red-500"/></button>
                </div>
              ))}
              <button type="button" onClick={handleAddMetric} className="flex items-center text-sm font-medium text-primary-600 hover:text-primary-800"><PlusCircleIcon className="h-5 w-5 mr-1"/>Thêm chỉ số</button>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-md text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
            >
              Lưu & Hoàn thành
            </button>
          </div>
        </form>
         <style>{`
            .label { @apply block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1; }
            .form-input { @apply block w-full px-3 py-2 bg-white dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500; }
        `}</style>
      </div>
    </div>
  );
};