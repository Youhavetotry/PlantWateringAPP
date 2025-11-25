import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import Constants from "expo-constants";

// 從 app.json 注入的正式環境（EAS Build 時會自動帶入）
// 若找不到（本地開發）就 fallback 到下面寫死的設定
const firebaseConfig =
  Constants.expoConfig?.extra?.firebase || {
    apiKey: "AIzaSyAx4DXvAsO-AlLCt-_omrw3K7z73MhqLQQ",
    authDomain: "plantwateringdbase.firebaseapp.com",
    databaseURL:
      "https://plantwateringdbase-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "plantwateringdbase",
    storageBucket: "plantwateringdbase.appspot.com",
    messagingSenderId: "968568115349",
    appId: "1:968568115349:web:03dbf9734d8f6421c7cb9c",
    measurementId: "G-2NE9PK3QB7",
  };

// 初始化 Firebase（不管本地還是打包後都一定會成功）
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { app, database };