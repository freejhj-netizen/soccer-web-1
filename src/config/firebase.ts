import { initializeApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import type { Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import type { FirebaseStorage } from 'firebase/storage';

// 환경 변수에서 Firebase 설정 가져오기
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "YOUR_AUTH_DOMAIN",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "YOUR_STORAGE_BUCKET",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID"
};

// Firebase 설정이 완료되지 않은 경우를 위한 더미 값
const isFirebaseConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY" && 
                              firebaseConfig.projectId !== "YOUR_PROJECT_ID";

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

try {
  if (isFirebaseConfigured) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    console.log('✅ Firebase 초기화 완료');
    console.log('📦 Project ID:', firebaseConfig.projectId);
    console.log('🔐 Auth Domain:', firebaseConfig.authDomain);
    console.log('💾 Storage Bucket:', firebaseConfig.storageBucket);
  } else {
    console.warn('⚠️ Firebase 설정이 완료되지 않았습니다. UI는 확인할 수 있지만 기능은 작동하지 않습니다.');
    console.warn('Firebase 설정을 완료하려면 .env 파일에 Firebase 설정값을 입력하세요.');
  }
} catch (error) {
  console.error('❌ Firebase 초기화 오류:', error);
}

export { auth, db, storage };
export default app;

