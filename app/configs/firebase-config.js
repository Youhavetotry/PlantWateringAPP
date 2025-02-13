import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAx4DXvAsO-AlLCt-_omrw3K7z73MhqLQQ",
  authDomain: "plantwateringdbase.firebaseapp.com",
  databaseURL: "https://plantwateringdbase-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "plantwateringdbase",
  storageBucket: "plantwateringdbase.firebasestorage.app",
  messagingSenderId: "968568115349",
  appId: "1:968568115349:web:03dbf9734d8f6421c7cb9c",
  measurementId: "G-2NE9PK3QB7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export default app;