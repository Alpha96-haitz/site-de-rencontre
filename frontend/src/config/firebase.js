import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCT59goY9ft6wc4AGU9V8zLWYLsSlRJWH0",
  authDomain: "haitz-rencontre-cbd92.firebaseapp.com",
  projectId: "haitz-rencontre-cbd92",
  storageBucket: "haitz-rencontre-cbd92.firebasestorage.app",
  messagingSenderId: "983085451227",
  appId: "1:983085451227:web:2cfca9dba06d7f435c89fe"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export default app;
