// src/services/taskService.ts
import { db } from '../firebaseConfig';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
// @ts-ignore
import { Task } from '../types'; 

const COLLECTION_NAME = 'tasks';

export const taskService = {
  // 1. Lấy danh sách Task về
  getAllTasks: async (): Promise<Task[]> => {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    return querySnapshot.docs.map(doc => ({
      id: doc.id, 
      ...doc.data()
    })) as Task[];
  },

  // 2. Thêm Task mới
  addTask: async (task: any) => {
    // Xóa id giả nếu có để Firebase tự sinh ID xịn
    const { id, ...taskData } = task; 
    const docRef = await addDoc(collection(db, COLLECTION_NAME), taskData);
    return { id: docRef.id, ...taskData }; 
  },

  // 3. Cập nhật Task
  updateTask: async (id: string, updates: any) => {
    const taskRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(taskRef, updates);
  },

  // 4. Xóa Task
  deleteTask: async (id: string) => {
    const taskRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(taskRef);
  }
};