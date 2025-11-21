import { GoogleGenAI, Type } from "@google/genai";
import { ForecastData, Task, SuggestedActionItem, SuggestedScoring, SuggestedAssignee, Channel, WorkType, Priority } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("Gemini API key not found. AI features will be disabled.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

// Helper to simulate network delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));


export const generateKpiSummary = async (kpiData: ForecastData): Promise<string> => {
  if (!API_KEY) {
    return "API Key for Gemini is not configured. AI summary is unavailable.";
  }

  const prompt = `Dựa vào các chỉ số KPI sau đây của một team, hãy đưa ra một bản tóm tắt ngắn gọn (3-4 câu) về hiệu suất của họ, chỉ ra điểm mạnh, điểm cần cải thiện và đưa ra một lời khuyên. Viết bằng tiếng Việt.

Dữ liệu KPI:
- KPI Kế hoạch (Plan) Hoàn thành: ${(kpiData.kpiPlan * 100).toFixed(1)}% (${kpiData.donePlan}/${kpiData.totalPlan} điểm)
- KPI Phát sinh (Ad-hoc) Xử lý: ${(kpiData.kpiAdhoc * 100).toFixed(1)}% (${kpiData.doneAdhoc}/${kpiData.totalAdhoc} điểm)
- KPI Tổng hợp (có trọng số): ${(kpiData.kpiWeighted * 100).toFixed(1)}%
- Dự báo KPI cuối kỳ: ${(kpiData.forecastedKpi * 100).toFixed(1)}%
- Mục tiêu KPI: ${(kpiData.forecastedKpi > 0.9 ? 'Đạt' : 'Có nguy cơ không đạt')}
`;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            systemInstruction: "Bạn là một chuyên gia phân tích dữ liệu và tư vấn vận hành chuyên nghiệp.",
        }
    });
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API for KPI Summary:", error);
    return "Đã xảy ra lỗi khi tạo tóm tắt từ AI.";
  }
};


export const getTaskSuggestionsForMyDay = async (tasks: Task[]): Promise<string[]> => {
    if (!API_KEY) {
        console.warn("Gemini API not available for task suggestions.");
        return [];
    }

    const taskDataForPrompt = tasks.map(t => ({
        id: t.id,
        name: t.name,
        priority: t.priority,
        deadline: t.deadline,
        impact: t.impact
    }));

    const prompt = `Bạn là một trợ lý năng suất chuyên nghiệp. Mục tiêu của bạn là giúp người dùng xác định những công việc quan trọng nhất trong ngày.
Dựa vào danh sách công việc chưa hoàn thành sau đây (định dạng JSON), hãy phân tích và chọn ra từ 3 đến 5 công việc quan trọng nhất mà người dùng nên tập trung vào hôm nay.

Hãy cân nhắc các yếu tố theo thứ tự sau:
1.  **Độ ưu tiên**: "Khẩn cấp" và "Cao" là quan trọng nhất.
2.  **Deadline**: Những công việc quá hạn hoặc đến hạn hôm nay cần được ưu tiên.
3.  **Mức độ ảnh hưởng (impact)**: Điểm ảnh hưởng cao hơn (3 là cao nhất) nên được ưu tiên.
4.  **Tên công việc**: Tìm các từ khóa như "fix bug", "khẩn", "gấp".

Danh sách công việc:
${JSON.stringify(taskDataForPrompt, null, 2)}

Chỉ trả về ID của các công việc được đề xuất.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        taskIds: {
                            type: Type.ARRAY,
                            description: "Một mảng các ID của các công việc được đề xuất.",
                            items: {
                                type: Type.STRING,
                            },
                        },
                    },
                    required: ["taskIds"],
                },
            },
        });

        const jsonText = response.text;
        const result = JSON.parse(jsonText);
        if (result && Array.isArray(result.taskIds)) {
            return result.taskIds;
        }
        return [];
    } catch (error) {
        console.error("Error calling Gemini API for Task Suggestions:", error);
        return [];
    }
};

// --- NEW AI Helper Services ---

export const generateChecklist = async (taskContext: Partial<Task>): Promise<SuggestedActionItem[]> => {
    console.log("AI is generating checklist for:", taskContext);
    await sleep(1500); // Simulate AI thinking

    if (!taskContext.description || taskContext.description.length < 10) {
        return [{ id: 'warn-1', title: 'Mô tả quá ngắn để tạo checklist hiệu quả.', suggestion: 'Hãy thêm chi tiết về mục tiêu và các bước cần làm.' }];
    }

    const suggestions: SuggestedActionItem[] = [];
    
    // Generic suggestions
    suggestions.push(
        { id: 'sugg-1', title: 'Xác định mục tiêu chính và KPI đo lường', suggestion: 'Gợi ý cho: content, due:+1' },
        { id: 'sugg-2', title: 'Soạn thảo nội dung/kịch bản chi tiết', suggestion: 'Gợi ý cho: content, due:+2' }
    );
    
    // Context-specific suggestions
    if (taskContext.channel === Channel.Facebook) {
         suggestions.push({ id: 'sugg-fb1', title: 'Chuẩn bị hình ảnh/video cho bài đăng', suggestion: 'Gợi ý cho: design, due:+1' });
         suggestions.push({ id: 'sugg-fb2', title: 'Lên lịch đăng bài và seeding ban đầu', suggestion: 'Gợi ý cho: content, due:+3' });
    }
    
    if (taskContext.name?.toLowerCase().includes('livestream')) {
         suggestions.push({ id: 'sugg-live1', title: 'Chuẩn bị minigame và quà tặng', suggestion: 'Gợi ý cho: marketing, due:+2' });
         suggestions.push({ id: 'sugg-live2', title: 'Test kỹ thuật (âm thanh, ánh sáng, kết nối)', suggestion: 'Gợi ý cho: tech, due:+3' });
    }
    
     suggestions.push({ id: 'sugg-3', title: 'Gửi nội dung/hình ảnh để duyệt', suggestion: 'Gợi ý cho: content, due:+4' });
     suggestions.push({ id: 'sugg-4', title: 'Tổng hợp và báo cáo kết quả', suggestion: 'Gợi ý cho: content, due:+7' });

    return suggestions.slice(0, 5); // Return up to 5 suggestions
};


export const generateScoring = async (taskContext: Partial<Task>): Promise<SuggestedScoring> => {
    console.log("AI is generating scoring for:", taskContext);
    await sleep(800);
    
    let points: number | null = null;
    let priority: Priority | null = null;
    let deadline: string | null = null;

    if (taskContext.channel === Channel.Facebook) {
        points = 3;
        priority = Priority.TrungBinh;
    } else if (taskContext.channel === Channel.TikTok) {
        points = 5;
        priority = Priority.Cao;
    }

    if (taskContext.name?.toLowerCase().includes('báo cáo')) {
        points = 5;
        priority = Priority.Cao;
    }
    
    if (taskContext.name?.toLowerCase().includes('khẩn') || taskContext.name?.toLowerCase().includes('gấp')) {
        priority = Priority.KhanCap;
    }
    
    if (taskContext.startDate) {
        const startDate = new Date(taskContext.startDate);
        const daysToAdd = points === 8 ? 5 : points === 5 ? 3 : 2;
        startDate.setDate(startDate.getDate() + daysToAdd);
        deadline = startDate.toISOString().split('T')[0];
    }

    return { points, priority, deadline };
};


export const generateAssigneeSuggestions = async (taskContext: Partial<Task>): Promise<SuggestedAssignee[]> => {
    console.log("AI is generating assignee suggestions for:", taskContext);
    await sleep(1000);
    
    const suggestions: SuggestedAssignee[] = [
        { name: 'Nguyễn Văn A', reason: 'Ít việc, kinh nghiệm content' },
        { name: 'Trần Thị B', reason: 'Kinh nghiệm design, đang trống 20%' },
        { name: 'Lê Văn C', reason: 'Quá tải, nhưng là expert cho project này' },
    ];

    if (taskContext.channel === Channel.Facebook) {
        return [suggestions[0], suggestions[1]];
    }
    
    if (taskContext.name?.toLowerCase().includes('design')) {
        return [suggestions[1], suggestions[0]];
    }
    
    return suggestions.slice(0, 2);
};