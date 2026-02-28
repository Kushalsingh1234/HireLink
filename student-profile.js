// student-profile.js
import { db } from "./firebase.js";
import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

/* =========================
   GET UID FROM URL
========================= */

const params = new URLSearchParams(window.location.search);
const uid = params.get("uid");

if (!uid) {
  alert("Invalid profile link.");
  throw new Error("Missing UID");
}

/* =========================
   LOAD STUDENT PROFILE
========================= */

(async function loadProfile() {
  try {
    const snap = await getDoc(doc(db, "users", uid));

    if (!snap.exists()) {
      alert("Profile not found.");
      return;
    }

    const data = snap.data();

    /* =========================
       HEADER
    ========================= */

    document.querySelector(".profile-name").textContent =
      data.name || "Student";

    document.querySelector(".profile-role").textContent =
      data.profession || "Student";

    document.querySelector(".profile-price").innerHTML =
      data.minFee
        ? `Minimum charge — <strong>₹${data.minFee}</strong>`
        : "";

    const profileImg = document.querySelector(".profile-img");
    profileImg.src =
      data.profilePhotoURL || "https://picsum.photos/300";
    profileImg.alt = data.name || "Profile photo";

    /* =========================
       ABOUT
    ========================= */

    document.querySelector(".section p.muted").textContent =
      data.about || "";

    /* =========================
       SKILLS
    ========================= */

    const skillsWrap = document.querySelector(".skill-tags");
    skillsWrap.innerHTML = "";

    (data.skills || []).forEach(skill => {
      const tag = document.createElement("span");
      tag.className = "tag";
      tag.textContent = skill;
      skillsWrap.appendChild(tag);
    });

    /* =========================
       PORTFOLIO (🔥 FIX HERE)
    ========================= */

    const gallery = document.querySelector(".portfolio-gallery");
    gallery.innerHTML = "";

    if (Array.isArray(data.portfolio) && data.portfolio.length) {

      data.portfolio.forEach(item => {
        const url = typeof item === "string" ? item : item.url;
        if (!url) return;

        const ext = url.split("?")[0].split(".").pop().toLowerCase();

        // 🖼 IMAGE
        if (["jpg","jpeg","png","gif","webp"].includes(ext)) {
          const img = document.createElement("img");
          img.src = url;
          img.alt = "Portfolio image";
          img.loading = "lazy";
          gallery.appendChild(img);
        }

        // 📄 PDF
        else if (ext === "pdf") {
          const card = document.createElement("a");
          card.href = url;
          card.target = "_blank";
          card.rel = "noopener noreferrer";
          card.className = "portfolio-pdf";
          card.textContent = "View PDF";
          gallery.appendChild(card);
        }

        // 🔗 OTHER FILES
        else {
          const link = document.createElement("a");
          link.href = url;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          link.textContent = "View file";
          gallery.appendChild(link);
        }
      });

    } else {
      gallery.innerHTML =
        "<p class='muted'>No portfolio samples uploaded.</p>";
    }

    /* =========================
       WORK LINKS
    ========================= */

    const proofList = document.querySelector(".proof-links");
    proofList.innerHTML = "";

    if (data.workLinks) {
      data.workLinks
        .split(",")
        .map(l => l.trim())
        .filter(Boolean)
        .forEach(link => {
          const li = document.createElement("li");
          const a = document.createElement("a");
          a.href = link;
          a.target = "_blank";
          a.rel = "noopener noreferrer";
          a.textContent = link;
          li.appendChild(a);
          proofList.appendChild(li);
        });
    }

  } catch (err) {
    console.error(err);
    alert("Failed to load profile.");
  }
})();
