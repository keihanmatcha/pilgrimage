// firebase-inits.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

// 自分のFirebaseプロジェクトの設定をここに貼る
const firebaseConfig = {
  apiKey: "AIzaSyBzSgVEd3IQPSNNWY90WXaScHLBEAGTXa0",
  authDomain: "pilgrimage-e74f7.firebaseapp.com",
  projectId: "pilgrimage-e74f7",
  storageBucket: "pilgrimage-e74f7.firebasestorage.app",
  messagingSenderId: "918328739520",
  appId: "1:918328739520:web:05f5257cbe4dae35d0cf25",
  measurementId: "G-HVK14DEL1Z"
};

// Firebaseを初期化
const app = initializeApp(firebaseConfig);

// Firestoreの参照をexport（他のJSファイルから使えるようにする）
export const db = getFirestore(app);
