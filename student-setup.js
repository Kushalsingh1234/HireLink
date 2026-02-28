// student-setup.js
import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from
  "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import {
  doc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-storage.js";

/* =========================
   AUTH CHECK
========================= */

let currentUser = null;

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  currentUser = user;
});

/* =========================
   SKILLS SYSTEM
========================= */

const skillInput = document.getElementById("skillInput");
const skillsBox = document.getElementById("skillsBox");
let skills = [];

skillInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    const skill = skillInput.value.trim();
    if (skill && !skills.includes(skill)) {
      skills.push(skill);
      addSkillTag(skill);
      skillInput.value = "";
    }
  }
});

function addSkillTag(skill) {
  const tag = document.createElement("div");
  tag.className = "skill-tag";
  tag.textContent = skill;
  tag.onclick = () => {
    skills = skills.filter(s => s !== skill);
    tag.remove();
  };
  skillsBox.appendChild(tag);
}

/* =========================
   FORM SUBMIT
========================= */

const form = document.getElementById("setupForm");
const storage = getStorage();

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!currentUser) {
    alert("Authentication error. Please log in again.");
    return;
  }

  try {
    /* ---------- PROFILE PHOTO ---------- */
    let profilePhotoURL = null;
    const profilePhotoFile = document.getElementById("profilePhoto").files[0];

    if (profilePhotoFile) {
      const photoRef = ref(
        storage,
        `profilePhotos/${currentUser.uid}/${Date.now()}_${profilePhotoFile.name}`
      );
      await uploadBytes(photoRef, profilePhotoFile);
      profilePhotoURL = await getDownloadURL(photoRef);
    }

    /* ---------- PORTFOLIO FILES ---------- */
    const portfolioInput = document.getElementById("portfolioUpload");
    const portfolioFiles = Array.from(portfolioInput.files);
    const portfolio = [];

    for (const file of portfolioFiles) {
      const fileRef = ref(
        storage,
        `portfolios/${currentUser.uid}/${Date.now()}_${file.name}`
      );
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);

      portfolio.push({
        name: file.name,
        url
      });
    }

    /* ---------- SAVE TO FIRESTORE ---------- */
    const studentData = {
      education: document.getElementById("education").value.trim(),
      profession: document.getElementById("role").value.trim(),
      experience: document.getElementById("experience").value.trim(),
      about: document.getElementById("about").value.trim(),
      skills,
      workLinks: document.getElementById("workLinks").value.trim(),
      minFee: Number(document.getElementById("minFee").value) || null,
      onsiteAvailable: document.getElementById("onsiteAvailable").checked,
      profilePhotoURL,
      portfolio,
      profileCompleted: true,
      updatedAt: serverTimestamp()
    };

    await updateDoc(doc(db, "users", currentUser.uid), studentData);

    window.location.href = "student-dashboard.html";

  } catch (err) {
    console.error(err);
    alert("Failed to save profile. Please try again.");
  }
});
