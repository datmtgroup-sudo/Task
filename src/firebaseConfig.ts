// src/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBKSOF-1rFzebLNKs8RGnsOBsLehfyW9YY",
  authDomain: "taskmaster-mt.firebaseapp.com",
  projectId: "taskmaster-mt",
  storageBucket: "taskmaster-mt.firebasestorage.app",
  messagingSenderId: "778086513902",
  appId: "1:778086513902:web:0704b3347945302f1047ff",
  measurementId: "G-C8L19WE3M0"
};

// Khởi tạo Firebase App
const app = initializeApp(firebaseConfig);

// Khởi tạo Database và xuất ra để dùng
export const db = getFirestore(app);