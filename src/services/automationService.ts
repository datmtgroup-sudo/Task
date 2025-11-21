
import { Task, Rule, TriggerType, RuleCondition, ConditionOperator, LogEntry, TaskStatus, ActionType } from '../types';

function checkCondition(task: Task, prevTask: Task | null, condition: RuleCondition): boolean {
  const { field, operator, value } = condition;
  
  const taskValue = task[field as keyof Task];

  switch (operator) {
    case ConditionOperator.Is:
      return taskValue === value;
    case ConditionOperator.IsNot:
      return taskValue !== value;
    default:
      return false;
  }
}

function checkAllConditions(task: Task, prevTask: Task | null, conditions: RuleCondition[]): boolean {
  if (conditions.length === 0) return true; // No conditions means it always passes
  // Supports AND logic: all conditions must be true
  return conditions.every(condition => checkCondition(task, prevTask, condition));
}

export const runAutomationEngine = (
  trigger: TriggerType,
  task: Task,
  prevTask: Task | null, // Previous state of the task, null for new tasks
  rules: Rule[]
): { modifiedTask: Task, newLogs: LogEntry[] } => {
  let modifiedTask = { ...task };
  const newLogs: LogEntry[] = [];
  const MAX_DEPTH = 5; // To prevent infinite loops
  let depth = 0;

  let rulesToProcess = rules
    .filter(rule => rule.isEnabled && rule.trigger === trigger)
    .sort((a, b) => a.priority - b.priority); // Lower priority number runs first

  while(rulesToProcess.length > 0 && depth < MAX_DEPTH) {
    const rule = rulesToProcess.shift();
    if (!rule) break;

    // We pass the *currently modified* task state to the next rule in the chain
    if (checkAllConditions(modifiedTask, prevTask, rule.conditions)) {
      const { type, value } = rule.action;
      let actionTaken = false;
      const originalStateSnapshot = {...modifiedTask};
      
      switch (type) {
        case ActionType.ChangeStatus:
          if (modifiedTask.status !== value) {
              modifiedTask.status = value as TaskStatus;
              actionTaken = true;
          }
          break;
        case ActionType.SetAssignee:
          // For automation, we assume "Set Assignee" overwrites the list with a single assignee for simplicity,
          // or appends if we wanted to be more complex. Here we overwrite.
          if (!modifiedTask.assignees.includes(value as string)) {
              modifiedTask.assignees = [value as string];
              actionTaken = true;
          }
          break;
      }
      
      if(actionTaken) {
         newLogs.push({
            id: new Date().toISOString() + Math.random(),
            timestamp: new Date().toISOString(),
            message: `Quy tắc "${rule.name}" đã chạy cho task "${modifiedTask.name}", thực hiện: ${type.toLowerCase().replace('_', ' ')} thành "${value}".`,
            taskId: modifiedTask.id,
            ruleId: rule.id,
        });

        // If an action was taken, re-evaluate all StatusChanged rules, as this action might trigger another rule.
        if (originalStateSnapshot.status !== modifiedTask.status) {
            const subsequentRules = rules
                .filter(r => r.isEnabled && r.trigger === TriggerType.StatusChanged)
                .sort((a, b) => a.priority - b.priority);
            rulesToProcess.push(...subsequentRules);
        }
      }
    }
    depth++;
  }

  if (depth >= MAX_DEPTH) {
      newLogs.push({
        id: new Date().toISOString() + Math.random(),
        timestamp: new Date().toISOString(),
        message: `Cảnh báo: Chuỗi tự động hóa cho task "${modifiedTask.name}" đã dừng lại vì vượt quá giới hạn ${MAX_DEPTH} bước để tránh lặp vô hạn.`,
        taskId: modifiedTask.id,
      });
  }


  return { modifiedTask, newLogs };
};
