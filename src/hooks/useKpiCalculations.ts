
import { useMemo } from 'react';
import { Task, Config, KpiData, ForecastData, TaskStatus, WorkType } from '../types';

const calculateKpisForTasks = (tasks: Task[], config: Config): KpiData => {
  const totalPlan = tasks
    .filter(t => t.workType === WorkType.Plan)
    .reduce((sum, t) => sum + t.points, 0);

  const totalAdhoc = tasks
    .filter(t => t.workType === WorkType.Adhoc)
    .reduce((sum, t) => sum + t.points, 0);

  const donePlan = tasks
    .filter(t => t.workType === WorkType.Plan && t.status === TaskStatus.Done)
    .reduce((sum, t) => sum + t.points, 0);
  
  const doneAdhoc = tasks
    .filter(t => t.workType === WorkType.Adhoc && t.status === TaskStatus.Done)
    .reduce((sum, t) => sum + t.points, 0);

  const kpiPlan = totalPlan === 0 ? 1 : donePlan / totalPlan;
  const kpiAdhoc = totalAdhoc === 0 ? 1 : doneAdhoc / totalAdhoc;
  
  const totalWeighted = (totalPlan * config.planWeight) + (totalAdhoc * config.adhocWeight);
  const doneWeighted = (donePlan * config.planWeight) + (doneAdhoc * config.adhocWeight);
  const kpiWeighted = totalWeighted === 0 ? 1 : doneWeighted / totalWeighted;

  return { totalPlan, totalAdhoc, donePlan, doneAdhoc, kpiPlan, kpiAdhoc, totalWeighted, doneWeighted, kpiWeighted };
};


export const useKpiCalculations = (tasks: Task[], config: Config) => {
  const employeeKpis = useMemo(() => {
    const allAssignees = new Set<string>();
    tasks.forEach(t => t.assignees.forEach(a => allAssignees.add(a)));
    
    const assignees = Array.from(allAssignees);
    const kpiByEmployee: Record<string, KpiData> = {};
    
    assignees.forEach(assignee => {
      const userTasks = tasks.filter(t => t.assignees.includes(assignee));
      kpiByEmployee[assignee] = calculateKpisForTasks(userTasks, config);
    });

    return kpiByEmployee;
  }, [tasks, config]);

  const teamForecast = useMemo(() => {
    const teamKpi = calculateKpisForTasks(tasks, config);
    
    const velocity = config.daysPassed === 0 ? 0 : teamKpi.doneWeighted / config.daysPassed;
    const forecastedCompletion = teamKpi.doneWeighted + velocity * (config.totalDays - config.daysPassed);
    const forecastedKpi = teamKpi.totalWeighted === 0 ? 1 : forecastedCompletion / teamKpi.totalWeighted;

    const result: ForecastData = {
        ...teamKpi,
        velocity,
        forecastedCompletion,
        forecastedKpi
    };
    return result;

  }, [tasks, config]);

  return { employeeKpis, teamForecast };
};
