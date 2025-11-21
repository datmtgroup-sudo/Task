


import React from 'react';
import { ForecastData } from '../types';
import { KpiStatCard } from './KpiCard';
import { ForecastIcon, KpiPointsIcon, CalendarIcon } from './icons/IconComponents';

interface ForecastProps {
  data: ForecastData;
  target: number;
  daysPassed: number;
  totalDays: number;
}

export const Forecast: React.FC<ForecastProps> = ({ data, target, daysPassed, totalDays }) => {
    const isBelowTarget = data.forecastedKpi < target && data.kpiWeighted < 1;
    const warningMessage = `Giữ tốc độ hiện tại, dự báo cuối kỳ khó đạt mục tiêu (${(target * 100)}%).`;

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-card">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Dự báo KPI (Forecast)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <KpiStatCard 
                title="Dự báo KPI cuối kỳ"
                value={`${(data.forecastedKpi * 100).toFixed(1)}%`}
                description={`Mục tiêu: ${(target*100)}%`}
                progress={data.forecastedKpi * 100}
                progressColor={isBelowTarget ? "bg-red-500" : "bg-primary-500"}
                icon={<ForecastIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />}
                iconBgColor="bg-primary-100 dark:bg-primary-500/10"
            />
             <KpiStatCard 
                title="Tốc độ trung bình/ngày"
                value={`${data.velocity.toFixed(2)}`}
                description="Điểm weighted hoàn thành"
                icon={<KpiPointsIcon className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />}
                iconBgColor="bg-cyan-100 dark:bg-cyan-500/10"
            />
            <KpiStatCard 
                title="Hiệu suất / Thời gian"
                value={`${(data.doneWeighted > 0 && daysPassed > 0 && totalDays > 0) ? ((data.doneWeighted/data.totalWeighted) / (daysPassed / totalDays)).toFixed(2) : "N/A"}`}
                description="Tỷ lệ hoàn thành so với thời gian đã trôi qua"
                icon={<CalendarIcon className="h-6 w-6 text-pink-600 dark:text-pink-400" />}
                iconBgColor="bg-pink-100 dark:bg-pink-500/10"
            />
        </div>
        {isBelowTarget && (
             <div className="bg-red-50 dark:bg-red-500/10 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 rounded-r-md" role="alert">
                <p className="font-bold">Cảnh báo</p>
                <p>{warningMessage}</p>
            </div>
        )}
    </div>
  );
};