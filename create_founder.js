import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

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
const db = getFirestore(app);

async function createFounder() {
  try {
    const cred = await createUserWithEmailAndPassword(auth, 'founder_qa@ardoise.com', 'TestQA2026!');
    console.log("Created user in Firebase Auth:", cred.user.uid);
    
    await setDoc(doc(db, 'users', cred.user.uid), {
      role: 'founder',
      schoolId: '1',
      firstName: 'Founder',
      lastName: 'QA',
      email: 'founder_qa@ardoise.com',
      createdAt: new Date()
    });
    console.log("Created user in Firestore");
    process.exit(0);
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      console.log("User already exists. Updating Firestore just in case...");
      // Try to sign in and update
      // Actually we just need to update Firestore, but we need the UID
      // We can't get UID if we don't sign in
      import('firebase/auth').then(({ signInWithEmailAndPassword }) => {
          signInWithEmailAndPassword(auth, 'founder_qa@ardoise.com', 'TestQA2026!')
            .then(c => {
                setDoc(doc(db, 'users', c.user.uid), {
                    role: 'founder',
                    schoolId: '1',
                    firstName: 'Founder',
                    lastName: 'QA',
                    email: 'founder_qa@ardoise.com'
                }, { merge: true }).then(() => {
                    console.log("Updated existing founder in Firestore");
                    process.exit(0);
                });
            }).catch(e => {
                console.error("Could not sign in existing user:", e);
                process.exit(1);
            });
      });
    } else {
      console.error(err);
      process.exit(1);
    }
  }
}

createFounder();
