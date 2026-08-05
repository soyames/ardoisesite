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

async function createDeveloper() {
  const email = 'dev.test@ardoiseeduc.com';
  const password = 'password123';
  
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log(`Auth user created: ${user.uid}`);

    // Create the users document
    await setDoc(doc(db, 'users', user.uid), {
      email,
      firstName: 'Mock',
      lastName: 'Developer',
      phone: '+22990000000',
      role: 'developer',
      country: 'Bénin',
      city: 'Cotonou',
      createdAt: new Date().toISOString()
    });
    console.log('User document created.');

    // We can also pre-populate the certifiedPartners document if we want to skip the form
    await setDoc(doc(db, 'certifiedPartners', user.uid), {
      publicName: 'Ardoise Dev Agency',
      bio: 'We build integrations for Ardoise.',
      specialties: ['API', 'React', 'Integration'],
      country: 'Bénin',
      contactEmail: email,
      contactPhone: '+22990000000',
      status: 'pending',
      appliedAt: new Date().toISOString()
    });
    console.log('Certified partner profile created.');

    console.log('\n--- SUCCESS ---');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    process.exit(0);
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
       console.log('Account already exists! You can log in with:');
       console.log(`Email: ${email}`);
       console.log(`Password: ${password}`);
       process.exit(0);
    }
    console.error('Error creating user:', error);
    process.exit(1);
  }
}

createDeveloper();
