import { initializeApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  getAuth,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from 'firebase/auth';
import {
  getFirestore,
  query,
  getDocs,
  collection,
  where,
  addDoc,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyAwNFKUX9V0Yvtmw_8O3TaRO6yQXOqRIcY',
  authDomain: 'remote-education-9336b.firebaseapp.com',
  projectId: 'remote-education-9336b',
  storageBucket: 'remote-education-9336b.appspot.com',
  messagingSenderId: '1087984757790',
  appId: '1:1087984757790:web:0aabc34ff23760bf76d20f',
};

const app = initializeApp(firebaseConfig);

export const firebaseAuth = getAuth(app);
