import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyByXKWQOELxRYCHzLcXBwNXihIgj8SZG2g",
  authDomain: "medikiosk-ocr.firebaseapp.com",
  projectId: "medikiosk-ocr",
  storageBucket: "medikiosk-ocr.firebasestorage.app",
  messagingSenderId: "381855974345",
  appId: "1:381855974345:web:0512dad47594da9f1d1e18",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);