import { initializeApp } from 'firebase/app';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAll1mPxxuvZpK1MG6I5FzFkWAbBK4BoXI",
  authDomain: "ardoise-8cbf6.firebaseapp.com",
  projectId: "ardoise-8cbf6",
  storageBucket: "ardoise-8cbf6.firebasestorage.app",
  messagingSenderId: "867363910750",
  appId: "1:867363910750:web:af1c942c03d8598f1c70cf"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function test() {
  try {
    await sendPasswordResetEmail(auth, "smartwork608@gmail.com");
    console.log("Email sent successfully!");
  } catch (err) {
    console.error("Error:", err);
  }
}
test();
