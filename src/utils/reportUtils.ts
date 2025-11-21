import { Task, TaskStatus, SchedulePerformance } from '../types';

/**
 * Calculates the schedule performance status of a task.
 * @param task The task object.
 * @param periodEndDate The end date of the reporting period.
 * @returns The schedule performance status.
 */
export const calculateSchedulePerformance = (task: Task, periodEndDate: Date): SchedulePerformance => {
    const deadline = new Date(task.deadline);
    deadline.setHours(23, 59, 59, 999); // Ensure deadline is end of day

    if (task.status === TaskStatus.Done && task.completionDate) {
        const completionDate = new Date(task.completionDate);
        completionDate.setHours(0, 0, 0, 0);

        if (completionDate > deadline) {
            return SchedulePerformance.Late;
        } else if (completionDate < new Date(task.deadline)) { // Compare with start of deadline day
            return SchedulePerformance.Ahead;
        } else {
            return SchedulePerformance.OnTime;
        }
    } else { // Task is not Done
        if (periodEndDate > deadline) {
            return SchedulePerformance.Late; // It's past the deadline and still not done
        } else {
            return SchedulePerformance.InProgress;
        }
    }
};

/**
 * Generates a CSV file from report data and triggers a download.
 * @param data The flattened array of tasks for the report.
 * @param filename The desired filename for the downloaded CSV.
 */
export const generateCsv = (data: any[], filename: string = 'report.csv') => {
    if (data.length === 0) {
        alert('Không có dữ liệu để xuất.');
        return;
    }

    const headers = [
        "Member_Name", "Task_Name", "Project", "Plan_or_Adhoc",
        "Task_Outcome", "Status", "Priority", "Points", "Impact",
        "Start_Date", "Deadline", "Actual_Completion_Date",
        "Schedule_Performance_Status"
    ];

    const csvRows = [headers.join(',')];

    for (const row of data) {
        const values = [
            row.assignee,
            row.name,
            row.project,
            row.workType,
            row.outcome || '',
            row.status,
            row.priority,
            row.points,
            row.impact,
            row.startDate,
            row.deadline,
            row.completionDate || '',
            row.schedulePerformance,
        ].map(value => {
            const stringValue = String(value).replace(/"/g, '""');
            return `"${stringValue}"`;
        });
        csvRows.push(values.join(','));
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// FIX: Add a utility function to get the ISO week number from a date.
/**
 * Gets the ISO week number of a date.
 * @param d The date.
 * @returns The ISO week number.
 */
export const getWeekNumber = (d: Date): number => {
    // Copy date so don't modify original
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    // Set to nearest Thursday: current date + 4 - current day number
    // Make Sunday's day number 7
    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
    // Get first day of year
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    // Calculate full weeks to nearest Thursday
    const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    // Return week number
    return weekNo;
};


/**
 * Returns the start and end date for a given week number and year.
 * @param w Week number.
 * @param y Year.
 * @returns Object with start and end Date objects.
 */
export const getWeekDateRange = (w: number, y: number) => {
    const simple = new Date(y, 0, 1 + (w - 1) * 7);
    const dow = simple.getDay();
    const ISOweekStart = simple;
    if (dow <= 4)
        ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
    else
        ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
    
    const start = new Date(ISOweekStart);
    const end = new Date(ISOweekStart);
    end.setDate(end.getDate() + 6);

    return { start, end };
};