// ============================================================
//  FIREBASE CONFIG
//  Substitua os valores abaixo pelos do seu projeto Firebase
//  Console: https://console.firebase.google.com
// ============================================================
const firebaseConfig = {
  apiKey:            "AIzaSyDldCAsRyzMoZ3UJHaqpO-o_jdE_hWF5Cw",
  authDomain:        "ficha-de-treino-ba542.firebaseapp.com",
  projectId:         "ficha-de-treino-ba542",
  storageBucket:     "ficha-de-treino-ba542.firebasestorage.app",
  messagingSenderId: "1725577428",
  appId:             "1:1725577428:web:eace2780d5ce3ca669a341"
};

// Import via CDN (usado nos HTMLs com type="module")
import { initializeApp }                          from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup,
         signInWithEmailAndPassword, createUserWithEmailAndPassword,
         signOut, onAuthStateChanged, updateProfile }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, getDocs }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { auth, db, googleProvider,
         GoogleAuthProvider, signInWithPopup,
         signInWithEmailAndPassword, createUserWithEmailAndPassword,
         signOut, onAuthStateChanged, updateProfile,
         doc, setDoc, getDoc, collection, getDocs };
