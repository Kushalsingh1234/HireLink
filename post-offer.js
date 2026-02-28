import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const form = document.getElementById("offerForm");
const success = document.getElementById("successMessage");

let currentUser = null;
let currentUserData = null;

function getOffers() {
  return JSON.parse(localStorage.getItem("offers") || "[]");
}

function saveOffers(offers) {
  localStorage.setItem("offers", JSON.stringify(offers));
}

onAuthStateChanged(auth, async (user) => {
  currentUser = user || null;
  currentUserData = null;

  if (!user) return;

  try {
    const snap = await getDoc(doc(db, "users", user.uid));
    if (snap.exists()) {
      currentUserData = snap.data();
    }
  } catch (error) {
    console.error("Failed to load user details for project posting:", error);
  }
});

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const startupNameInput = document.getElementById("startupName").value.trim();
  const contactPersonInput = document.getElementById("contactPerson").value.trim();

  const projectData = {
    id: `offer_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    postedByUid: currentUser?.uid || null,
    startupName: startupNameInput || currentUserData?.name || "Startup",
    startupLogoURL: document.getElementById("startupLogoURL").value.trim(),
    contactPerson: contactPersonInput || currentUserData?.name || "Founder",
    startupAbout: document.getElementById("startupAbout").value.trim(),
    projectTitle: document.getElementById("projectTitle").value.trim(),
    projectDescription: document.getElementById("projectDescription").value.trim(),
    skillsRequired: document.getElementById("skillsRequired").value,
    minEducation: document.getElementById("minEducation").value,
    professionalExpertise: document.getElementById("professionalExpertise").value.trim(),
    experienceRequired: document.getElementById("experienceRequired").value.trim(),
    budget: document.getElementById("budget").value,
    deadline: document.getElementById("deadline").value,
    deliverables: document.getElementById("deliverables").value.trim(),
    referenceLink: document.getElementById("referenceLink").value.trim(),
    createdAt: new Date().toISOString(),
    status: "open",
    applicants: [],
    acceptedStudentUid: null
  };

  const offers = getOffers();
  offers.push(projectData);
  saveOffers(offers);

  form.classList.add("hidden");
  success.classList.remove("hidden");
});
