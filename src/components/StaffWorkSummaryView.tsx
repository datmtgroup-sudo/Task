
import React, { useState, useMemo } from 'react';
import { Task, TaskStatus, Priority, WorkType, SchedulePerformance } from '../types';
import { DocumentReportIcon, DownloadIcon, CheckCircleIcon, ExclamationTriangleIcon, ClipboardDocumentListIcon, ArrowPathIcon, DocumentMagnifyingGlassIcon, KpiPointsIcon } from './icons/IconComponents';
// FIX: Import the new getWeekNumber function to correctly calculate the current week.
import { calculateSchedulePerformance, generateCsv, getWeekDateRange, getWeekNumber } from '../utils/reportUtils';
import { PRIORITY_OPTIONS, TASK_STATUS_OPTIONS, WORK_TYPE_OPTIONS } from '../constants';

// --- Types & Constants ---

interface StaffWorkSummaryViewProps {
  tasks: Task[];
  assignees: string[];
  projects: string[];
}

const performanceClasses: Record<SchedulePerformance, string> = {
  [SchedulePerformance.Ahead]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  [SchedulePerformance.OnTime]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  [SchedulePerformance.Late]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  [SchedulePerformance.InProgress]: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200',
};

const SCHEDULE_PERFORMANCE_OPTIONS = Object.values(SchedulePerformance);

// --- Sub-Components for Redesigned View ---

const SummaryCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-white dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center shadow-sm">
        <div className="flex-shrink-0 mr-4">{icon}</div>
        <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
        </div>
    </div>
);

const EmptyState: React.FC<{ onReset: () => void }> = ({ onReset }) => (
    <div className="text-center py-16 px-6 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
        <DocumentMagnifyingGlassIcon className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-500" />
        <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">Không có dữ liệu cho kỳ báo cáo này.</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Hãy thử đổi tháng, năm hoặc bỏ bớt bộ lọc để xem dữ liệu khác.</p>
        <button
            onClick={onReset}
            className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-50 dark:focus:ring-offset-slate-900 focus:ring-primary-500"
        >
            Quay lại tháng hiện tại
        </button>
    </div>
);


const FilterControl: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div>
        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{label}</label>
        {children}
    </div>
);


// --- Main View Component ---

export const StaffWorkSummaryView: React.FC<StaffWorkSummaryViewProps> = ({ tasks, assignees, projects }) => {
  const currentYear = new Date().getFullYear();
  const [reportType, setReportType] = useState<'month' | 'week'>('month');
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  // FIX: Replaced non-standard toLocaleDateString with a reliable utility function to get the current week number.
  const [week, setWeek] = useState(getWeekNumber(new Date())); // Get current week number

  const [selectedAssignee, setSelectedAssignee] = useState('all');
  const [selectedProject, setSelectedProject] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedWorkType, setSelectedWorkType] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedPerformance, setSelectedPerformance] = useState('all');
  
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const weeks = Array.from({ length: 53 }, (_, i) => i + 1);

  const { periodStart, periodEnd } = useMemo(() => {
    if (reportType === 'month') {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0);
      end.setHours(23, 59, 59, 999);
      return { periodStart: start, periodEnd: end };
    } else {
      const { start, end } = getWeekDateRange(week, year);
      end.setHours(23, 59, 59, 999);
      return { periodStart: start, periodEnd: end };
    }
  }, [reportType, year, month, week]);

  const reportData = useMemo(() => {
    const tasksWithPerformance = tasks.map(task => ({
        ...task,
        schedulePerformance: calculateSchedulePerformance(task, periodEnd),
    }));

    const filtered = tasksWithPerformance.filter(task => {
        const taskStart = new Date(task.startDate);
        const taskDeadline = new Date(task.deadline);
        const isOverlapping = taskStart <= periodEnd && taskDeadline >= periodStart;
        const assigneeMatch = selectedAssignee === 'all' || task.assignees.includes(selectedAssignee);
        const projectMatch = selectedProject === 'all' || task.project === selectedProject;
        const statusMatch = selectedStatus === 'all' || task.status === selectedStatus;
        const workTypeMatch = selectedWorkType === 'all' || task.workType === selectedWorkType;
        const priorityMatch = selectedPriority === 'all' || task.priority === selectedPriority;
        const performanceMatch = selectedPerformance === 'all' || task.schedulePerformance === selectedPerformance;
        return isOverlapping && assigneeMatch && projectMatch && statusMatch && workTypeMatch && priorityMatch && performanceMatch;
    });

    const groupedByAssignee: Record<string, (Task & {schedulePerformance: SchedulePerformance})[]> = {};
    for (const task of filtered) {
        task.assignees.forEach(assignee => {
             if (!groupedByAssignee[assignee]) {
                groupedByAssignee[assignee] = [];
            }
            groupedByAssignee[assignee].push(task);
        });
    }
    
    return Object.keys(groupedByAssignee).sort().map(assignee => {
        const userTasks = groupedByAssignee[assignee].sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
        const kpis = {
            totalTasks: userTasks.length,
            totalPoints: userTasks.reduce((sum, t) => sum + t.points, 0),
            doneTasks: userTasks.filter(t => t.status === TaskStatus.Done).length,
            ahead: userTasks.filter(t => t.schedulePerformance === SchedulePerformance.Ahead).length,
            onTime: userTasks.filter(t => t.schedulePerformance === SchedulePerformance.OnTime).length,
            late: userTasks.filter(t => t.schedulePerformance === SchedulePerformance.Late).length,
        };
        return { assignee, tasks: userTasks, kpis };
    });
  }, [tasks, periodStart, periodEnd, selectedAssignee, selectedProject, selectedStatus, selectedWorkType, selectedPriority, selectedPerformance]);
  
  const summaryKpis = useMemo(() => {
      if (reportData.length === 0) {
          return { totalTasks: 0, onTimePercentage: 0, overdueTasks: 0, totalPoints: 0 };
      }
      const totalTasks = reportData.reduce((acc, curr) => acc + curr.kpis.totalTasks, 0);
      const totalPoints = reportData.reduce((sum, group) => sum + group.kpis.totalPoints, 0);
      const onTimeOrAhead = reportData.reduce((acc, curr) => acc + curr.kpis.onTime + curr.kpis.ahead, 0);
      const late = reportData.reduce((acc, curr) => acc + curr.kpis.late, 0);
      const totalDone = onTimeOrAhead + late;
      const onTimePercentage = totalDone > 0 ? (onTimeOrAhead / totalDone) * 100 : 0;
      return {
          totalTasks,
          onTimePercentage,
          overdueTasks: late,
          totalPoints
      };
  }, [reportData]);

  const resetFilters = () => {
      setSelectedAssignee('all');
      setSelectedProject('all');
      setSelectedStatus('all');
      setSelectedWorkType('all');
      setSelectedPriority('all');
      setSelectedPerformance('all');
      setYear(currentYear);
      setMonth(new Date().getMonth() + 1);
  };

  const handleExport = () => {
    const flatData = reportData.flatMap(group => group.tasks.map(t => ({...t, assignee: group.assignee}))); // Flatten per assignee
    const periodString = reportType === 'month' ? `${year}-${String(month).padStart(2,'0')}` : `${year}-W${String(week).padStart(2,'0')}`;
    generateCsv(flatData, `BaoCaoTienDo_${periodString}.csv`);
  };

  return (
    <div className="space-y-8">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Báo cáo Tiến độ Nhân sự</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Theo dõi tiến độ, trạng thái và ưu tiên công việc theo nhân sự, dự án và kỳ báo cáo.</p>
          </div>
          <button onClick={handleExport} className="inline-flex items-center justify-center h-11 px-6 border border-transparent shadow-sm text-sm font-semibold rounded-full text-white bg-primary-600 hover:bg-primary-700 transition-colors">
              <DownloadIcon className="h-5 w-5 mr-2 -ml-1" />
              Xuất ra CSV
          </button>
      </div>
      
      {/* 2. Filter Panel */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700/50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Period selection */}
              <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-slate-200 dark:border-slate-700">
                  <FilterControl label="Loại báo cáo">
                      <select value={reportType} onChange={e => setReportType(e.target.value as 'month'|'week')} className="form-select">
                          <option value="month">Theo Tháng</option>
                          <option value="week">Theo Tuần</option>
                      </select>
                  </FilterControl>
                  <FilterControl label="Năm">
                      <select value={year} onChange={e => setYear(parseInt(e.target.value))} className="form-select">
                          {years.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                  </FilterControl>
                  {reportType === 'month' ? (
                      <FilterControl label="Tháng">
                          <select value={month} onChange={e => setMonth(parseInt(e.target.value))} className="form-select">
                              {Array.from({length: 12}, (_, i) => i + 1).map(m => <option key={m} value={m}>Tháng {m}</option>)}
                          </select>
                      </FilterControl>
                  ) : (
                      <FilterControl label="Tuần">
                          <select value={week} onChange={e => setWeek(parseInt(e.target.value))} className="form-select">
                              {weeks.map(w => <option key={w} value={w}>Tuần {w}</option>)}
                          </select>
                      </FilterControl>
                  )}
              </div>
              {/* Data filters */}
              <FilterControl label="Nhân sự">
                  <select value={selectedAssignee} onChange={e => setSelectedAssignee(e.target.value)} className="form-select">
                      <option value="all">Tất cả nhân sự</option>
                      {assignees.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
              </FilterControl>
              <FilterControl label="Dự án">
                  <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} className="form-select">
                      <option value="all">Tất cả dự án</option>
                      {projects.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
              </FilterControl>
              <FilterControl label="Trạng thái Task">
                  <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)} className="form-select">
                      <option value="all">Tất cả trạng thái</option>
                      {TASK_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
              </FilterControl>
               <FilterControl label="Loại công việc">
                  <select value={selectedWorkType} onChange={e => setSelectedWorkType(e.target.value)} className="form-select">
                      <option value="all">Tất cả</option>
                      {WORK_TYPE_OPTIONS.map(wt => <option key={wt} value={wt}>{wt}</option>)}
                  </select>
              </FilterControl>
              <FilterControl label="Độ ưu tiên">
                  <select value={selectedPriority} onChange={e => setSelectedPriority(e.target.value)} className="form-select">
                      <option value="all">Tất cả</option>
                      {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
              </FilterControl>
              <FilterControl label="Tình trạng tiến độ">
                  <select value={selectedPerformance} onChange={e => setSelectedPerformance(e.target.value)} className="form-select">
                      <option value="all">Tất cả</option>
                      {SCHEDULE_PERFORMANCE_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
              </FilterControl>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end">
              <button onClick={resetFilters} className="inline-flex items-center text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400">
                  <ArrowPathIcon className="h-4 w-4 mr-2" />
                  Reset bộ lọc
              </button>
          </div>
      </div>
      
      {/* 3. Summary Strip */}
      {reportData.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <SummaryCard title="Tổng số task" value={summaryKpis.totalTasks} icon={<ClipboardDocumentListIcon className="h-8 w-8 text-slate-500" />} />
              <SummaryCard title="% Đúng hạn" value={`${summaryKpis.onTimePercentage.toFixed(1)}%`} icon={<CheckCircleIcon className="h-8 w-8 text-green-500" />} />
              <SummaryCard title="Số task quá hạn" value={summaryKpis.overdueTasks} icon={<ExclamationTriangleIcon className="h-8 w-8 text-red-500" />} />
              <SummaryCard title="Tổng điểm" value={summaryKpis.totalPoints} icon={<KpiPointsIcon className="h-8 w-8 text-blue-500" />} />
          </div>
      )}

      {/* 4. Results Area & Empty State */}
      <div className="space-y-8">
        {reportData.length > 0 ? reportData.map(({ assignee, tasks, kpis }) => (
            <div key={assignee} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700/50">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{assignee}</h3>
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600 dark:text-slate-300 mb-4 border-b border-slate-200 dark:border-slate-700 pb-4">
                    <span><strong>Tổng Task:</strong> {kpis.totalTasks}</span>
                    <span><strong>Tổng Điểm:</strong> {kpis.totalPoints}</span>
                    <span className="text-green-600 dark:text-green-400"><strong>Vượt/Đúng hạn:</strong> {kpis.ahead + kpis.onTime}</span>
                    <span className="text-red-600 dark:text-red-400"><strong>Trễ tiến độ:</strong> {kpis.late}</span>
                </div>
                <div className="overflow-x-auto -mx-6 px-6">
                    <table className="min-w-full">
                        <thead className="border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="th">Tên công việc</th>
                                <th className="th">Kết quả công việc</th>
                                <th className="th">Trạng thái</th>
                                <th className="th">Ưu tiên</th>
                                <th className="th">Deadline</th>
                                <th className="th text-right">Tình trạng Tiến độ</th>
                            </tr>
                        </thead>
                         <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {tasks.map(task => (
                                <tr key={task.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="td font-medium text-slate-900 dark:text-white">{task.name}</td>
                                    <td className="td text-slate-500 dark:text-slate-400 max-w-xs truncate">{task.outcome?.summary || 'Chưa có'}</td>
                                    <td className="td text-slate-500 dark:text-slate-400">{task.status}</td>
                                    <td className="td text-slate-500 dark:text-slate-400">{task.priority}</td>
                                    <td className="td text-slate-500 dark:text-slate-400">{task.deadline}</td>
                                    <td className="td text-right">
                                        <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${performanceClasses[task.schedulePerformance]}`}>
                                            {task.schedulePerformance}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )) : <EmptyState onReset={resetFilters} />}
      </div>
      <style>{`
        .form-select {
            @apply w-full h-10 bg-white dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition;
            background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
            background-position: right 0.5rem center;
            background-repeat: no-repeat;
            background-size: 1.5em 1.5em;
            -webkit-appearance: none;
            -moz-appearance: none;
            appearance: none;
        }
        .dark .form-select {
            background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
        }
        .th { @apply px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider; }
        .td { @apply px-4 py-4 whitespace-nowrap text-sm; }
      `}</style>
    </div>
  );
};
