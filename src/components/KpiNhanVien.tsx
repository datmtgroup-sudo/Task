

import React from 'react';
import { KpiData } from '../types';

interface KpiNhanVienProps {
  data: Record<string, KpiData>;
}

const ProgressBar: React.FC<{ progress: number }> = ({ progress }) => (
    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
        <div className="bg-primary-500 h-2 rounded-full" style={{ width: `${progress}%` }}></div>
    </div>
);

export const KpiNhanVien: React.FC<KpiNhanVienProps> = ({ data }) => {
  const sortedAssignees = Object.keys(data).sort();
  return (
    <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-card">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">KPI Theo Nhân viên</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-slate-50 dark:bg-slate-700/50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nhân viên</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">KPI Tổng (Weighted)</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Điểm Weighted (Done/Total)</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">KPI Plan</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">KPI Ad-hoc</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-800">
            {sortedAssignees.map((assignee) => {
                const kpi = data[assignee];
                return (
                    <tr key={assignee} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">{assignee}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">
                            <div className="flex items-center">
                                <div className="w-24 mr-3">
                                    <ProgressBar progress={kpi.kpiWeighted * 100} />
                                </div>
                                <span className="font-semibold">{(kpi.kpiWeighted * 100).toFixed(1)}%</span>
                            </div>
                        </td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">{kpi.doneWeighted.toFixed(1)} / {kpi.totalWeighted.toFixed(1)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">{(kpi.kpiPlan * 100).toFixed(1)}%</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">{(kpi.kpiAdhoc * 100).toFixed(1)}%</td>
                    </tr>
                );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};