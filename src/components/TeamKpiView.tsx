import React, { useState } from 'react';
import { ForecastData } from '../types';
import { SparklesIcon, KpiTotalIcon, KpiPlanIcon, KpiAdhocIcon, KpiPointsIcon } from './icons/IconComponents';
import { KpiStatCard } from './KpiCard';

// AI Summary Card Component
const AICard: React.FC<{
    summary: string;
    isLoading: boolean;
    onGenerate: () => void;
}> = ({ summary, isLoading, onGenerate }) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-card">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center">
                    <SparklesIcon className="h-6 w-6 text-primary-500 mr-3"/>
                    Tóm tắt hiệu suất bằng AI
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Nhận phân tích tức thì về tình hình KPI của team.</p>
            </div>
            <button 
                onClick={onGenerate} 
                disabled={isLoading}
                className="mt-4 sm:mt-0 flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-50 dark:focus:ring-offset-slate-800 focus:ring-primary-500 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
            >
                {isLoading ? 'Đang phân tích...' : 'Tạo tóm tắt'}
            </button>
        </div>
        {isLoading && (
            <div className="mt-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                <div className="animate-pulse flex space-x-4">
                    <div className="flex-1 space-y-3 py-1">
                        <div className="h-2 bg-slate-200 dark:bg-slate-600 rounded"></div>
                        <div className="space-y-2">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="h-2 bg-slate-200 dark:bg-slate-600 rounded col-span-2"></div>
                                <div className="h-2 bg-slate-200 dark:bg-slate-600 rounded col-span-1"></div>
                            </div>
                            <div className="h-2 bg-slate-200 dark:bg-slate-600 rounded"></div>
                        </div>
                    </div>
                </div>
            </div>
        )}
        {summary && !isLoading && (
            <div className="mt-4 p-4 bg-primary-50 dark:bg-primary-500/10 border-l-4 border-primary-400 dark:border-primary-500">
                <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">{summary}</p>
            </div>
        )}
         {!summary && !isLoading && (
            <div className="mt-4 p-8 text-center rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-dashed border-slate-200 dark:border-slate-600">
                <p className="text-sm text-slate-500 dark:text-slate-400">Nhấn "Tạo tóm tắt" để AI phân tích dữ liệu KPI.</p>
            </div>
        )}
    </div>
);

// KPI Grid Component
const KpiGrid: React.FC<{ data: ForecastData }> = ({ data }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiStatCard 
            title="KPI Tổng (Weighted)" 
            value={`${(data.kpiWeighted * 100).toFixed(1)}%`}
            description={`${data.doneWeighted.toFixed(1)} / ${data.totalWeighted.toFixed(1)} điểm`}
            progress={data.kpiWeighted * 100}
            progressColor="bg-total"
            icon={<KpiTotalIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />}
            iconBgColor="bg-primary-100 dark:bg-primary-500/10"
        />
        <KpiStatCard 
            title="KPI Plan" 
            value={`${(data.kpiPlan * 100).toFixed(1)}%`}
            description={`${data.donePlan} / ${data.totalPlan} điểm`}
            progress={data.kpiPlan * 100}
            progressColor="bg-plan"
            icon={<KpiPlanIcon className="h-6 w-6 text-green-600 dark:text-green-400" />}
            iconBgColor="bg-green-100 dark:bg-green-500/10"
        />
        <KpiStatCard 
            title="KPI Ad-hoc" 
            value={`${(data.kpiAdhoc * 100).toFixed(1)}%`}
            description={`${data.doneAdhoc} / ${data.totalAdhoc} điểm`}
            progress={data.kpiAdhoc * 100}
            progressColor="bg-adhoc"
            icon={<KpiAdhocIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />}
            iconBgColor="bg-amber-100 dark:bg-amber-500/10"
        />
         <KpiStatCard 
            title="Tổng điểm Weighted" 
            value={data.totalWeighted.toFixed(1)}
            description={`Plan: ${data.totalPlan}, Adhoc: ${data.totalAdhoc}`}
            icon={<KpiPointsIcon className="h-6 w-6 text-slate-600 dark:text-slate-400" />}
            iconBgColor="bg-slate-100 dark:bg-slate-700"
        />
    </div>
);

// Main View Component
interface TeamKpiViewProps {
  teamForecast: ForecastData;
  aiSummary: string;
  isSummaryLoading: boolean;
  onGetAiSummary: () => void;
}

export const TeamKpiView: React.FC<TeamKpiViewProps> = ({
  teamForecast,
  aiSummary,
  isSummaryLoading,
  onGetAiSummary,
}) => {
  const [activeTab, setActiveTab] = useState('This Month');
  const tabs = ['This Month', 'Last Quarter', 'This Year'];

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard Hiệu suất Team</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Tổng quan về các chỉ số KPI và xu hướng hiệu suất của team.</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:border-slate-600'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>
      
      {/* Main Content Area */}
      <div className="space-y-8">
        <AICard 
          summary={aiSummary} 
          isLoading={isSummaryLoading} 
          onGenerate={onGetAiSummary} 
        />
        <KpiGrid data={teamForecast} />
        
        {/* Placeholder for future charts */}
        <div>
           <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Xu hướng hiệu suất</h2>
           <div className="h-64 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-card flex items-center justify-center">
              <p className="text-slate-500">Biểu đồ sẽ được hiển thị ở đây trong bản cập nhật sau.</p>
           </div>
        </div>
      </div>
    </div>
  );
};