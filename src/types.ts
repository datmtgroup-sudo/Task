
export enum WorkType {
  Plan = 'Plan',
  Adhoc = 'Adhoc'
}

export enum TaskStatus {
  Todo = 'Todo',
  Doing = 'Đang làm',
  PendingReview = 'Đang duyệt', // Visual state for Waiting for Approval
  Done = 'Hoàn thành',
  Defer = 'Defer'
}

// NEW: Approval Status specific to the workflow
export enum ApprovalStatus {
  NotApplicable = 'Không áp dụng',
  Pending = 'CHỜ DUYỆT',
  Approved = 'ĐÃ DUYỆT',
  Rejected = 'YÊU CẦU SỬA'
}

export enum ReviewStatus {
    NotRequired = 'Not Required',
    NotSubmitted = 'Not Submitted',
    Pending = 'Pending',
    Approved = 'Approved',
    Rejected = 'Rejected',
}

export enum LateReason {
    ManagerReview = 'Chờ sếp duyệt lâu',
    ClientFeedback = 'Khách hàng đổi brief/chờ feedback',
    ResourceShortage = 'Thiếu nhân sự/quá tải',
    BadEstimate = 'Estimate effort sai',
    ThirdPartyBlocker = 'Block bởi bên thứ ba/đối tác',
    PriorityShift = 'Ưu tiên khác chen vào (ad-hoc)',
    Other = 'Nguyên nhân khác',
}

export enum AdhocOrigin {
  KhachHang = 'Khách hàng',
  Sep = 'Sếp',
  LoiHeThong = 'Lỗi hệ thống',
  CoHoiMoi = 'Cơ hội mới',
  Khac = 'Khác'
}

export enum Priority {
    Thap = 'Thấp',
    TrungBinh = 'Trung bình',
    Cao = 'Cao',
    KhanCap = 'Khẩn cấp'
}

export enum Channel {
    Facebook = 'Facebook',
    TikTok = 'TikTok',
    YouTube = 'YouTube',
    Website = 'Website',
    Email = 'Email',
    Offline = 'Offline',
    Other = 'Other'
}

export interface BaselineInfo {
    period: string;
    baselinedAt: string;
}

export interface NoteHistoryEntry {
    date: string;
    note: string;
}

export interface ApprovalHistoryEntry {
    date: string;
    actor: string;
    action: 'submitted' | 'approved' | 'rejected' | 'cancelled';
    comment?: string;
}

export interface Attachment {
  id: string;
  type: 'file' | 'link';
  provider: 'gdrive' | 'figma' | 'notion' | 'pdf' | 'image' | 'generic';
  url: string; 
  displayName: string;
  note?: string;
}

export interface TaskOutcome {
    summary: string;
    links?: { url: string; label: string }[];
    metrics?: { key: string; value: string }[];
}

// NEW: Comment Interface
export interface Comment {
    id: string;
    taskId: string;
    author: string;
    content: string;
    timestamp: string;
    mentions?: string[]; // List of usernames mentioned
}

export interface Task {
  id: string;
  name: string;
  project: string;
  assignees: string[];

  // Phân loại
  workType: WorkType;
  status: TaskStatus;
  priority: Priority;
  adhocOrigin?: AdhocOrigin;
  channel?: Channel; 
  tags?: string[]; 

  // Ước tính
  points: number;
  impact: number; 
  estimated_hours?: number;

  // Thời gian
  startDate: string;
  deadline: string;
  completionDate?: string;

  // Siêu dữ liệu
  description?: string; 
  currentStatusNote?: string;
  noteHistory?: NoteHistoryEntry[];
  attachments?: Attachment[];
  baselineInfo?: BaselineInfo;

  // --- NEW: Approval Workflow Fields ---
  review_required: boolean;
  
  // The specific approver (manager/lead)
  approver?: string; 
  
  // Current approval status
  approvalStatus: ApprovalStatus;
  
  approved_at?: string;
  approved_by?: string;
  
  // To store rejection reason or last approval note
  approval_note?: string; 
  
  approvalHistory?: ApprovalHistoryEntry[];
  
  // Comments thread
  comments?: Comment[];
  // --- END: Approval Workflow Fields ---
  
  // Legacy fields mapping (can be deprecated or kept for compatibility)
  reviewStatus: ReviewStatus; 
  review_requested_at?: string;
  review_resolved_at?: string;
  rejection_comment?: string;

  outcome?: TaskOutcome;

  is_late?: boolean;
  late_completion_reason?: LateReason;
  late_completion_note?: string;

  // Planning Module Fields
  plannedDate?: string; // Format: YYYY-MM-DD
  plannedWeek?: string; // Format: YYYY-Www
  plannedMonth?: string; // Format: YYYY-MM
  plannedQuarter?: string; // Format: YYYY-Qx
  plannedWeekOfMonth?: number; // 1-5
  sprintId?: string;

  // OKR Linking
  keyResultId?: string;
  campaignId?: string;
}

export interface TaskTemplate {
    id: string;
    name: string;
    category: 'Content' | 'Report' | 'Campaign' | 'Other';
    defaultTitle: string;
    defaultDescription?: string;
    defaultActionItems?: string[];
    defaultTags?: string[];
    defaultChannel?: Channel;
    defaultPriority?: Priority;
    defaultPoints?: number;
    defaultEstimatedHours?: number;
}

export interface Config {
  planWeight: number;
  adhocWeight: number;
  kpiTarget: number;
  totalDays: number;
  daysPassed: number;
}

export interface KpiData {
  totalPlan: number;
  totalAdhoc: number;
  donePlan: number;
  doneAdhoc: number;
  kpiPlan: number;
  kpiAdhoc: number;
  totalWeighted: number;
  doneWeighted: number;
  kpiWeighted: number;
}

export interface ForecastData extends KpiData {
    velocity: number;
    forecastedCompletion: number;
    forecastedKpi: number;
}

// --- Action Item & Meeting Note Types ---
export enum ActionItemStatus {
    Todo = 'Todo',
    Doing = 'Doing',
    Done = 'Done',
    Blocked = 'Blocked',
    Defer = 'Defer',
}

export interface ActionItem {
    id: string;
    description: string;
    owners: string[];
    dueDate: string;
    status: ActionItemStatus;
    taskId: string; 
    meetingNoteId?: string; 
    stepOrder: number;
    currentStatusNote?: string;
    noteHistory?: NoteHistoryEntry[];
    outcome?: string;
    points?: number; 
    tags?: string[]; // Added tags
    project?: string; // Added project
}

export interface MeetingNote {
    id: string;
    title: string;
    date: string;
    attendees: string[];
    content: string; 
}


// --- Automation Engine Types ---
export enum TriggerType {
  TaskCreated = 'TASK_CREATED',
  StatusChanged = 'STATUS_CHANGED',
}

export enum ConditionField {
  Status = 'status',
  Priority = 'priority',
  WorkType = 'workType',
  Project = 'project',
}

export enum ConditionOperator {
  Is = 'IS',
  IsNot = 'IS_NOT',
}

export enum ActionType {
  ChangeStatus = 'CHANGE_STATUS',
  SetAssignee = 'SET_ASSIGNEE',
}

export interface RuleCondition {
  field: ConditionField;
  operator: ConditionOperator;
  value: TaskStatus | Priority | WorkType | string;
}

export interface RuleAction {
  type: ActionType;
  value: TaskStatus | string; 
}

export interface Rule {
  id: string;
  name: string;
  trigger: TriggerType;
  conditions: RuleCondition[];
  action: RuleAction;
  priority: number;
  isEnabled: boolean;
}

export interface LogEntry {
    id: string;
    timestamp: string;
    message: string;
    taskId?: string;
    ruleId?: string;
}

// --- Baseline Types ---
export interface Baseline {
    id: string;
    periodName: string;
    createdAt: string;
    tasks: Task[];
}

// --- Report Types ---
export enum SchedulePerformance {
    Ahead = 'Vượt tiến độ',
    OnTime = 'Đúng tiến độ',
    Late = 'Trễ tiến độ',
    InProgress = 'Đang tiến hành'
}

// --- Filter Types ---
export type TimeRange = 'week' | 'month' | 'quarter' | 'all';

export interface Filters {
    assignee: string;
    project: string;
    status: string;
    priority: string;
    workType: string;
    channel: string; 
    tags: string; 
}

// --- Planning Module Types ---
export interface Sprint {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    goal: string;
    team: string;
    status: 'Planning' | 'Active' | 'Completed';
}

// --- OKR Module Types ---
export enum OkrLevel {
    Company = 'Công ty',
    Team = 'Team',
    Individual = 'Cá nhân'
}

export enum OkrStatus {
    OnTrack = 'Đúng tiến độ',
    AtRisk = 'Có rủi ro',
    Behind = 'Chậm tiến độ'
}

export interface KeyResult {
    id: string;
    title: string;
    objectiveId: string;
    owner: string; 
    startValue: number;
    targetValue: number;
    currentValue: number;
    unit: string;
    linkedProject?: string;
}

export interface Objective {
    id: string;
    title: string;
    owner: string;
    level: OkrLevel;
    parentObjectiveId?: string;
    period: string; 
}

// --- AI Helper Types ---
export interface SuggestedActionItem {
    id: string;
    title: string;
    suggestion: string;
}

export interface SuggestedScoring {
    points: number | null;
    priority: Priority | null;
    deadline: string | null;
}

export interface SuggestedAssignee {
    name: string;
    reason: string;
}
