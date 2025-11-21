
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Task, Config, TaskStatus, Rule, LogEntry, TriggerType, WorkType, Baseline, ActionType, MeetingNote, ActionItem, ActionItemStatus, Filters, Sprint, Objective, KeyResult, TaskTemplate, ReviewStatus, LateReason, TaskOutcome, TimeRange, ApprovalHistoryEntry, ApprovalStatus, Comment } from './types';
import { DEFAULT_TASKS, DEFAULT_CONFIG, TASK_STATUS_OPTIONS, DEFAULT_RULES, DEFAULT_PERIODS, DEFAULT_ASSIGNEES, DEFAULT_PROJECTS, DEFAULT_MEETING_NOTES, DEFAULT_ACTION_ITEMS, DEFAULT_SPRINTS, DEFAULT_OBJECTIVES, DEFAULT_KEY_RESULTS, DEFAULT_TASK_TEMPLATES, DEFAULT_TAGS, CHANNEL_OPTIONS } from './constants';
import { useKpiCalculations } from './hooks/useKpiCalculations';
import { generateKpiSummary } from './services/geminiService';
import { runAutomationEngine } from './services/automationService';
import { TaskForm } from './components/TaskForm';
import { TasksTable } from './components/TasksTable';
import { ConfigPanel } from './components/ConfigPanel';
import { TeamKpiView } from './components/TeamKpiView';
import { KpiNhanVien } from './components/KpiNhanVien';
import { Forecast } from './components/Forecast';
import { KanbanView } from './components/KanbanView';
import { AutomationView } from './components/AutomationView';
import { BaselineView } from './components/BaselineView';
import { GanttCalendarView } from './components/GanttCalendarView';
import { MasterDataView } from './components/MasterDataView';
import { MeetingsAndActionsView } from './components/MeetingsAndActionsView';
import { OutcomeModal } from './components/OutcomeModal';
import { StaffWorkSummaryView } from './components/StaffWorkSummaryView';
import { UserSelector } from './components/UserSelector';
import { FilterBar } from './components/FilterBar';
import { ConfigIcon, DataIcon, ForecastIcon, TeamIcon, UserIcon, KanbanIcon, AutomationIcon, BaselineIcon, GanttChartIcon, ListBulletIcon, ClipboardListIcon, DocumentReportIcon, PlanningIcon, OkrIcon, SunIcon, PlusIcon, Bars3BottomLeftIcon, XMarkIcon } from './components/icons/IconComponents';
import { RuleEditorModal } from './components/RuleEditorModal';
import { BulkActionBar } from './components/BulkActionBar';
import { BulkEditModal } from './components/BulkEditModal';
import { PlanningView } from './components/PlanningView';
import { OkrView } from './components/OkrView';
import { MyDayView } from './components/MyDayView';
import { ViewModeSwitcher } from './components/ViewModeSwitcher';
import { QuickCreatePanel } from './components/QuickCreatePanel';
import { RootCauseModal } from './components/RootCauseModal';
import { ReviewSubmissionModal } from './components/ReviewSubmissionModal';

type View = 'my_day' | 'kpi_team' | 'kpi_nhan_vien' | 'forecast' | 'tasks' | 'kanban' | 'planning_board' | 'gantt_calendar' | 'meetings_actions' | 'staff_summary' | 'okr' | 'automation' | 'baseline' | 'master_data' | 'config';

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(DEFAULT_TASKS);
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const [rules, setRules] = useState<Rule[]>(DEFAULT_RULES);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [baselines, setBaselines] = useState<Baseline[]>([]);
  const [meetingNotes, setMeetingNotes] = useState<MeetingNote[]>(DEFAULT_MEETING_NOTES);
  const [actionItems, setActionItems] = useState<ActionItem[]>(DEFAULT_ACTION_ITEMS);
  const [sprints, setSprints] = useState<Sprint[]>(DEFAULT_SPRINTS);
  const [objectives, setObjectives] = useState<Objective[]>(DEFAULT_OBJECTIVES);
  const [keyResults, setKeyResults] = useState<KeyResult[]>(DEFAULT_KEY_RESULTS);
  const [taskTemplates, setTaskTemplates] = useState<TaskTemplate[]>(DEFAULT_TASK_TEMPLATES);

  
  const [assignees, setAssignees] = useState<string[]>(DEFAULT_ASSIGNEES);
  const [projects, setProjects] = useState<string[]>(DEFAULT_PROJECTS);
  const [periods, setPeriods] = useState<string[]>(DEFAULT_PERIODS);
  
  const [currentPeriod, setCurrentPeriod] = useState<string>(periods[0]);
  const [activeView, setActiveView] = useState<View>('tasks');
  const [aiSummary, setAiSummary] = useState<string>('');
  const [isSummaryLoading, setIsSummaryLoading] = useState<boolean>(false);
  const [outcomeModalState, setOutcomeModalState] = useState<{ isOpen: boolean; taskId: string | null; taskName: string; }>({ isOpen: false, taskId: null, taskName: '' });
  const [rootCauseModalState, setRootCauseModalState] = useState<{ isOpen: boolean; taskId: string | null; taskName: string; }>({ isOpen: false, taskId: null, taskName: '' });
  const [recentlyCompletedTaskId, setRecentlyCompletedTaskId] = useState<string | null>(null);
  
  const [reviewSubmissionModalState, setReviewSubmissionModalState] = useState<{ isOpen: boolean; task: Task | null }>({ isOpen: false, task: null });


  // --- Rule Editor State ---
  const [ruleEditorState, setRuleEditorState] = useState<{ isOpen: boolean; rule: Rule | null }>({ isOpen: false, rule: null });

  // --- Personalization State ---
  const [currentUser, setCurrentUser] = useState<string>(DEFAULT_ASSIGNEES[0]);
  const [viewMode, setViewMode] = useState<'user' | 'manager'>('user');
  const [filters, setFilters] = useState<Filters>({
    assignee: 'all',
    project: 'all',
    status: 'all',
    priority: 'all',
    workType: 'all',
    channel: 'all',
    tags: 'all',
  });
  const [timeRange, setTimeRange] = useState<TimeRange>(() => 
    (localStorage.getItem('timeRangeFilter') as TimeRange) || 'month'
  );
  
  // --- Bulk Actions State ---
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  
  // --- Quick Create/Clone Panel State ---
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [quickCreateInitialData, setQuickCreateInitialData] = useState<Partial<Task> | null>(null);
  const [panelTitle, setPanelTitle] = useState('Tạo Task mới');

  // --- UI State ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);


  // KPI calculations ALWAYS use the full, unfiltered task list
  const { employeeKpis, teamForecast } = useKpiCalculations(tasks, config);
  
  const allTags = useMemo(() => {
    const tagsSet = new Set(DEFAULT_TAGS);
    tasks.forEach(task => {
        task.tags?.forEach(tag => tagsSet.add(tag));
    });
    return Array.from(tagsSet).sort();
  }, [tasks]);

  // Filtered tasks logic...
  const filteredTasks = useMemo(() => {
      const getThisWeekRange = (): { start: Date; end: Date } => {
          const now = new Date();
          const dayOfWeek = now.getDay(); // 0 for Sunday, 1 for Monday, etc.
          const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
          const monday = new Date(now.setDate(now.getDate() + diffToMonday));
          monday.setHours(0, 0, 0, 0);
          const sunday = new Date(monday);
          sunday.setDate(monday.getDate() + 6);
          sunday.setHours(23, 59, 59, 999);
          return { start: monday, end: sunday };
      };
      const getThisMonthRange = (): { start: Date; end: Date } => {
          const now = new Date();
          const start = new Date(now.getFullYear(), now.getMonth(), 1);
          const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          end.setHours(23, 59, 59, 999);
          return { start, end };
      };
      const getThisQuarterRange = (): { start: Date; end: Date } => {
          const now = new Date();
          const quarter = Math.floor(now.getMonth() / 3);
          const start = new Date(now.getFullYear(), quarter * 3, 1);
          const end = new Date(now.getFullYear(), quarter * 3 + 3, 0);
          end.setHours(23, 59, 59, 999);
          return { start, end };
      };
      
      let dateFilteredTasks = tasks;
      if (timeRange !== 'all') {
          let range: { start: Date; end: Date } | undefined;
          if (timeRange === 'week') range = getThisWeekRange();
          if (timeRange === 'month') range = getThisMonthRange();
          if (timeRange === 'quarter') range = getThisQuarterRange();
          
          if (range) {
              dateFilteredTasks = tasks.filter(task => {
                  const taskStart = new Date(task.startDate);
                  const taskDeadline = new Date(task.deadline);
                  return taskStart <= range.end && taskDeadline >= range.start;
              });
          }
      }

    return dateFilteredTasks.filter(task => {
        const assigneeMatch = filters.assignee === 'all' || task.assignees.includes(filters.assignee);
        const projectMatch = filters.project === 'all' || task.project === filters.project;
        const statusMatch = filters.status === 'all' || task.status === filters.status;
        const priorityMatch = filters.priority === 'all' || task.priority === filters.priority;
        const workTypeMatch = filters.workType === 'all' || task.workType === filters.workType;
        const channelMatch = filters.channel === 'all' || task.channel === filters.channel;
        const tagMatch = filters.tags === 'all' || (task.tags && task.tags.includes(filters.tags));
        return assigneeMatch && projectMatch && statusMatch && priorityMatch && workTypeMatch && channelMatch && tagMatch;
    });
  }, [tasks, filters, timeRange]);
  
  useEffect(() => { setSelectedTaskIds(new Set()); }, [filters, timeRange]);
  useEffect(() => { if (viewMode === 'user') setFilters(prev => ({ ...prev, assignee: currentUser })); }, [currentUser, viewMode]);
  useEffect(() => { localStorage.setItem('timeRangeFilter', timeRange); }, [timeRange]);
  useEffect(() => { const handleKeyDown = (e: KeyboardEvent) => { if (!e.altKey) return; let newRange: TimeRange | null = null; switch (e.key.toLowerCase()) { case 'w': newRange = 'week'; break; case 'm': newRange = 'month'; break; case 'q': newRange = 'quarter'; break; case 'a': newRange = 'all'; break; default: return; } e.preventDefault(); setTimeRange(newRange); }; window.addEventListener('keydown', handleKeyDown); return () => window.removeEventListener('keydown', handleKeyDown); }, []);
  useEffect(() => { if (recentlyCompletedTaskId) { const timer = setTimeout(() => { setRecentlyCompletedTaskId(null); }, 2000); return () => clearTimeout(timer); } }, [recentlyCompletedTaskId]);

  // --- WEEKLY AUTO-RESET & LOGIC ---
  const consolidateWeeklyNotes = useCallback(() => {
      setTasks(prev => prev.map(t => {
          if (t.currentStatusNote && t.currentStatusNote.trim() !== '') {
              const newEntry = {
                  date: new Date().toISOString(),
                  note: `[Tuần này] ${t.currentStatusNote}`
              };
              return {
                  ...t,
                  currentStatusNote: '', // Clear
                  noteHistory: [newEntry, ...(t.noteHistory || [])] // Prepend to log
              };
          }
          return t;
      }));
      const newLog: LogEntry = { id: `log-${Date.now()}`, timestamp: new Date().toISOString(), message: `Đã chạy chốt sổ tuần: Ghi chú tiến độ đã được lưu vào Kết quả.` };
      addLogEntries([newLog]);
  }, []);

  // Check for Saturday on mount and run consolidation if needed (Mocking a scheduler)
  useEffect(() => {
      const today = new Date();
      if (today.getDay() === 6) { // Saturday
          // In a real app, check if already run today via localStorage
          const lastRun = localStorage.getItem('lastWeeklyConsolidation');
          const todayStr = today.toDateString();
          if (lastRun !== todayStr) {
              consolidateWeeklyNotes();
              localStorage.setItem('lastWeeklyConsolidation', todayStr);
          }
      }
  }, [consolidateWeeklyNotes]);


  const addLogEntries = useCallback((newLogs: LogEntry[]) => { if (newLogs.length > 0) setLogs(prevLogs => [...newLogs, ...prevLogs]); }, []);

  const handleAddTask = useCallback((task: Omit<Task, 'id'>, actionItemsData: Omit<ActionItem, 'id' | 'taskId' | 'meetingNoteId'>[], onSuccessCallback?: () => void) => {
    const taskId = `task-${new Date().toISOString()}-${Math.random()}`;
    const newTask = { ...task, id: taskId, approvalStatus: ApprovalStatus.NotApplicable, comments: [] }; // Init new fields
    const { modifiedTask, newLogs } = runAutomationEngine(TriggerType.TaskCreated, newTask, null, rules);
    setTasks(prevTasks => [modifiedTask, ...prevTasks]);
    const newActionItems = actionItemsData.map(ai => ({ ...ai, id: `ai-${new Date().toISOString()}-${Math.random()}`, taskId: taskId }));
    setActionItems(prev => [...prev, ...newActionItems]);
    addLogEntries(newLogs);
    if (onSuccessCallback) onSuccessCallback();
  }, [rules, addLogEntries]);

  const handleAddActionItem = useCallback((taskId: string) => {
    const parentTask = tasks.find(t => t.id === taskId);
    if (!parentTask) return;
    const newActionItem: ActionItem = { id: `ai-${Date.now()}-${Math.random()}`, taskId: taskId, description: 'Sub-task mới', owners: parentTask.assignees, dueDate: parentTask.deadline, status: ActionItemStatus.Todo, stepOrder: (actionItems.filter(ai => ai.taskId === taskId).length || 0) + 1 };
    setActionItems(prev => [...prev, newActionItem]);
  }, [tasks, actionItems]);

  const handleDeleteTask = useCallback((taskId: string) => { setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId)); setActionItems(prev => prev.filter(ai => ai.taskId !== taskId)); }, []);
  
  // Helper to actually complete the task
  const completeTask = useCallback((taskId: string, updates: Partial<Task>) => {
      const originalTask = tasks.find(t => t.id === taskId);
      if (!originalTask) return;

      let taskWithUpdates = { ...originalTask, ...updates };

      // If consolidating notes on completion
      if (taskWithUpdates.currentStatusNote) {
        const newHistoryEntry = { date: new Date().toISOString(), note: `[Ghi chú cuối cùng] ${taskWithUpdates.currentStatusNote}` };
        taskWithUpdates.noteHistory = [newHistoryEntry, ...(taskWithUpdates.noteHistory || [])];
        taskWithUpdates.currentStatusNote = '';
      }

      let updatedTask = { 
          ...taskWithUpdates, 
          status: TaskStatus.Done,
          completionDate: originalTask.completionDate || new Date().toISOString().split('T')[0],
      };

      const { modifiedTask, newLogs } = runAutomationEngine(TriggerType.StatusChanged, updatedTask, originalTask, rules);
      setTasks(prevTasks => prevTasks.map(t => t.id === taskId ? modifiedTask : t));
      addLogEntries(newLogs);
      setRecentlyCompletedTaskId(taskId);
  }, [tasks, rules, addLogEntries]);

  // Modified Status Change Handler to support Approval Flow
  const handleTaskStatusChange = useCallback((taskId: string, newStatus: TaskStatus) => {
    const originalTask = tasks.find(t => t.id === taskId);
    if (!originalTask || originalTask.status === newStatus) return;
    
    if (originalTask.status === TaskStatus.Done && newStatus !== TaskStatus.Done) {
        if (!window.confirm("Bạn có chắc muốn mở lại công việc này?")) return;
    }

    if (newStatus === TaskStatus.Done) {
         // --- 1. CHECK APPROVAL REQ ---
        if (originalTask.review_required && originalTask.approvalStatus !== ApprovalStatus.Approved) {
            setReviewSubmissionModalState({ isOpen: true, task: originalTask });
            return; // Stop completion flow, wait for modal
        }
      
        // --- 2. CHECK LATE ---
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const deadline = new Date(originalTask.deadline);
        if (deadline < today && !originalTask.late_completion_reason) {
            setRootCauseModalState({ isOpen: true, taskId, taskName: originalTask.name });
            return;
        }
        
        // --- 3. CHECK OUTCOME ---
        if (!originalTask.outcome) {
            setOutcomeModalState({ isOpen: true, taskId, taskName: originalTask.name });
            return;
        }

        completeTask(taskId, {});

    } else {
        // Normal status change
        let updatedTask = { ...originalTask, status: newStatus, completionDate: undefined };
        const { modifiedTask, newLogs } = runAutomationEngine(TriggerType.StatusChanged, updatedTask, originalTask, rules);
        setTasks(prevTasks => prevTasks.map(t => t.id === taskId ? modifiedTask : t));
        addLogEntries(newLogs);
    }
  }, [tasks, rules, addLogEntries, completeTask]);


  // --- Modal Handlers ---
  const handleOutcomeSubmit = useCallback((taskId: string, outcome: TaskOutcome) => {
    const task = tasks.find(t => t.id === taskId);
    if(!task) return;
    setOutcomeModalState({ isOpen: false, taskId: null, taskName: '' });
    
    const updates = { outcome };
    const taskWithOutcome = { ...task, ...updates };

    const today = new Date(); today.setHours(0,0,0,0);
    const deadline = new Date(task.deadline);
    
    if (deadline < today && !task.late_completion_reason) {
        setTasks(prev => prev.map(t => t.id === taskId ? taskWithOutcome : t));
        setRootCauseModalState({ isOpen: true, taskId, taskName: task.name });
    } else {
        completeTask(taskId, updates);
    }
  }, [tasks, completeTask]);
  
  const handleRootCauseSubmit = useCallback((taskId: string, reason: LateReason, note?: string) => {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;
      setRootCauseModalState({ isOpen: false, taskId: null, taskName: '' });
      const updates: Partial<Task> = { is_late: true, late_completion_reason: reason, late_completion_note: note };
      const taskWithLateReason = { ...task, ...updates };
      if (!task.outcome) {
         setTasks(prev => prev.map(t => t.id === taskId ? taskWithLateReason : t));
         setOutcomeModalState({ isOpen: true, taskId, taskName: task.name });
      } else {
          completeTask(taskId, updates);
      }
  }, [tasks, completeTask]);

  // --- New Approval Handlers ---
  const handleSubmitReview = useCallback((taskId: string, comment: string, mentions: string[]) => {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const timestamp = new Date().toISOString();
      
      // Add comment
      const newComment: Comment = {
          id: `cmt-${Date.now()}`,
          taskId: taskId,
          author: currentUser,
          content: comment,
          timestamp,
          mentions
      };

      const historyEntry: ApprovalHistoryEntry = {
          date: timestamp,
          actor: currentUser,
          action: 'submitted',
          comment: 'Gửi yêu cầu duyệt'
      };

      const updatedTask = {
          ...task,
          approvalStatus: ApprovalStatus.Pending,
          status: TaskStatus.PendingReview, // Visual status
          comments: [...(task.comments || []), newComment],
          approvalHistory: [...(task.approvalHistory || []), historyEntry]
      };

      setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
      setReviewSubmissionModalState({ isOpen: false, task: null });
      alert(`Đã gửi yêu cầu duyệt cho ${task.approver || 'quản lý'}`);
  }, [tasks, currentUser]);

  // Called by Approver (Approve/Reject)
  const handleApprovalAction = useCallback((taskId: string, action: 'approve' | 'reject', comment?: string) => {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;
      
      const timestamp = new Date().toISOString();
      let updates: Partial<Task> = {};
      
      const historyEntry: ApprovalHistoryEntry = {
          date: timestamp,
          actor: currentUser,
          action: action === 'approve' ? 'approved' : 'rejected',
          comment: comment
      };
      
      // System comment for log
      const systemComment: Comment = {
          id: `sys-${Date.now()}`,
          taskId: taskId,
          author: 'System',
          content: action === 'approve' 
            ? `✅ ${currentUser} đã DUYỆT task này.` 
            : `❌ ${currentUser} yêu cầu chỉnh sửa: "${comment}"`,
          timestamp
      };

      if (action === 'approve') {
          updates = { 
              approvalStatus: ApprovalStatus.Approved, 
              approved_at: timestamp, 
              approved_by: currentUser,
              status: TaskStatus.Done // Move to Done explicitly
          };
      } else {
          updates = { 
              approvalStatus: ApprovalStatus.Rejected, 
              approval_note: comment,
              status: TaskStatus.Doing // Move back to Doing
          };
      }

      const updatedTask = {
          ...task,
          ...updates,
          comments: [...(task.comments || []), systemComment],
          approvalHistory: [...(task.approvalHistory || []), historyEntry]
      };

      setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
  }, [tasks, currentUser]);

  const handleAddComment = useCallback((taskId: string, content: string) => {
      const task = tasks.find(t => t.id === taskId);
      if(!task) return;

      // Basic mention detection
      const mentions = task.assignees.filter(a => content.includes(`@${a}`));
      if(content.includes(`@${task.approver}`)) mentions.push(task.approver!);

      const newComment: Comment = {
          id: `cmt-${Date.now()}`,
          taskId,
          author: currentUser,
          content,
          timestamp: new Date().toISOString(),
          mentions
      };
      
      setTasks(prev => prev.map(t => {
          if (t.id === taskId) {
              return { ...t, comments: [...(t.comments || []), newComment] };
          }
          return t;
      }));
      
      if(mentions.length > 0) {
          alert(`Đã thông báo cho: ${Array.from(new Set(mentions)).join(', ')}`);
      }

  }, [currentUser, tasks]);


  const handleGetAiSummary = useCallback(async () => { setIsSummaryLoading(true); const summary = await generateKpiSummary(teamForecast); setAiSummary(summary); setIsSummaryLoading(false); }, [teamForecast]);
  const handleCreateBaseline = useCallback(() => { const newBaseline: Baseline = { id: `baseline-${new Date().toISOString()}`, periodName: currentPeriod, createdAt: new Date().toISOString(), tasks: tasks.map(t => ({...t})) }; setBaselines(prev => [...prev, newBaseline]); alert(`Baseline for period "${currentPeriod}" has been created!`); }, [tasks, currentPeriod]);
  const handleUpdateTask = useCallback((taskId: string, updates: Partial<Task>) => { setTasks(prev => prev.map(t => t.id === taskId ? {...t, ...updates} : t)); }, []);
  const handleUpdateActionItem = useCallback((actionItemId: string, updates: Partial<ActionItem>) => { setActionItems(prev => prev.map(ai => ai.id === actionItemId ? {...ai, ...updates} : ai)); }, []);
  const handleUpdateTaskPlanning = useCallback((taskId: string, newPlan: { week?: string; month?: string; quarter?: string }) => { setTasks(prevTasks => prevTasks.map(task => { if (task.id === taskId) { const updatedTask = { ...task, plannedWeek: undefined, plannedMonth: undefined, plannedQuarter: undefined, ...newPlan, }; return updatedTask; } return task; })); const task = tasks.find(t => t.id === taskId); if (task) { let message = `Task "${task.name}" `; if (newPlan.week) message += `được lên kế hoạch cho tuần ${newPlan.week}.`; else if (newPlan.month) message += `được lên kế hoạch cho tháng ${newPlan.month}.`; else if (newPlan.quarter) message += `được lên kế hoạch cho quý ${newPlan.quarter}.`; else message += `được trả về Backlog.`; const newLog: LogEntry = { id: `log-${Date.now()}`, timestamp: new Date().toISOString(), message: message, taskId: taskId }; addLogEntries([newLog]); } }, [tasks, addLogEntries]);
  
  const handleOpenRuleEditor = (rule: Rule | null) => setRuleEditorState({ isOpen: true, rule });
  const handleCloseRuleEditor = () => setRuleEditorState({ isOpen: false, rule: null });
  const handleSaveRule = (ruleToSave: Rule) => { setRules(prevRules => { const isEditing = prevRules.some(r => r.id === ruleToSave.id); if (isEditing) { return prevRules.map(r => r.id === ruleToSave.id ? ruleToSave : r); } else { return [...prevRules, ruleToSave]; } }); handleCloseRuleEditor(); };
  const handleDeleteRule = (ruleId: string) => { if (window.confirm("Bạn có chắc muốn xóa quy tắc này?")) { setRules(prev => prev.filter(r => r.id !== ruleId)); } };
  const handleToggleRule = (ruleId: string) => { setRules(prev => prev.map(r => r.id === ruleId ? { ...r, isEnabled: !r.isEnabled } : r)); };
  const handleCloneRule = (rule: Rule) => { const newRule: Rule = { ...rule, id: `rule-${Date.now()}`, name: `${rule.name} (Copy)`, }; handleOpenRuleEditor(newRule); };
  
  const handleToggleTaskSelection = useCallback((taskId: string) => { setSelectedTaskIds(prev => { const newSet = new Set(prev); if (newSet.has(taskId)) { newSet.delete(taskId); } else { newSet.add(taskId); } return newSet; }); }, []);
  const handleToggleSelectAll = useCallback(() => { if (selectedTaskIds.size === filteredTasks.length) { setSelectedTaskIds(new Set()); } else { const allFilteredIds = new Set(filteredTasks.map(t => t.id)); setSelectedTaskIds(allFilteredIds); } }, [filteredTasks, selectedTaskIds.size]);
  const handleClearSelection = () => { setSelectedTaskIds(new Set()); };
  const handleBulkDelete = () => { if (window.confirm(`Bạn có chắc muốn xóa ${selectedTaskIds.size} công việc đã chọn?`)) { const selectedIds = Array.from(selectedTaskIds); setTasks(prev => prev.filter(t => !selectedTaskIds.has(t.id))); const newLog: LogEntry = { id: `log-${Date.now()}`, timestamp: new Date().toISOString(), message: `Đã xóa hàng loạt ${selectedTaskIds.size} công việc.`, }; addLogEntries([newLog]); handleClearSelection(); } };
  const handleBulkUpdate = (updates: Partial<Omit<Task, 'id'>>, deadlineShift: number | null) => { const newLogs: LogEntry[] = []; setTasks(prevTasks => prevTasks.map(task => { if (selectedTaskIds.has(task.id)) { const originalTask = { ...task }; let updatedTask = { ...task, ...updates }; if (deadlineShift !== null && !isNaN(deadlineShift)) { const newStartDate = new Date(task.startDate); newStartDate.setDate(newStartDate.getDate() + deadlineShift); updatedTask.startDate = newStartDate.toISOString().split('T')[0]; const newDeadline = new Date(task.deadline); newDeadline.setDate(newDeadline.getDate() + deadlineShift); updatedTask.deadline = newDeadline.toISOString().split('T')[0]; } const changeDescriptions: string[] = []; for (const key in updates) { const typedKey = key as keyof typeof updates; if (originalTask[typedKey] !== updatedTask[typedKey]) { changeDescriptions.push(`${typedKey} từ "${originalTask[typedKey]}" thành "${updatedTask[typedKey]}"`); } } if (deadlineShift !== null && !isNaN(deadlineShift)) { changeDescriptions.push(`dates shifted by ${deadlineShift} days`); } if (changeDescriptions.length > 0) { newLogs.push({ id: `log-${Date.now()}-${task.id}`, timestamp: new Date().toISOString(), message: `Bulk edit on task "${task.name}": ${changeDescriptions.join(', ')}.`, taskId: task.id, }); } return updatedTask; } return task; })); addLogEntries(newLogs); setIsBulkEditModalOpen(false); handleClearSelection(); };

  const handleOpenQuickCreate = (initialData: Partial<Task> = {}) => { setPanelTitle('Tạo Task mới'); setQuickCreateInitialData({ assignees: [currentUser], ...initialData }); setIsQuickCreateOpen(true); };
  const handleOpenCloneTask = (taskId: string) => { const taskToClone = tasks.find(t => t.id === taskId); if (!taskToClone) return; const duration = new Date(taskToClone.deadline).getTime() - new Date(taskToClone.startDate).getTime(); const today = new Date(); const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 1)); const newDeadline = new Date(startOfWeek.getTime() + duration); const clonedData: Partial<Task> = { ...taskToClone, name: `[Copy] ${taskToClone.name}`, status: TaskStatus.Todo, currentStatusNote: '', startDate: startOfWeek.toISOString().split('T')[0], deadline: newDeadline.toISOString().split('T')[0], completionDate: undefined, id: undefined, }; setPanelTitle(`Nhân bản từ: ${taskToClone.name}`); setQuickCreateInitialData(clonedData); setIsQuickCreateOpen(true); };
  const handleAddAssignee = (name: string) => setAssignees(prev => [...prev, name]);
  const handleUpdateAssignee = (oldName: string, newName: string) => { setAssignees(prev => prev.map(a => a === oldName ? newName : a)); setTasks(prev => prev.map(t => { if (t.assignees.includes(oldName)) { return { ...t, assignees: t.assignees.map(a => a === oldName ? newName : a) }; } return t; })); };
  const handleDeleteAssignee = (name: string) => setAssignees(prev => prev.filter(a => a !== name));
  const handleAddProject = (name: string) => setProjects(prev => [...prev, name]);
  const handleUpdateProject = (oldName: string, newName: string) => { setProjects(prev => prev.map(p => p === oldName ? newName : p)); setTasks(prev => prev.map(t => t.project === oldName ? {...t, project: newName} : t)); };
  const handleDeleteProject = (name: string) => setProjects(prev => prev.filter(p => p !== name));
  const handleAddPeriod = (name: string) => setPeriods(prev => [...prev, name]);
  const handleUpdatePeriod = (oldName: string, newName: string) => setPeriods(prev => prev.map(p => p === oldName ? newName : p));
  const handleDeletePeriod = (name: string) => setPeriods(prev => prev.filter(p => p !== name));
  const handleAddObjective = (objective: Omit<Objective, 'id'>) => { const newObjective = { ...objective, id: `obj-${Date.now()}` }; setObjectives(prev => [...prev, newObjective]); };
  const handleUpdateObjective = (updatedObjective: Objective) => { setObjectives(prev => prev.map(o => o.id === updatedObjective.id ? updatedObjective : o)); };
  const handleAddKeyResult = (keyResult: Omit<KeyResult, 'id'>) => { const newKeyResult = { ...keyResult, id: `kr-${Date.now()}` }; setKeyResults(prev => [...prev, newKeyResult]); };
  const handleUpdateKeyResult = (updatedKeyResult: KeyResult) => { setKeyResults(prev => prev.map(kr => kr.id === updatedKeyResult.id ? updatedKeyResult : kr)); };

  const processedOkrs = useMemo(() => { const tasksByKrId: Record<string, Task[]> = {}; tasks.forEach(task => { if (task.keyResultId) { if (!tasksByKrId[task.keyResultId]) { tasksByKrId[task.keyResultId] = []; } tasksByKrId[task.keyResultId].push(task); } }); const keyResultsWithProgress = keyResults.map(kr => { const { startValue, currentValue, targetValue } = kr; const range = targetValue - startValue; if (range <= 0) return { ...kr, progress: currentValue >= targetValue ? 100 : 0 }; const progress = Math.max(0, Math.min(100, ((currentValue - startValue) / range) * 100)); return { ...kr, progress }; }); const keyResultsByObjectiveId: Record<string, (KeyResult & { progress: number })[]> = {}; keyResultsWithProgress.forEach(kr => { if (!keyResultsByObjectiveId[kr.objectiveId]) { keyResultsByObjectiveId[kr.objectiveId] = []; } keyResultsByObjectiveId[kr.objectiveId].push(kr); }); type ProcessedObjective = Objective & { progress: number; children: ProcessedObjective[] }; const objectivesById = new Map<string, ProcessedObjective>(objectives.map(o => [o.id, { ...o, progress: 0, children: [] }])); const rootObjectives: ProcessedObjective[] = []; objectives.forEach(obj => { const processedObj = objectivesById.get(obj.id)!; if (obj.parentObjectiveId && objectivesById.has(obj.parentObjectiveId)) { objectivesById.get(obj.parentObjectiveId)!.children.push(processedObj); } else { rootObjectives.push(processedObj); } }); const calculateProgress = (objective: ProcessedObjective) => { const directKrs = keyResultsByObjectiveId[objective.id] || []; const krProgressSum = directKrs.reduce((sum, kr) => sum + (kr.progress || 0), 0); let krProgress: number | null = directKrs.length > 0 ? krProgressSum / directKrs.length : null; let childProgressSum = 0; let childrenWithProgress = 0; if (objective.children.length > 0) { objective.children.forEach(child => { calculateProgress(child); childProgressSum += child.progress; childrenWithProgress++; }); } let childProgress: number | null = childrenWithProgress > 0 ? childProgressSum / childrenWithProgress : null; if (krProgress !== null) { objective.progress = krProgress; } else if (childProgress !== null) { objective.progress = childProgress; } else { objective.progress = 0; } }; rootObjectives.forEach(calculateProgress); return { objectiveTree: rootObjectives, keyResultsByObjectiveId, tasksByKrId }; }, [objectives, keyResults, tasks]);
  const handleViewModeChange = (mode: 'user' | 'manager') => { setViewMode(mode); if (mode === 'manager') { setFilters(prev => ({ ...prev, assignee: 'all' })); if (activeView === 'my_day') { setActiveView('kpi_team'); } } else { setFilters(prev => ({ ...prev, assignee: currentUser })); } };

  const views: { id: View, label: string, icon: React.FC<{className?: string}>, section: string }[] = [
    { id: 'my_day', label: 'My Day', icon: SunIcon, section: 'Dashboard' },
    { id: 'kpi_team', label: 'KPI Team', icon: TeamIcon, section: 'Dashboard' },
    { id: 'kpi_nhan_vien', label: 'KPI Nhân viên', icon: UserIcon, section: 'Dashboard' },
    { id: 'forecast', label: 'Dự báo', icon: ForecastIcon, section: 'Dashboard' },
    { id: 'staff_summary', label: 'Báo cáo Tiến độ', icon: DocumentReportIcon, section: 'Dashboard' },
    { id: 'tasks', label: 'Danh sách Task', icon: ListBulletIcon, section: 'Views' },
    { id: 'kanban', label: 'Bảng Kanban', icon: KanbanIcon, section: 'Views' },
    { id: 'planning_board', label: 'Bảng Kế hoạch', icon: PlanningIcon, section: 'Views' },
    { id: 'gantt_calendar', label: 'Lịch & Gantt', icon: GanttChartIcon, section: 'Views' },
    { id: 'okr', label: 'Mục tiêu OKR', icon: OkrIcon, section: 'Views' },
    { id: 'meetings_actions', label: 'Họp & Action Items', icon: ClipboardListIcon, section: 'Views' },
    { id: 'automation', label: 'Tự động hóa', icon: AutomationIcon, section: 'Management' },
    { id: 'baseline', label: 'Baseline', icon: BaselineIcon, section: 'Management' },
    { id: 'master_data', label: 'Dữ liệu gốc', icon: DataIcon, section: 'Management' },
    { id: 'config', label: 'Cấu hình', icon: ConfigIcon, section: 'Management' },
  ];
  const viewSections = ['Dashboard', 'Views', 'Management'];
  const viewsWithFilters: View[] = ['tasks', 'planning_board'];
  const availableViews = useMemo(() => { if (viewMode === 'manager') { return views.filter(v => v.id !== 'my_day'); } return views; }, [viewMode]);

  return (
    <>
    <OutcomeModal 
        isOpen={outcomeModalState.isOpen}
        taskName={outcomeModalState.taskName}
        onClose={() => setOutcomeModalState({ isOpen: false, taskId: null, taskName: '' })}
        onSubmit={(outcome) => {
            if (outcomeModalState.taskId) {
                handleOutcomeSubmit(outcomeModalState.taskId, outcome);
            }
        }}
    />
     <RootCauseModal
        isOpen={rootCauseModalState.isOpen}
        taskName={rootCauseModalState.taskName}
        onClose={() => setRootCauseModalState({ isOpen: false, taskId: null, taskName: '' })}
        onSubmit={(reason, note) => {
            if (rootCauseModalState.taskId) {
                handleRootCauseSubmit(rootCauseModalState.taskId, reason, note);
            }
        }}
    />
    <ReviewSubmissionModal 
        isOpen={reviewSubmissionModalState.isOpen} 
        task={reviewSubmissionModalState.task} 
        assignees={assignees}
        onClose={() => setReviewSubmissionModalState({ isOpen: false, task: null })}
        onSubmit={handleSubmitReview}
    />
    <RuleEditorModal
        isOpen={ruleEditorState.isOpen}
        onClose={handleCloseRuleEditor}
        onSave={handleSaveRule}
        initialRule={ruleEditorState.rule}
        assignees={assignees}
        projects={projects}
    />
    <BulkEditModal
        isOpen={isBulkEditModalOpen}
        onClose={() => setIsBulkEditModalOpen(false)}
        onSave={handleBulkUpdate}
        assignees={assignees}
        projects={projects}
    />
    <QuickCreatePanel
      isOpen={isQuickCreateOpen}
      onClose={() => setIsQuickCreateOpen(false)}
      title={panelTitle}
    >
        <TaskForm
            onAddTask={(task, actionItems, callback) => handleAddTask(task, actionItems, callback)}
            assignees={assignees}
            projects={projects}
            taskTemplates={taskTemplates}
            objectives={objectives}
            keyResults={keyResults}
            initialData={quickCreateInitialData}
            onCancel={() => setIsQuickCreateOpen(false)}
            onSubmitSuccess={(keepOpen) => {
                if (!keepOpen) {
                    setIsQuickCreateOpen(false);
                }
            }}
            formType="panel"
        />
    </QuickCreatePanel>
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-200 overflow-hidden">
        {/* Sidebar */}
        <aside className={`${isSidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full opacity-0 border-none'} bg-white dark:bg-slate-800 flex flex-col border-r border-slate-200 dark:border-slate-700 transition-all duration-300 ease-in-out flex-shrink-0`}>
            <div className="px-4 pt-6 pb-4 flex items-center justify-between">
                <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400 px-2">TaskMaster</h1>
                <button onClick={() => setIsSidebarOpen(false)} className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                    <XMarkIcon className="h-5 w-5" />
                </button>
            </div>
            <div className="px-4 mb-4"><button onClick={() => handleOpenQuickCreate()} className="w-full flex items-center justify-center h-10 px-4 border border-transparent shadow-sm text-sm font-semibold rounded-full text-white bg-primary-600 hover:bg-primary-700 transition-colors"><PlusIcon className="h-5 w-5 mr-2 -ml-1" /> Tạo Task</button></div>
            <nav className="mt-4 flex-1 px-4 space-y-6 overflow-y-auto custom-scrollbar">{viewSections.map(section => (<div key={section}><h2 className="px-2 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">{section}</h2><div className="space-y-1">{availableViews.filter(v => v.section === section).map(view => (<button key={view.id} onClick={() => setActiveView(view.id)} className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors relative ${activeView === view.id ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-300' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'}`}>{activeView === view.id && <span className="absolute left-0 top-2 bottom-2 w-1 bg-primary-500 rounded-r-full"></span>}<view.icon className="h-5 w-5 mr-3" /><span>{view.label}</span></button>))}</div></div>))}</nav>
            <div className="p-4 mt-auto space-y-2"><ViewModeSwitcher viewMode={viewMode} onViewModeChange={handleViewModeChange} />{viewMode === 'user' && (<UserSelector users={assignees} currentUser={currentUser} onUserChange={setCurrentUser} />)}</div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-10 overflow-y-auto relative bg-slate-50 dark:bg-slate-900/50">
            {!isSidebarOpen && (
                <button onClick={() => setIsSidebarOpen(true)} className="absolute top-4 left-4 z-30 p-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-200 rounded-md shadow-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                    <Bars3BottomLeftIcon className="h-6 w-6" />
                </button>
            )}
            <div className="w-full max-w-full mx-auto flex flex-col gap-8">
                {viewsWithFilters.includes(activeView) && (<FilterBar filters={filters} setFilters={setFilters} assignees={assignees} projects={projects} tags={allTags} currentUser={currentUser} viewMode={viewMode} taskCount={filteredTasks.length} totalTaskCount={tasks.length} timeRange={timeRange} setTimeRange={setTimeRange} />)}
                {activeView === 'my_day' && <MyDayView tasks={tasks} currentUser={currentUser} onAddTask={(task, items, callback) => handleAddTask(task, items, callback)} projects={projects} />}
                {activeView === 'kpi_team' && <TeamKpiView teamForecast={teamForecast} aiSummary={aiSummary} isSummaryLoading={isSummaryLoading} onGetAiSummary={handleGetAiSummary} />}
                {activeView === 'kpi_nhan_vien' && <KpiNhanVien data={employeeKpis} />}
                {activeView === 'forecast' && <Forecast data={teamForecast} target={config.kpiTarget} daysPassed={config.daysPassed} totalDays={config.totalDays} />}
                {activeView === 'staff_summary' && <StaffWorkSummaryView tasks={tasks} assignees={assignees} projects={projects} />}
                {activeView === 'tasks' && (<TasksTable tasks={filteredTasks} actionItems={actionItems} meetingNotes={meetingNotes} onDeleteTask={handleDeleteTask} onUpdateTask={handleUpdateTask} onUpdateActionItem={handleUpdateActionItem} onAddActionItem={handleAddActionItem} assignees={assignees} projects={projects} onAddProject={handleAddProject} recentlyCompletedTaskId={recentlyCompletedTaskId} selectedTaskIds={selectedTaskIds} onToggleSelectTask={handleToggleTaskSelection} onToggleSelectAll={handleToggleSelectAll} isAllSelected={selectedTaskIds.size > 0 && selectedTaskIds.size === filteredTasks.length} onCloneTask={handleOpenCloneTask} currentUser={currentUser} onStatusChange={handleTaskStatusChange} onApprovalAction={handleApprovalAction} onAddComment={handleAddComment}/>)}
                {activeView === 'kanban' && <KanbanView tasks={tasks} actionItems={actionItems} assignees={assignees} projects={projects} tags={allTags} currentUser={currentUser} viewMode={viewMode} onTaskStatusChange={handleTaskStatusChange} onUpdateTask={handleUpdateTask} onUpdateActionItem={handleUpdateActionItem} onAddActionItem={handleAddActionItem} onDeleteTask={handleDeleteTask} onOpenQuickCreate={handleOpenQuickCreate} onAddComment={handleAddComment} onApprovalAction={handleApprovalAction} />}
                {activeView === 'planning_board' && <PlanningView tasks={tasks} filters={filters} actionItems={actionItems} assignees={assignees} currentUser={currentUser} projects={projects} onUpdateTask={handleUpdateTask} onOpenQuickCreate={handleOpenQuickCreate} onUpdateActionItem={handleUpdateActionItem} onAddActionItem={handleAddActionItem} onApprovalAction={handleApprovalAction} onAddComment={handleAddComment} onDeleteTask={handleDeleteTask} />}
                {activeView === 'gantt_calendar' && <GanttCalendarView tasks={tasks} assignees={assignees} projects={projects} onDateClick={(date) => handleOpenQuickCreate({ startDate: date, deadline: date })} onUpdateTask={handleUpdateTask} actionItems={actionItems}/>}
                {activeView === 'okr' && <OkrView objectiveTree={processedOkrs.objectiveTree} keyResultsByObjectiveId={processedOkrs.keyResultsByObjectiveId} tasksByKrId={processedOkrs.tasksByKrId} allObjectives={objectives} periods={periods} assignees={assignees} onAddObjective={handleAddObjective} onUpdateObjective={handleUpdateObjective} onAddKeyResult={handleAddKeyResult} onUpdateKeyResult={handleUpdateKeyResult} />}
                {activeView === 'meetings_actions' && <MeetingsAndActionsView actionItems={actionItems} meetingNotes={meetingNotes} tasks={tasks} assignees={assignees} />}
                {activeView === 'automation' && <AutomationView rules={rules} logs={logs} onOpenEditor={handleOpenRuleEditor} onDeleteRule={handleDeleteRule} onToggleRule={handleToggleRule} onCloneRule={handleCloneRule} />}
                {activeView === 'baseline' && <BaselineView baselines={baselines} actionItems={actionItems} meetingNotes={meetingNotes} currentUser={currentUser} onStatusChange={handleTaskStatusChange} onReviewAction={() => {}} />}
                {activeView === 'master_data' && (<MasterDataView assignees={assignees} onAddAssignee={handleAddAssignee} onUpdateAssignee={handleUpdateAssignee} onDeleteAssignee={handleDeleteAssignee} projects={projects} onAddProject={handleAddProject} onUpdateProject={handleUpdateProject} onDeleteProject={handleDeleteProject} periods={periods} onAddPeriod={handleAddPeriod} onUpdatePeriod={handleUpdatePeriod} onDeletePeriod={handleDeletePeriod} tasks={tasks} />)}
                {activeView === 'config' && <ConfigPanel config={config} onConfigChange={setConfig} />}
            </div>
        </main>
    </div>
    {selectedTaskIds.size > 0 && activeView === 'tasks' && (<BulkActionBar count={selectedTaskIds.size} onEdit={() => setIsBulkEditModalOpen(true)} onDelete={handleBulkDelete} onClear={handleClearSelection} />)}
    </>
  );
};

export default App;
