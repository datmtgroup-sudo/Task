import { db } from '../firebaseConfig';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  getDoc,
  setDoc
} from 'firebase/firestore';
// @ts-ignore
import { Task } from '../types'; 

const COLLECTION_NAME = 'tasks';
const SETTINGS_COLLECTION = 'settings';
const MASTER_DATA_DOC_ID = 'master_data'; 

// --- HÀM QUAN TRỌNG: Lọc sạch dữ liệu rác (undefined) ---
const cleanData = (data: any) => {
  return JSON.parse(JSON.stringify(data));
};

export const taskService = {
  // --- PHẦN 1: XỬ LÝ TASK ---
  getAllTasks: async (): Promise<Task[]> => {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    return querySnapshot.docs.map(doc => ({
      id: doc.id, 
      ...doc.data()
    })) as Task[];
  },

  addTask: async (task: any) => {
    const { id, ...taskData } = task; 
    // Lọc sạch trước khi gửi
    const safeData = cleanData(taskData);
    const docRef = await addDoc(collection(db, COLLECTION_NAME), safeData);
    return { id: docRef.id, ...safeData }; 
  },

  updateTask: async (id: string, updates: any) => {
    const taskRef = doc(db, COLLECTION_NAME, id);
    // Lọc sạch trước khi gửi
    const safeUpdates = cleanData(updates);
    await updateDoc(taskRef, safeUpdates);
  },

  deleteTask: async (id: string) => {
    const taskRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(taskRef);
  },

  // --- PHẦN 2: XỬ LÝ DỮ LIỆU GỐC (Cái bạn đang thiếu) ---
  
  // Lấy dữ liệu gốc về
  getMasterData: async () => {
    try {
      const docRef = doc(db, SETTINGS_COLLECTION, MASTER_DATA_DOC_ID);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data();
      } else {
        return null; 
      }
    } catch (error) {
      console.error("Lỗi lấy Master Data:", error);
      return null;
    }
  },

  // Lưu dữ liệu gốc lên Firebase
  saveMasterData: async (data: { assignees?: string[], projects?: string[], periods?: string[] }) => {
    try {
      const docRef = doc(db, SETTINGS_COLLECTION, MASTER_DATA_DOC_ID);
      await setDoc(docRef, data, { merge: true });
      console.log("Đã lưu Master Data thành công!");
    } catch (error) {
      console.error("Lỗi lưu Master Data:", error);
    }
  }
};