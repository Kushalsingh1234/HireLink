import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const listEl = document.getElementById("projectsList");
const noProjects = document.getElementById("noProjects");

const totalProjectsEl = document.getElementById("totalProjects");
const activeProjectsEl = document.getElementById("activeProjects");
const completedProjectsEl = document.getElementById("completedProjects");

let currentUser = null;
let currentUserData = null;

function getOffers() {
  return JSON.parse(localStorage.getItem("offers") || "[]");
}

function saveOffers(offers) {
  localStorage.setItem("offers", JSON.stringify(offers));
}

function formatDate(value) {
  if (!value) return "Not set";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
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

function loadProjects() {
  const allOffers = ensureOfferIds(getOffers());

  const userOffers = allOffers.filter((offer) => {
    if (offer.postedByUid) {
      return offer.postedByUid === currentUser.uid;
    }
    return true;
  });

  const active = userOffers.filter((offer) => (offer.status || "open") === "open").length;
  const completed = userOffers.filter((offer) => offer.status === "completed").length;

  totalProjectsEl.textContent = userOffers.length;
  activeProjectsEl.textContent = active;
  completedProjectsEl.textContent = completed;

  listEl.innerHTML = "";
  noProjects.classList.toggle("hidden", userOffers.length > 0);
  if (!userOffers.length) return;

  userOffers
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .forEach((project) => {
      const card = document.createElement("div");
      card.className = "project-card";

      const statusLabel = project.status === "ongoing"
        ? "Ongoing"
        : project.status === "completed"
          ? "Completed"
          : "Pending Applications";

      card.innerHTML = `
        <div class="project-top">
          <div class="project-title">${project.projectTitle || "Untitled Project"}</div>
          <span class="status-tag">${statusLabel}</span>
        </div>

        <div class="project-meta">
          <div><strong>Budget:</strong> ₹${project.budget || "0"}</div>
          <div><strong>Deadline:</strong> ${formatDate(project.deadline)}</div>
          <div><strong>Skills:</strong> ${project.skillsRequired || "Not specified"}</div>
          <div><strong>Education:</strong> ${project.minEducation || "No minimum"}</div>
          <div><strong>Applicants:</strong> ${project.applicants?.length || 0}</div>
        </div>

        <div class="project-actions">
          <button class="btn ghost small view-applicants-btn" data-project-id="${project.id}">
            View Applicants
          </button>
          <a href="active-projects.html" class="btn ghost small">Open Active Projects</a>
        </div>

        <div class="applicants-wrap hidden" id="applicants_${project.id}"></div>
      `;

      listEl.appendChild(card);
    });

  bindViewApplicants();
}

function bindViewApplicants() {
  const buttons = document.querySelectorAll(".view-applicants-btn");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const projectId = btn.dataset.projectId;
      const wrap = document.getElementById(`applicants_${projectId}`);
      if (!wrap) return;

      const isHidden = wrap.classList.contains("hidden");
      if (!isHidden) {
        wrap.classList.add("hidden");
        wrap.innerHTML = "";
        return;
      }
      renderApplicants(projectId, wrap);
    });
  });
}

function renderApplicants(projectId, container) {
  const offers = getOffers();
  const project = offers.find((offer) => offer.id === projectId);
  if (!project) return;

  const applicants = Array.isArray(project.applicants) ? project.applicants : [];
  container.classList.remove("hidden");

  if (!applicants.length) {
    container.innerHTML = `<p class="muted" style="margin-top:12px;">No students have applied yet.</p>`;
    return;
  }

  container.innerHTML = applicants.map((applicant) => {
    const skillsText = Array.isArray(applicant.skills) ? applicant.skills.slice(0, 4).join(", ") : "";
    const appStatus = applicant.status || "applied";

    return `
      <div class="applicant-card" style="margin-top:12px; padding:12px; border-radius:12px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.08);">
        <div style="display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap;">
          <div>
            <strong>${applicant.studentName || "Student"}</strong>
            <p class="muted" style="margin:4px 0;">${applicant.profession || "Student"} ${applicant.experience ? `• ${applicant.experience}` : ""}</p>
            <p class="muted" style="margin:4px 0;">${applicant.studentEmail || ""}</p>
            <p class="muted" style="margin:4px 0;">${skillsText || "No skills added"}</p>
          </div>
          <span class="project-tag ${appStatus === "accepted" ? "done" : appStatus === "rejected" ? "" : "ongoing"}">
            ${appStatus.toUpperCase()}
          </span>
        </div>
        <div style="margin-top:10px; display:flex; gap:8px; flex-wrap:wrap;">
          <a href="student-profile.html?uid=${applicant.studentUid}" class="btn ghost small">View Profile</a>
          <button
            class="btn primary small accept-btn"
            data-project-id="${projectId}"
            data-student-uid="${applicant.studentUid}"
            ${project.status === "ongoing" || appStatus === "accepted" ? "disabled" : ""}
          >
            ${appStatus === "accepted" ? "Accepted" : "Accept Application"}
          </button>
        </div>
      </div>
    `;
  }).join("");

  const acceptButtons = container.querySelectorAll(".accept-btn");
  acceptButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const selectedProjectId = button.dataset.projectId;
      const selectedStudentUid = button.dataset.studentUid;
      acceptApplication(selectedProjectId, selectedStudentUid);
      renderApplicants(selectedProjectId, container);
      loadProjects();
    });
  });
}

function acceptApplication(projectId, studentUid) {
  const offers = getOffers();
  const idx = offers.findIndex((offer) => offer.id === projectId);
  if (idx < 0) return;

  const project = offers[idx];
  project.status = "ongoing";
  project.acceptedStudentUid = studentUid;
  project.acceptedAt = new Date().toISOString();

  project.applicants = (project.applicants || []).map((applicant) => ({
    ...applicant,
    status: applicant.studentUid === studentUid ? "accepted" : (applicant.status === "accepted" ? "rejected" : applicant.status || "applied")
  }));

  offers[idx] = project;
  saveOffers(offers);
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  currentUser = user;

  try {
    const snap = await getDoc(doc(db, "users", user.uid));
    if (snap.exists()) {
      currentUserData = snap.data();
      if (currentUserData.role && currentUserData.role !== "startup") {
        window.location.href = "student-dashboard.html";
        return;
      }
    }
  } catch (error) {
    console.error("Failed to validate startup user:", error);
  }

  loadProjects();
});
