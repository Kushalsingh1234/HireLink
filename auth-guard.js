// auth-guard.js
import { auth, db } from "./firebase.js";
import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import {
  doc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  // 🚨 Block access if email not verified
  if (!user.emailVerified) {
    window.location.href = "verify-email.html";
    return;
  }

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    window.location.href = "login.html";
    return;
  }

  // Sync verification status to Firestore (one-time)
  if (!snap.data().emailVerified) {
    await updateDoc(ref, { emailVerified: true });
  }

  const role = snap.data().role;
  const path = window.location.pathname;

  if (path.includes("student-dashboard") && role !== "student") {
    window.location.href = "startup-dashboard.html";
  }

  if (path.includes("startup-dashboard") && role !== "startup") {
    window.location.href = "student-dashboard.html";
  }

  if (path.includes("post-offer") && role !== "startup") {
    window.location.href = "student-dashboard.html";
  }
});
