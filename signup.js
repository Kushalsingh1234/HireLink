// signup.js
import { auth, db } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  setPersistence,
  browserSessionPersistence
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import {
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {

  let selectedRole = "student";

  const roleStudentBtn = document.getElementById("roleStudent");
  const roleStartupBtn = document.getElementById("roleStartup");
  const startupFields = document.getElementById("startupFields");

  function setRole(role) {
    selectedRole = role;

    if (role === "startup") {
      roleStartupBtn.classList.add("active");
      roleStudentBtn.classList.remove("active");
      startupFields.classList.remove("hidden");
      return;
    }

    roleStudentBtn.classList.add("active");
    roleStartupBtn.classList.remove("active");
    startupFields.classList.add("hidden");
  }

  roleStudentBtn.addEventListener("click", () => {
    setRole("student");
  });

  roleStartupBtn.addEventListener("click", () => {
    setRole("startup");
  });

  const roleFromUrl = new URLSearchParams(window.location.search).get("role");
  if (roleFromUrl === "startup") {
    setRole("startup");
  } else {
    setRole("student");
  }

  const form = document.getElementById("signupForm");
  const fullNameInput = document.getElementById("fullName");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = fullNameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!name || !email || !password) {
      alert("Please fill all required fields");
      return;
    }

    try {
      // 1️⃣ Create auth user
      await setPersistence(auth, browserSessionPersistence);
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      // 2️⃣ Send verification email with redirect back to HireLink
      const actionCodeSettings = {
        // 🔴 IMPORTANT:
        // Use your DEPLOYED domain on Vercel / Firebase Hosting
        // For local testing, replace with http://localhost:PORT/verify-email.html
        url: "https://sparkly-semifreddo-f715b7.netlify.app/verify-email.html",
        handleCodeInApp: true
      };

      await sendEmailVerification(cred.user, actionCodeSettings);

      // 3️⃣ Create Firestore user (still unverified)
      await setDoc(doc(db, "users", cred.user.uid), {
        name,
        email,
        role: selectedRole,          // system role (student/startup)
        emailVerified: false,         // will be synced after verification
        profileCompleted: false,
        createdAt: serverTimestamp()
      });

      // 4️⃣ Redirect to waiting screen (fallback UX)
      window.location.href = "verify-email.html";

    } catch (err) {
      alert(err.message);
    }
  });

});
