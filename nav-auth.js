import { auth, db } from "./firebase.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const navCtas = document.querySelector(".nav-ctas");

if (navCtas) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      clearRoleCache();
      renderLoggedOut();
      return;
    }

    const role = await getUserRole(user.uid);
    renderLoggedIn(getDashboardHref(role));
  });
}

async function getUserRole(uid) {
  const cachedUid = sessionStorage.getItem("hirelink_uid");
  const cachedRole = sessionStorage.getItem("hirelink_role");

  if (cachedUid === uid && cachedRole) {
    return cachedRole;
  }

  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (!snap.exists()) {
      return "";
    }

    const role = snap.data().role || "";
    sessionStorage.setItem("hirelink_uid", uid);
    sessionStorage.setItem("hirelink_role", role);
    return role;
  } catch (err) {
    console.error("Failed to load user role:", err);
    return "";
  }
}

function getDashboardHref(role) {
  return role === "startup"
    ? "startup-dashboard.html"
    : "student-dashboard.html";
}

function renderLoggedOut() {
  navCtas.innerHTML = `
    <a class="btn secondary" href="login.html">Login</a>
    <a class="btn primary" href="signup.html">Sign up</a>
  `;
}

function renderLoggedIn(dashboardHref) {
  navCtas.innerHTML = `
    <a class="btn secondary" href="${dashboardHref}">Dashboard</a>
    <button id="navLogoutBtn" class="btn primary" type="button">Log out</button>
  `;

  const logoutBtn = document.getElementById("navLogoutBtn");
  logoutBtn?.addEventListener("click", async () => {
    await signOut(auth);
    clearRoleCache();
    window.location.href = "login.html";
  });
}

function clearRoleCache() {
  sessionStorage.removeItem("hirelink_uid");
  sessionStorage.removeItem("hirelink_role");
}
