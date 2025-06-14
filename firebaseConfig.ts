// firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIza…",           // your config
  authDomain: "your-app.firebaseapp.com",
  projectId: "your-app",
  storageBucket: "your-app.appspot.com",
  messagingSenderId: "12345",
  appId: "1:12345:web:abcdef",
};

// Initialize Firebase once:
const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);