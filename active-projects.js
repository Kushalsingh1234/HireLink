import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const projectsGrid = document.getElementById("projectsGrid");
const emptyProjects = document.getElementById("emptyProjects");
const totalProjectsCount = document.getElementById("totalProjectsCount");
const openProjectsCount = document.getElementById("openProjectsCount");

let currentUser = null;
let currentUserData = null;

function getOffers() {
  return JSON.parse(localStorage.getItem("offers") || "[]");
}

function saveOffers(offers) {
  localStorage.setItem("offers", JSON.stringify(offers));
}

function ensureOfferIds(offers) {
  let changed = false;
  offers.forEach((offer, idx) => {
    if (!offer.id) {
      offer.id = `legacy_offer_${idx}_${Date.now()}`;
      changed = true;
    }
    if (!Array.isArray(offer.applicants)) {
      offer.applicants = [];
      changed = true;
    }
    if (!offer.status) {
      offer.status = "open";
      changed = true;
    }
  });
  if (changed) saveOffers(offers);
  return offers;
}

function buildStartupInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("") || "HL";
}

function formatDate(value) {
  if (!value) return "Not set";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function renderProjects() {
  const offers = ensureOfferIds(getOffers()).sort((a, b) =>
    new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );

  const openOffers = offers.filter((offer) => (offer.status || "open") === "open");
  totalProjectsCount.textContent = `${offers.length} Projects`;
  openProjectsCount.textContent = `${openOffers.length} Open`;

  projectsGrid.innerHTML = "";
  emptyProjects.classList.toggle("hidden", offers.length > 0);

  offers.forEach((offer) => {
    const card = document.createElement("article");
    card.className = "project-card";

    const isOngoing = (offer.status || "open") !== "open";
    const alreadyApplied = !!offer.applicants?.find((app) => app.studentUid === currentUser?.uid);
    const canApply = currentUser && currentUserData?.role === "student" && !isOngoing;

    card.innerHTML = `
      <div class="project-head">
        <h3>${offer.projectTitle || "Untitled Project"}</h3>
        <span class="status-tag ${isOngoing ? "ongoing" : "open"}">
          ${isOngoing ? "Ongoing" : "Open"}
        </span>
      </div>

      <div class="startup-chip">
        <div class="startup-logo">${buildStartupInitials(offer.startupName)}</div>
        <div>
          <strong>${offer.startupName || "Startup"}</strong>
          <div class="muted">${offer.contactPerson || "Founder"}</div>
        </div>
      </div>

      <div class="project-meta">
        <div><strong>Skills:</strong> ${offer.skillsRequired || "Not specified"}</div>
        <div><strong>Expertise:</strong> ${offer.professionalExpertise || offer.minEducation || "Not specified"}</div>
        <div><strong>Experience:</strong> ${offer.experienceRequired || "Not specified"}</div>
        <div><strong>Budget:</strong> ₹${offer.budget || "0"}</div>
        <div><strong>Deadline:</strong> ${formatDate(offer.deadline)}</div>
        <div><strong>Applicants:</strong> ${offer.applicants?.length || 0}</div>
      </div>

      <div class="project-actions"></div>
    `;

    const actions = card.querySelector(".project-actions");

    if (!currentUser) {
      const loginBtn = document.createElement("a");
      loginBtn.href = "login.html";
      loginBtn.className = "btn ghost small";
      loginBtn.textContent = "Login to Apply";
      actions.appendChild(loginBtn);
    } else if (canApply) {
      const applyBtn = document.createElement("button");
      applyBtn.className = `btn ${alreadyApplied ? "secondary" : "primary"} small`;
      applyBtn.textContent = alreadyApplied ? "Applied" : "Apply for Project";
      applyBtn.disabled = alreadyApplied;
      applyBtn.addEventListener("click", () => applyToProject(offer.id));
      actions.appendChild(applyBtn);
    } else if (currentUserData?.role === "startup") {
      const note = document.createElement("span");
      note.className = "muted";
      note.textContent = "Startup accounts cannot apply.";
      actions.appendChild(note);
    }

    if (offer.projectDescription) {
      const desc = document.createElement("p");
      desc.className = "muted";
      desc.textContent = offer.projectDescription;
      card.appendChild(desc);
    }

    projectsGrid.appendChild(card);
  });
}

function applyToProject(projectId) {
  if (!currentUser || currentUserData?.role !== "student") return;

  const offers = getOffers();
  const idx = offers.findIndex((offer) => offer.id === projectId);
  if (idx < 0) return;

  const offer = offers[idx];
  offer.applicants = Array.isArray(offer.applicants) ? offer.applicants : [];

  const existing = offer.applicants.find((entry) => entry.studentUid === currentUser.uid);
  if (existing) return;

  offer.applicants.push({
    studentUid: currentUser.uid,
    studentName: currentUserData.name || "Student",
    studentEmail: currentUserData.email || "",
    profilePhotoURL: currentUserData.profilePhotoURL || "",
    profession: currentUserData.profession || "Student",
    experience: currentUserData.experience || "",
    skills: currentUserData.skills || [],
    appliedAt: new Date().toISOString(),
    status: "applied"
  });

  offers[idx] = offer;
  saveOffers(offers);
  renderProjects();
}

onAuthStateChanged(auth, async (user) => {
  currentUser = user || null;
  currentUserData = null;

  if (user) {
    try {
      const userSnap = await getDoc(doc(db, "users", user.uid));
      if (userSnap.exists()) {
        currentUserData = userSnap.data();
      }
    } catch (error) {
      console.error("Failed to read current user profile:", error);
    }
  }

  renderProjects();
});
