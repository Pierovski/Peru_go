"use strict";

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc, updateDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCx_mw5M7SrUt4hPrF5tOJdb0W6KdKLpLY",
  authDomain: "perugo-395f5.firebaseapp.com",
  projectId: "perugo-395f5",
  storageBucket: "perugo-395f5.firebasestorage.app",
  messagingSenderId: "433194088191",
  appId: "1:433194088191:web:978608a957b7c800687eca"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export { collection, addDoc, getDocs, doc, deleteDoc, updateDoc, setDoc, signInWithEmailAndPassword, onAuthStateChanged, signOut };
