// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB-daxEcdYjNyf_9L5YGZCksoweHs2J7wo",
  authDomain: "pidelo-app-28f42.firebaseapp.com",
  projectId: "pidelo-app-28f42",
  storageBucket: "pidelo-app-28f42.firebasestorage.app",
  messagingSenderId: "1003792528558",
  appId: "1:1003792528558:web:66c9a6b0bca07e049b293f",
  measurementId: "G-Q9B4CVFYGN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

export { app, analytics, db };