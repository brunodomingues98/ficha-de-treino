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
import { initializeApp, deleteApp }                from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup,
         signInWithEmailAndPassword, createUserWithEmailAndPassword,
         signOut, onAuthStateChanged, updateProfile,
         EmailAuthProvider, reauthenticateWithCredential, updatePassword,
         setPersistence, browserLocalPersistence, browserSessionPersistence }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, deleteDoc,
         collection, getDocs, query, where, addDoc }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// ── APP SECUNDÁRIO ───────────────────────────────────────────
// Necessário para o professor poder CRIAR contas de alunos
// sem perder a própria sessão logada (o Firebase Auth loga
// automaticamente quem acabou de ser criado na instância usada).
function getSecondaryAuth() {
  const secondaryApp = initializeApp(firebaseConfig, "Secondary-" + Date.now());
  return { secondaryApp, secondaryAuth: getAuth(secondaryApp) };
}

// Cria um aluno novo SEM deslogar o professor atual
async function createAlunoSemDeslogar(email, senha) {
  const { secondaryApp, secondaryAuth } = getSecondaryAuth();
  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, senha);
    const uid = cred.user.uid;
    await signOut(secondaryAuth);     // limpa sessão da instância secundária
    await deleteApp(secondaryApp);    // remove a instância da memória
    return uid;
  } catch (e) {
    await deleteApp(secondaryApp);
    throw e;
  }
}

export { auth, db, googleProvider,
         GoogleAuthProvider, signInWithPopup,
         signInWithEmailAndPassword, createUserWithEmailAndPassword,
         signOut, onAuthStateChanged, updateProfile,
         EmailAuthProvider, reauthenticateWithCredential, updatePassword,
         setPersistence, browserLocalPersistence, browserSessionPersistence,
         doc, setDoc, getDoc, updateDoc, deleteDoc,
         collection, getDocs, query, where, addDoc,
         createAlunoSemDeslogar };
