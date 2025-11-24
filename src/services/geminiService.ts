import { GoogleGenAI, Type } from "@google/genai";
import { ForecastData, Task, SuggestedActionItem, SuggestedScoring, SuggestedAssignee, Channel, WorkType, Priority } from "../types";

// Thay bằng API Key thật của bạn hoặc lấy từ biến môi trường
const API_KEY = "YOUR_API_KEY_HERE"; 

if (!API_KEY || API_KEY === "YOUR_API_KEY_HERE") {
  console.warn("Gemini API key not found. AI features will be disabled.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generateKpiSummary = async (kpiData: ForecastData): Promise<string> => {
  if (!API_KEY) return "Chưa cấu hình API Key.";
  
  // ... (Giữ logic cũ của bạn hoặc thêm prompt ở đây)
  return "Tính năng tóm tắt đang được cập nhật...";
};

export const getTaskSuggestionsForMyDay = async (tasks: Task[]): Promise<string[]> => {
   return []; // Placeholder
};

// --- CÁC HÀM MỚI (BẮT BUỘC PHẢI CÓ) ---

export const generateChecklist = async (taskContext: Partial<Task>): Promise<SuggestedActionItem[]> => {
    console.log("AI generating checklist...");
    await sleep(1000); // Giả lập delay
    
    // Logic giả lập trả về dữ liệu mẫu (hoặc gọi API thật nếu có key)
    return [
        { id: '1', title: 'Nghiên cứu và thu thập thông tin', suggestion: 'Quan trọng' },
        { id: '2', title: 'Lên dàn ý chi tiết', suggestion: 'Bước 1' },
        { id: '3', title: 'Thực hiện bản nháp đầu tiên', suggestion: '' },
        { id: '4', title: 'Review và chỉnh sửa', suggestion: 'Kiểm tra kỹ' },
        { id: '5', title: 'Hoàn thiện và bàn giao', suggestion: 'Final' }
    ];
};

export const generateScoring = async (taskContext: Partial<Task>): Promise<SuggestedScoring> => {
    await sleep(800);
    return { 
        points: 5, 
        priority: Priority.TrungBinh, 
        deadline: new Date().toISOString().split('T')[0] 
    };
};

export const generateAssigneeSuggestions = async (taskContext: Partial<Task>): Promise<SuggestedAssignee[]> => {
    await sleep(800);
    return [
        { name: 'Nguyễn Văn A', reason: 'Phù hợp kỹ năng' },
        { name: 'Trần Thị B', reason: 'Đang trống lịch' }
    ];
};