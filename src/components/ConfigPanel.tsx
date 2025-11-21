

import React from 'react';
import { Config } from '../types';

interface ConfigPanelProps {
  config: Config;
  onConfigChange: (newConfig: Config) => void;
}

const ConfigInput: React.FC<{ label: string, value: number, onChange: (value: number) => void, step?: number, min?: number, max?: number, isPercentage?: boolean }> = ({ label, value, onChange, step = 0.1, min = 0, max = 1, isPercentage=true }) => {
    const displayValue = isPercentage ? `${(value * 100).toFixed(0)}%` : value;
    return (
        <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{label} <span className="font-bold text-primary-600 dark:text-primary-400">{displayValue}</span></label>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-600 mt-2"
            />
        </div>
    );
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({ config, onConfigChange }) => {
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-card">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Cấu hình (Config)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ConfigInput 
                label="Hệ số quy đổi điểm Ad-hoc" 
                value={config.adhocWeight} 
                onChange={v => onConfigChange({ ...config, adhocWeight: v })}
                max={2}
                step={0.05}
                isPercentage={false}
            />
             <ConfigInput 
                label="Mục tiêu KPI (Target)" 
                value={config.kpiTarget} 
                onChange={v => onConfigChange({ ...config, kpiTarget: v })}
            />
            <ConfigInput 
                label="Tổng số ngày trong kỳ" 
                value={config.totalDays} 
                onChange={v => onConfigChange({ ...config, totalDays: v })}
                min={1}
                max={90}
                step={1}
                isPercentage={false}
            />
             <ConfigInput 
                label="Số ngày đã qua" 
                value={config.daysPassed} 
                onChange={v => onConfigChange({ ...config, daysPassed: v < config.totalDays ? v : config.totalDays })}
                min={0}
                max={config.totalDays}
                step={1}
                isPercentage={false}
            />
        </div>
    </div>
  );
};