import React, { useState, useEffect } from 'react';
import { LateReason } from '../types';
import { LATE_REASON_OPTIONS } from '../constants';
import { ClipboardCheckIcon } from './icons/IconComponents';

interface RootCauseModalProps {
  isOpen: boolean;
  taskName: string;
  onClose: () => void;
  onSubmit: (reason: LateReason, note?: string) => void;
}

export const RootCauseModal: React.FC<RootCauseModalProps> = ({ isOpen, taskName, onClose, onSubmit }) => {
  const [reason, setReason] = useState<LateReason | ''>('');
  const [otherNote, setOtherNote] = useState('');

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setOtherNote('');
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) {
      alert('Vui lòng chọn một nguyên nhân.');
      return;
    }
    if (reason === LateReason.Other && !otherNote.trim()) {
      alert('Vui lòng điền ghi chú cho "Nguyên nhân khác".');
      return;
    }
    onSubmit(reason, otherNote);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-lg p-6">
        <div className="flex items-center">
          <div className="bg-yellow-100 dark:bg-yellow-900 p-2 rounded-full mr-4">
            <ClipboardCheckIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-300" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Task hoàn thành trễ</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">Chọn nguyên nhân cho: <span className="font-semibold">{taskName}</span></p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Vui lòng chọn lý do chính khiến task này bị trễ:
            </label>
            <div className="space-y-2">
              {LATE_REASON_OPTIONS.map(opt => (
                <label key={opt} className="flex items-center p-3 rounded-md border border-slate-200 dark:border-slate-700 has-[:checked]:bg-primary-50 has-[:checked]:border-primary-300 dark:has-[:checked]:bg-primary-900/20 dark:has-[:checked]:border-primary-700">
                  <input
                    type="radio"
                    name="root-cause"
                    value={opt}
                    checked={reason === opt}
                    onChange={() => setReason(opt)}
                    className="h-4 w-4 text-primary-600 border-slate-300 focus:ring-primary-500"
                  />
                  <span className="ml-3 text-sm text-slate-700 dark:text-slate-200">{opt}</span>
                </label>
              ))}
            </div>
          </div>

          {reason === LateReason.Other && (
            <div>
              <label htmlFor="other-note" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Ghi chú (Nguyên nhân khác)
              </label>
              <textarea
                id="other-note"
                value={otherNote}
                onChange={(e) => setOtherNote(e.target.value)}
                rows={3}
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Vui lòng mô tả rõ hơn..."
                required
              />
            </div>
          )}

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
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 disabled:bg-slate-400"
              disabled={!reason}
            >
              Xác nhận & Hoàn thành
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};