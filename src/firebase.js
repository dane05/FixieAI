import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCO2vyNj3y_g3V4u0SuwWGfNWm6MuzFUs8",
  authDomain: "fixieaibot.firebaseapp.com",
  projectId: "fixieaibot",
  storageBucket: "fixieaibot.firebasestorage.app",
  messagingSenderId: "53852730024",
  appId: "1:53852730024:web:431b57703f48d87be0089d"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
