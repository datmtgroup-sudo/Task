// 1. SỬA ĐƯỜNG DẪN IMPORT CHO ĐÚNG
import { db } from '../firebaseConfig';
import { 
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc, getDoc, query, orderBy 
} from 'firebase/firestore';
// @ts-ignore
import { Task, ActionItem, MeetingNote, Objective, KeyResult, Rule, Sprint } from '../types';

const TASKS_COLLECTION = 'tasks';
const ACTION_ITEMS_COLLECTION = 'action_items';
const MEETING_NOTES_COLLECTION = 'meeting_notes';
const MASTER_DATA_COLLECTION = 'master_data';
// 2. GIỮ ID CŨ ĐỂ KHÔNG MẤT DỮ LIỆU NHÂN SỰ
const MASTER_DATA_DOC_ID = 'master_data'; 
const OBJECTIVES_COLLECTION = 'objectives';
const KEY_RESULTS_COLLECTION = 'key_results';
const RULES_COLLECTION = 'rules';
const SPRINTS_COLLECTION = 'sprints';

// 3. HÀM LỌC DỮ LIỆU (BẮT BUỘC PHẢI CÓ ĐỂ TRÁNH LỖI FIREBASE)
const cleanData = (data: any) => JSON.parse(JSON.stringify(data));

export const taskService = {
  // --- TASKS ---
  getAllTasks: async (): Promise<Task[]> => {
    try {
      const q = query(collection(db, TASKS_COLLECTION));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Task));
    } catch (error) {
      console.error("Error getting tasks:", error);
      return [];
    }
  },

  addTask: async (task: Omit<Task, 'id'>): Promise<Task> => {
    try {
      // Lọc sạch dữ liệu trước khi gửi
      const safeData = cleanData(task);
      const docRef = await addDoc(collection(db, TASKS_COLLECTION), safeData);
      return { id: docRef.id, ...safeData };
    } catch (error) {
      console.error("Error adding task:", error);
      throw error;
    }
  },

  updateTask: async (taskId: string, updates: Partial<Task>): Promise<void> => {
    try {
      const taskRef = doc(db, TASKS_COLLECTION, taskId);
      // Lọc sạch dữ liệu update
      await updateDoc(taskRef, cleanData(updates));
    } catch (error) {
      console.error("Error updating task:", error);
      throw error;
    }
  },

  deleteTask: async (taskId: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, TASKS_COLLECTION, taskId));
    } catch (error) {
      console.error("Error deleting task:", error);
      throw error;
    }
  },

  // --- ACTION ITEMS (Đã hỗ trợ Subtask có ngày tháng) ---
  getAllActionItems: async (): Promise<ActionItem[]> => {
    try {
        const snapshot = await getDocs(collection(db, ACTION_ITEMS_COLLECTION));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActionItem));
    } catch (error) {
        console.error("Error getting action items:", error);
        return [];
    }
  },

  addActionItem: async (item: Omit<ActionItem, 'id'>): Promise<ActionItem> => {
      try {
          const safeData = cleanData(item);
          const docRef = await addDoc(collection(db, ACTION_ITEMS_COLLECTION), safeData);
          return { id: docRef.id, ...safeData };
      } catch (error) {
          console.error("Error adding action item:", error);
          throw error;
      }
  },

  updateActionItem: async (id: string, updates: Partial<ActionItem>): Promise<void> => {
      try {
          const ref = doc(db, ACTION_ITEMS_COLLECTION, id);
          await updateDoc(ref, cleanData(updates));
      } catch (error) {
          console.error("Error updating action item:", error);
          throw error;
      }
  },

  deleteActionItem: async (id: string): Promise<void> => {
      try {
          await deleteDoc(doc(db, ACTION_ITEMS_COLLECTION, id));
      } catch (error) {
          console.error("Error deleting action item:", error);
          throw error;
      }
  },

  // --- MEETING NOTES ---
  getAllMeetingNotes: async (): Promise<MeetingNote[]> => {
      try {
          const snapshot = await getDocs(collection(db, MEETING_NOTES_COLLECTION));
          return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MeetingNote));
      } catch (error) { return []; }
  },

  // --- OBJECTIVES (OKR) ---
  getAllObjectives: async (): Promise<Objective[]> => {
    try {
      const snapshot = await getDocs(collection(db, OBJECTIVES_COLLECTION));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Objective));
    } catch (error) { return []; }
  },

  addObjective: async (objective: Omit<Objective, 'id'>): Promise<Objective> => {
    try {
      const safeData = cleanData(objective);
      const docRef = await addDoc(collection(db, OBJECTIVES_COLLECTION), safeData);
      return { id: docRef.id, ...safeData };
    } catch (error) { throw error; }
  },

  updateObjective: async (id: string, updates: Partial<Objective>): Promise<void> => {
    try {
      const ref = doc(db, OBJECTIVES_COLLECTION, id);
      await updateDoc(ref, cleanData(updates));
    } catch (error) { throw error; }
  },

  // --- KEY RESULTS (OKR) ---
  getAllKeyResults: async (): Promise<KeyResult[]> => {
    try {
      const snapshot = await getDocs(collection(db, KEY_RESULTS_COLLECTION));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as KeyResult));
    } catch (error) { return []; }
  },

  addKeyResult: async (kr: Omit<KeyResult, 'id'>): Promise<KeyResult> => {
    try {
      const safeData = cleanData(kr);
      const docRef = await addDoc(collection(db, KEY_RESULTS_COLLECTION), safeData);
      return { id: docRef.id, ...safeData };
    } catch (error) { throw error; }
  },

  updateKeyResult: async (id: string, updates: Partial<KeyResult>): Promise<void> => {
    try {
      const ref = doc(db, KEY_RESULTS_COLLECTION, id);
      await updateDoc(ref, cleanData(updates));
    } catch (error) { throw error; }
  },

  // --- AUTOMATION RULES ---
  getAllRules: async (): Promise<Rule[]> => {
    try {
      const snapshot = await getDocs(collection(db, RULES_COLLECTION));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Rule));
    } catch (error) { return []; }
  },

  saveRule: async (rule: Rule): Promise<void> => {
    try {
      const safeData = cleanData(rule);
      const ref = doc(db, RULES_COLLECTION, rule.id);
      await setDoc(ref, safeData);
    } catch (error) { throw error; }
  },

  deleteRule: async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, RULES_COLLECTION, id));
    } catch (error) { throw error; }
  },

  // --- SPRINTS ---
  getAllSprints: async (): Promise<Sprint[]> => {
    try {
        const snapshot = await getDocs(collection(db, SPRINTS_COLLECTION));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sprint));
    } catch (error) { return []; }
  },

  // --- MASTER DATA (Giữ nguyên logic cũ để không mất nhân sự) ---
  getMasterData: async (): Promise<any> => {
    try {
      // Ưu tiên ID 'master_data'
      const docRef = doc(db, MASTER_DATA_COLLECTION, MASTER_DATA_DOC_ID);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data();
      } else {
        // Fallback: Nếu không thấy, thử tìm 'general' (đề phòng)
        const backupRef = doc(db, MASTER_DATA_COLLECTION, 'general');
        const backupSnap = await getDoc(backupRef);
        if(backupSnap.exists()) return backupSnap.data();
        return {};
      }
    } catch (error) {
      console.error("Error getting master data:", error);
      return {};
    }
  },

  saveMasterData: async (data: any): Promise<void> => {
    try {
      const docRef = doc(db, MASTER_DATA_COLLECTION, MASTER_DATA_DOC_ID);
      await setDoc(docRef, data, { merge: true });
    } catch (error) {
      console.error("Error saving master data:", error);
      throw error;
    }
  }
};