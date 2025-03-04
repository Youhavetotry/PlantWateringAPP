import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Firebase 設定
const firebaseConfig = {
  apiKey: "AIzaSyAx4DXvAsO-AlLCt-_omrw3K7z73MhqLQQ",
  authDomain: "plantwateringdbase.firebaseapp.com",
  databaseURL: "https://plantwateringdbase-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "plantwateringdbase",
  storageBucket: "plantwateringdbase.appspot.com",  // 修正錯誤的 storageBucket
  messagingSenderId: "968568115349",
  appId: "1:968568115349:web:03dbf9734d8f6421c7cb9c",
  measurementId: "G-2NE9PK3QB7"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);

// 初始化 Realtime Database
const database = getDatabase(app);

export { app, database };
