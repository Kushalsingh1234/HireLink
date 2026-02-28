// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "can't be displayed in public",
  authDomain: "can't be displayed in public",
  projectId: "can't be displayed in public",
  storageBucket: "can't be displayed in public",
  messagingSenderId: "can't be displayed in public",
  appId: "can't be displayed in public"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);

