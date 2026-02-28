// login.js
import { auth, db } from "./firebase.js";
import {
  signInWithEmailAndPassword,
  setPersistence,
  browserSessionPersistence
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {

  console.log("login.js loaded");

  const form = document.getElementById("loginForm");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const msg = document.getElementById("loginMessage");

  if (!form) {
    console.error("Login form not found");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault(); // 🔥 prevent page refresh

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      msg.textContent = "Please enter email and password.";
      return;
    }

    try {
      // 1️⃣ Authenticate user
      await setPersistence(auth, browserSessionPersistence);
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;

      // 2️⃣ Fetch user profile from Firestore
      const snap = await getDoc(doc(db, "users", uid));

      if (!snap.exists()) {
        throw new Error("User profile missing in database.");
      }

      const role = snap.data().role;

      // 3️⃣ Redirect based on role
      if (role === "student") {
        window.location.href = "student-dashboard.html";
      } else if (role === "startup") {
        window.location.href = "startup-dashboard.html";
      } else {
        throw new Error("Invalid user role.");
      }

    } catch (err) {
      console.error(err);
      msg.textContent = err.message;
    }
  });

});
