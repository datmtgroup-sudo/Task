import React from 'react';

interface KpiStatCardProps {
  title: string;
  value: string;
  description?: string;
  icon: React.ReactNode;
  iconBgColor: string;
  progress?: number;
  progressColor?: string;
}

export const KpiStatCard: React.FC<KpiStatCardProps> = ({ 
    title, 
    value, 
    description, 
    icon, 
    iconBgColor, 
    progress, 
    progressColor = 'bg-primary-500' 
}) => {
  return (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 group">
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-lg ${iconBgColor}`}>
          {icon}
        </div>
      </div>
      <div className="mt-4">
        <p className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{value}</p>
        <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">{title}</h3>
      </div>
      <div className="mt-5">
        {progress !== undefined && (
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
            <div
              className={`${progressColor} h-1.5 rounded-full`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            ></div>
          </div>
        )}
        {description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{description}</p>}
      </div>
    </div>
  );
};