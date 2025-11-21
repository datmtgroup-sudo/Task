
import { Task, Config, WorkType, TaskStatus, AdhocOrigin, Priority, Rule, TriggerType, ConditionField, ConditionOperator, ActionType, MeetingNote, ActionItem, ActionItemStatus, Sprint, Objective, KeyResult, OkrLevel, Channel, TaskTemplate, ReviewStatus, LateReason, ApprovalStatus } from './types';

export const DEFAULT_CONFIG: Config = {
  planWeight: 1.0,
  adhocWeight: 0.8,
  kpiTarget: 0.9,
  totalDays: 30,
  daysPassed: 15,
};

export const DEFAULT_TASKS: Task[] = [
  { id: '1', name: 'Thiết kế banner quảng cáo Q4', project: 'Campaign Q4', assignees: ['Nguyễn Văn A'], workType: WorkType.Plan, status: TaskStatus.Done, priority: Priority.Cao, points: 5, impact: 3, estimated_hours: 8, startDate: '2024-10-01', deadline: '2024-10-05', outcome: { summary: 'Final banner designs approved and uploaded to Google Drive' }, keyResultId: 'kr-2', channel: Channel.Facebook, tags: ['design', 'q4-campaign'], review_required: true, approver: 'Lê Văn C', reviewStatus: ReviewStatus.Approved, approvalStatus: ApprovalStatus.Approved },
  { id: '2', name: 'Viết bài SEO cho sản phẩm mới', project: 'Product Launch X', assignees: ['Trần Thị B'], workType: WorkType.Plan, status: TaskStatus.Done, priority: Priority.TrungBinh, points: 8, impact: 2, estimated_hours: 12.5, startDate: '2024-10-02', deadline: '2024-10-08', outcome: { summary: 'Bài viết SEO đã được đăng và index thành công trên Google, đạt top 10 cho từ khóa mục tiêu.' }, keyResultId: 'kr-4', channel: Channel.Website, tags: ['seo', 'content'], review_required: false, reviewStatus: ReviewStatus.NotRequired, approvalStatus: ApprovalStatus.NotApplicable },
  { id: '3', name: 'Fix bug login trên mobile app', project: 'Mobile App', assignees: ['Lê Văn C'], workType: WorkType.Adhoc, status: TaskStatus.Done, priority: Priority.KhanCap, adhocOrigin: AdhocOrigin.LoiHeThong, points: 5, impact: 3, estimated_hours: 4, startDate: '2024-10-01', deadline: '2024-10-02', outcome: { summary: 'Lỗi đã được khắc phục và phiên bản vá 1.2.1 đã được phát hành trên Play Store.' }, review_required: false, reviewStatus: ReviewStatus.NotRequired, approvalStatus: ApprovalStatus.NotApplicable },
  { id: '4', name: 'Lên kịch bản livestream 10/10', project: 'Campaign Q4', assignees: ['Nguyễn Văn A'], workType: WorkType.Plan, status: TaskStatus.Doing, priority: Priority.Cao, points: 8, impact: 3, estimated_hours: 10, startDate: '2024-10-05', deadline: '2024-10-09', description: 'Kịch bản cần bao gồm các phần tương tác, minigame và kêu gọi chốt đơn.', currentStatusNote: 'Đã xong dàn ý chính, đang chờ thông tin sản phẩm khuyến mãi.', keyResultId: 'kr-2', channel: Channel.Facebook, tags: ['livestream', 'q4-campaign'], review_required: true, approver: 'Lê Văn C', reviewStatus: ReviewStatus.NotSubmitted, approvalStatus: ApprovalStatus.NotApplicable },
  { id: '5', name: 'Họp khẩn với đối tác ABC', project: 'Partnership', assignees: ['Trần Thị B'], workType: WorkType.Adhoc, status: TaskStatus.PendingReview, priority: Priority.KhanCap, adhocOrigin: AdhocOrigin.Sep, points: 3, impact: 2, estimated_hours: 2, startDate: '2024-10-11', deadline: '2024-10-11', currentStatusNote: 'Đã gửi biên bản họp, đang chờ đối tác phản hồi về các điều khoản.', review_required: true, approver: 'Lê Văn C', reviewStatus: ReviewStatus.Pending, approvalStatus: ApprovalStatus.Pending },
  { id: '6', name: 'Nghiên cứu đối thủ cạnh tranh', project: 'Market Research', assignees: ['Lê Văn C'], workType: WorkType.Plan, status: TaskStatus.Todo, priority: Priority.TrungBinh, points: 5, impact: 2, estimated_hours: 8, startDate: '2024-10-10', deadline: '2024-10-20', review_required: false, reviewStatus: ReviewStatus.NotRequired, approvalStatus: ApprovalStatus.NotApplicable },
  { id: '7', name: 'Tối ưu hóa trang landing page', project: 'Product Launch X', assignees: ['Nguyễn Văn A'], workType: WorkType.Plan, status: TaskStatus.Todo, priority: Priority.Cao, points: 5, impact: 3, estimated_hours: 6, startDate: '2024-10-15', deadline: '2024-10-25', description: 'Cải thiện tốc độ tải trang và tỷ lệ chuyển đổi cho landing page sản phẩm X.', keyResultId: 'kr-3', channel: Channel.Website, tags: ['cro', 'performance'], review_required: false, reviewStatus: ReviewStatus.NotRequired, approvalStatus: ApprovalStatus.NotApplicable },
  { id: '8', name: 'Chuẩn bị slide cho buổi họp tuần', project: 'Operations', assignees: ['Trần Thị B'], workType: WorkType.Plan, status: TaskStatus.Doing, priority: Priority.TrungBinh, points: 2, impact: 1, estimated_hours: 2.5, startDate: '2024-10-12', deadline: '2024-10-14', currentStatusNote: 'Đã thu thập đủ số liệu, đang dựng biểu đồ.', tags: ['report'], review_required: false, reviewStatus: ReviewStatus.NotRequired, approvalStatus: ApprovalStatus.NotApplicable },
  { id: '9', name: 'Khách hàng A yêu cầu báo giá gấp', project: 'Sales', assignees: ['Trần Thị B'], workType: WorkType.Adhoc, status: TaskStatus.Todo, priority: Priority.Cao, adhocOrigin: AdhocOrigin.KhachHang, points: 2, impact: 2, estimated_hours: 1, startDate: '2024-10-13', deadline: '2024-10-13', currentStatusNote: 'Đang chờ confirm giá chiết khấu từ sếp.', review_required: false, reviewStatus: ReviewStatus.NotRequired, approvalStatus: ApprovalStatus.NotApplicable },
];

export const DEFAULT_RULES: Rule[] = [
  {
    id: 'rule-1',
    name: 'Tự động gán task Khẩn cấp cho Manager',
    trigger: TriggerType.TaskCreated,
    conditions: [
      { field: ConditionField.Priority, operator: ConditionOperator.Is, value: Priority.KhanCap },
    ],
    action: { type: ActionType.SetAssignee, value: 'Lê Văn C' },
    priority: 1,
    isEnabled: true,
  },
  {
    id: 'rule-4',
    name: "Tự động gán task Ad-hoc Khẩn cấp cho Manager",
    trigger: TriggerType.TaskCreated,
    conditions: [
      { field: ConditionField.Priority, operator: ConditionOperator.Is, value: Priority.KhanCap },
      { field: ConditionField.WorkType, operator: ConditionOperator.Is, value: WorkType.Adhoc },
    ],
    action: { type: ActionType.SetAssignee, value: 'Lê Văn C' },
    priority: 2,
    isEnabled: true,
  },
  {
    id: 'rule-3',
    name: 'Vô hiệu hóa: Gán mọi task Ad-hoc cho team Operations',
    trigger: TriggerType.TaskCreated,
    conditions: [
      { field: ConditionField.WorkType, operator: ConditionOperator.Is, value: WorkType.Adhoc },
    ],
    action: { type: ActionType.SetAssignee, value: 'Trần Thị B' },
    priority: 5,
    isEnabled: false,
  },
  {
    id: 'rule-2',
    name: 'Khi task hoàn thành review, tự động chuyển sang Done',
    trigger: TriggerType.StatusChanged,
    conditions: [
      { field: ConditionField.Status, operator: ConditionOperator.Is, value: TaskStatus.PendingReview },
    ],
    action: { type: ActionType.ChangeStatus, value: TaskStatus.Done },
    priority: 10,
    isEnabled: true,
  },
];

export const DEFAULT_MEETING_NOTES: MeetingNote[] = [
    {
        id: 'note-1',
        title: 'Weekly Sync - Product Launch X',
        date: '2024-10-10',
        attendees: ['Nguyễn Văn A', 'Trần Thị B'],
        content: 'Thảo luận về tiến độ landing page. Cần thêm A/B testing for a new headline.'
    },
    {
        id: 'note-2',
        title: 'Campaign Q4 Brainstorm',
        date: '2024-10-04',
        attendees: ['Nguyễn Văn A', 'Lê Văn C'],
        content: 'Finalized the main slogan. Next step is banner design.'
    }
];

export const DEFAULT_ACTION_ITEMS: ActionItem[] = [
    {
        id: 'ai-1',
        description: 'Soạn thảo 2 phương án tiêu đề mới cho landing page',
        owners: ['Trần Thị B'],
        dueDate: '2024-10-15',
        status: ActionItemStatus.Todo,
        taskId: '7', // Tối ưu hóa trang landing page
        meetingNoteId: 'note-1',
        stepOrder: 1,
        currentStatusNote: 'Chờ file phân tích từ khóa từ team SEO.'
    },
    {
        id: 'ai-2',
        description: 'Gửi yêu cầu thiết kế banner cho team design',
        owners: ['Nguyễn Văn A'],
        dueDate: '2024-10-06',
        status: ActionItemStatus.Done,
        taskId: '1', // Thiết kế banner quảng cáo Q4
        meetingNoteId: 'note-2',
        stepOrder: 1,
        outcome: 'Team design đã xác nhận nhận brief và sẽ trả kết quả vào ngày 2024-10-07.'
    },
    {
        id: 'ai-3',
        description: 'Chuẩn bị dữ liệu A/B test',
        owners: ['Nguyễn Văn A'],
        dueDate: '2024-10-18',
        status: ActionItemStatus.Todo,
        taskId: '7', // Tối ưu hóa trang landing page
        stepOrder: 2,
        currentStatusNote: 'Đã có 2 phiên bản tiêu đề, cần set up campaign trên Google Optimize.'
    }
];

export const DEFAULT_SPRINTS: Sprint[] = [
    {
        id: 'sprint-1',
        name: 'Tuần 42 (14/10 - 20/10)',
        startDate: '2024-10-14',
        endDate: '2024-10-20',
        goal: 'Hoàn thành M1 cho Product Launch X và chuẩn bị cho livestream.',
        team: 'Marketing',
        status: 'Active'
    },
    {
        id: 'sprint-2',
        name: 'Tuần 43 (21/10 - 27/10)',
        startDate: '2024-10-21',
        endDate: '2024-10-27',
        goal: 'Tối ưu hóa chiến dịch Q4 và phân tích đối thủ.',
        team: 'Marketing',
        status: 'Planning'
    }
];

export const DEFAULT_OBJECTIVES: Objective[] = [
    { id: 'obj-1', title: 'Tăng trưởng doanh thu và mở rộng thị trường Quý 4', owner: 'Công ty', level: OkrLevel.Company, period: 'Quý 4, 2024' },
    { id: 'obj-2', title: 'Ra mắt thành công sản phẩm mới X', owner: 'Công ty', level: OkrLevel.Company, period: 'Quý 4, 2024' },
    { id: 'obj-3', title: 'Tăng cường nhận diện thương hiệu cho Campaign Q4', owner: 'Marketing', level: OkrLevel.Team, period: 'Quý 4, 2024', parentObjectiveId: 'obj-1' },
    { id: 'obj-4', title: 'Đảm bảo trải nghiệm người dùng tuyệt vời cho sản phẩm X', owner: 'Product', level: OkrLevel.Team, period: 'Quý 4, 2024', parentObjectiveId: 'obj-2' },
];

export const DEFAULT_KEY_RESULTS: KeyResult[] = [
    { id: 'kr-1', objectiveId: 'obj-1', title: 'Đạt doanh thu 5 tỷ VNĐ', owner: 'Lê Văn C', startValue: 0, currentValue: 1.2, targetValue: 5, unit: 'tỷ' },
    { id: 'kr-2', objectiveId: 'obj-3', title: 'Tăng lượt tiếp cận trên các kênh social media lên 500,000', owner: 'Nguyễn Văn A', startValue: 100000, currentValue: 350000, targetValue: 500000, unit: 'lượt', linkedProject: 'Campaign Q4' },
    { id: 'kr-3', objectiveId: 'obj-4', title: 'Tăng tỷ lệ chuyển đổi trên landing page từ 3% lên 5%', owner: 'Nguyễn Văn A', startValue: 3, currentValue: 3.2, targetValue: 5, unit: '%' },
    { id: 'kr-4', objectiveId: 'obj-4', title: 'Đạt 1,000 lượt đăng ký tài khoản mới cho sản phẩm X', owner: 'Trần Thị B', startValue: 0, currentValue: 650, targetValue: 1000, unit: 'users', linkedProject: 'Product Launch X' },
];

export const DEFAULT_TASK_TEMPLATES: TaskTemplate[] = [
  {
    id: 'template-1',
    name: 'Facebook Post',
    category: 'Content',
    defaultTitle: '[Facebook] - ',
    defaultDescription: 'Mục tiêu: \nĐối tượng: \nThông điệp chính: \nKêu gọi hành động (CTA): ',
    defaultActionItems: [
      '- Soạn nội dung & hình ảnh',
      '- Chờ duyệt',
      '- Lên lịch đăng bài'
    ],
    defaultChannel: Channel.Facebook,
    defaultTags: ['facebook', 'social-media'],
    defaultPriority: Priority.TrungBinh,
    defaultPoints: 3,
    defaultEstimatedHours: 2,
  },
  {
    id: 'template-2',
    name: 'Báo cáo Tuần',
    category: 'Report',
    defaultTitle: 'Báo cáo hiệu suất tuần - ',
    defaultDescription: 'Tổng hợp và phân tích các chỉ số hiệu suất chính trong tuần vừa qua.',
    defaultActionItems: [
      '- Thu thập dữ liệu từ Analytics',
      '- Thu thập dữ liệu từ Social Media',
      '- Viết nhận xét và đề xuất',
      '- Gửi báo cáo cho quản lý'
    ],
    defaultTags: ['report', 'weekly'],
    defaultPriority: Priority.TrungBinh,
    defaultPoints: 5,
    defaultEstimatedHours: 4,
  }
];


export const DEFAULT_ASSIGNEES = ['Nguyễn Văn A', 'Trần Thị B', 'Lê Văn C'];
export const DEFAULT_PROJECTS = ['Campaign Q4', 'Product Launch X', 'Mobile App', 'Partnership', 'Market Research', 'Operations', 'Sales'];
export const DEFAULT_PERIODS = ['Quý 4, 2024', 'Quý 1, 2025'];
export const DEFAULT_TAGS = ['facebook', 'tiktok', 'design', 'urgent', 'report', 'seo', 'content', 'livestream', 'q4-campaign', 'cro', 'performance'];


export const WORK_TYPE_OPTIONS = Object.values(WorkType);
export const TASK_STATUS_OPTIONS = Object.values(TaskStatus);
export const ADHOC_ORIGIN_OPTIONS = Object.values(AdhocOrigin);
export const PRIORITY_OPTIONS = Object.values(Priority);
export const CHANNEL_OPTIONS = Object.values(Channel);
export const LATE_REASON_OPTIONS = Object.values(LateReason); // NEW
export const IMPACT_OPTIONS = [1, 2, 3];
export const POINT_OPTIONS = [1, 2, 3, 5, 8, 13];
export const ACTION_ITEM_STATUS_OPTIONS = Object.values(ActionItemStatus);


// Automation Options
export const TRIGGER_TYPE_OPTIONS = [
    { value: TriggerType.TaskCreated, label: 'Khi Task được tạo' },
    { value: TriggerType.StatusChanged, label: 'Khi Trạng thái thay đổi' },
];

export const CONDITION_FIELD_OPTIONS = [
    { value: ConditionField.Status, label: 'Trạng thái' },
    { value: ConditionField.Priority, label: 'Độ ưu tiên' },
    { value: ConditionField.WorkType, label: 'Loại công việc' },
    { value: ConditionField.Project, label: 'Project' },
];

export const CONDITION_OPERATOR_OPTIONS = [
    { value: ConditionOperator.Is, label: 'là' },
    { value: ConditionOperator.IsNot, label: 'không là' },
];

export const ACTION_TYPE_OPTIONS = [
    { value: ActionType.ChangeStatus, label: 'Thay đổi Trạng thái thành' },
    { value: ActionType.SetAssignee, label: 'Gán cho người' },
];