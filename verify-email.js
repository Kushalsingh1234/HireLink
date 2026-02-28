// verify-email.js
import { auth } from "./firebase.js";
import { onAuthStateChanged } from
  "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

const message = document.getElementById("message");

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    message.textContent = "Please log in to continue.";
    return;
  }

  if (user.emailVerified) {
    // Let auth-guard handle role-based redirect
    window.location.href = "login.html";
  } else {
    message.textContent =
      "Please verify your email using the link we sent you.";
  }
});
