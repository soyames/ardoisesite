import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getFunctions } from 'firebase/functions'

const firebaseConfig = {
  apiKey: "AIzaSyAll1mPxxuvZpK1MG6I5FzFkWAbBK4BoXI",
  authDomain: "ardoise-8cbf6.firebaseapp.com",
  projectId: "ardoise-8cbf6",
  storageBucket: "ardoise-8cbf6.firebasestorage.app",
  messagingSenderId: "867363910750",
  appId: "1:867363910750:web:af1c942c03d8598f1c70cf"
};

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export const functions = getFunctions(app)
