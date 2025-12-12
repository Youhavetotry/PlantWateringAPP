import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import Constants from "expo-constants";

// 從 app.json 的 extra 中讀取 Firebase 配置
const firebaseConfig = Constants.expoConfig?.extra?.firebase;

if (!firebaseConfig) {
  throw new Error("Firebase 配置未找到！請檢查 app.json 中的 extra.firebase 設置");
}

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database, app };
export default { database, app };