// students.js
import { db } from "./firebase.js";
import {
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const grid = document.getElementById("studentsGrid");
const emptyState = document.getElementById("studentsEmpty");
const professionFilter = document.getElementById("professionFilter");
const sortFilter = document.getElementById("sortFilter");
const skillsFilter = document.getElementById("skillsFilter");
const minFeeFilter = document.getElementById("minFeeFilter");
const minRatingFilter = document.getElementById("minRatingFilter");
const clearFiltersBtn = document.getElementById("clearFiltersBtn");

let allStudents = [];

async function loadStudents() {
  try {
    const q = query(
      collection(db, "users"),
      where("role", "==", "student"),
      where("profileCompleted", "==", true)
    );

    const snap = await getDocs(q);

    if (snap.empty) {
      emptyState.style.display = "block";
      return;
    }

    allStudents = snap.docs.map(docSnap => ({
      id: docSnap.id,
      data: docSnap.data()
    }));

    populateProfessionOptions(allStudents);
    renderStudents(allStudents);

  } catch (err) {
    console.error("Failed to load students:", err);
  }
}

function renderStudents(items) {
  grid.innerHTML = "";
  emptyState.style.display = "none";

  if (!items.length) {
    emptyState.style.display = "block";
    return;
  }

  items.forEach(item => {
    grid.appendChild(createStudentCard(item.id, item.data));
  });
}

function createStudentCard(uid, data) {
  const card = document.createElement("article");
  card.className = "student-card";

  const photoTile = document.createElement("div");
  photoTile.className = "student-photo-tile";

  const img = document.createElement("img");
  img.src = data.profilePhotoURL || "https://picsum.photos/seed/avatar/300/300";
  img.alt = data.name;
  img.loading = "lazy";

  const info = document.createElement("div");
  info.className = "student-info";

  const name = document.createElement("h3");
  name.textContent = data.name;

  const role = document.createElement("p");
  role.className = "muted";
  role.textContent = data.profession || "Student";

  const skillsWrap = document.createElement("div");
  skillsWrap.className = "skill-tags";

  (data.skills || []).slice(0, 4).forEach(skill => {
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = skill;
    skillsWrap.appendChild(tag);
  });

  const meta = document.createElement("p");
  meta.className = "meta";
  const minFee = data.minFee ?? "—";
  const projects = data.projectsCompleted ?? 0;
  const rating = data.rating ?? data.avgRating ?? 0;
  meta.innerHTML = `
    <strong>Min Fee:</strong> ₹${minFee} &nbsp; • &nbsp;
    <strong>Projects:</strong> ${projects} &nbsp; • &nbsp;
    ⭐ ${Number(rating).toFixed(1)}
  `;

  const btn = document.createElement("a");
  btn.href = `student-profile.html?uid=${uid}`;
  btn.className = "btn ghost small";
  btn.textContent = "View Profile";

  info.appendChild(name);
  info.appendChild(role);
  info.appendChild(skillsWrap);
  info.appendChild(meta);
  info.appendChild(btn);

  photoTile.appendChild(img);
  card.appendChild(photoTile);
  card.appendChild(info);

  return card;
}

function populateProfessionOptions(items) {
  const professions = new Set();
  items.forEach(item => {
    if (item.data.profession) {
      professions.add(item.data.profession.trim());
    }
  });

  Array.from(professions)
    .sort((a, b) => a.localeCompare(b))
    .forEach(profession => {
      const opt = document.createElement("option");
      opt.value = profession.toLowerCase();
      opt.textContent = profession;
      professionFilter.appendChild(opt);
    });
}

function applyFilters() {
  const professionValue = professionFilter.value;
  const sortValue = sortFilter.value;
  const skillsValue = skillsFilter.value.trim().toLowerCase();
  const minFeeValue = parseFloat(minFeeFilter.value || "0");
  const minRatingValue = parseFloat(minRatingFilter.value || "0");

  const requestedSkills = skillsValue
    ? skillsValue.split(",").map(s => s.trim()).filter(Boolean)
    : [];

  const filtered = allStudents.filter(({ data }) => {
    const profession = (data.profession || "Student").toLowerCase();
    if (professionValue !== "all" && profession !== professionValue) {
      return false;
    }

    const studentSkills = (data.skills || []).map(s => s.toLowerCase());
    if (requestedSkills.length) {
      const hasAll = requestedSkills.every(skill =>
        studentSkills.some(s => s.includes(skill))
      );
      if (!hasAll) return false;
    }

    const fee = Number(data.minFee || 0);
    if (fee < minFeeValue) return false;

    const rating = Number(data.rating ?? data.avgRating ?? 0);
    if (rating < minRatingValue) return false;

    return true;
  });

  renderStudents(sortStudents(filtered, sortValue));
}

function clearFilters() {
  professionFilter.value = "all";
  sortFilter.value = "rating_desc";
  skillsFilter.value = "";
  minFeeFilter.value = "";
  minRatingFilter.value = "";
  renderStudents(allStudents);
}

function sortStudents(items, sortValue) {
  const sorted = [...items];
  sorted.sort((a, b) => {
    const aFee = Number(a.data.minFee || 0);
    const bFee = Number(b.data.minFee || 0);
    const aRating = Number(a.data.rating ?? a.data.avgRating ?? 0);
    const bRating = Number(b.data.rating ?? b.data.avgRating ?? 0);

    switch (sortValue) {
      case "rating_asc":
        return aRating - bRating;
      case "fee_asc":
        return aFee - bFee;
      case "fee_desc":
        return bFee - aFee;
      default:
        return bRating - aRating;
    }
  });
  return sorted;
}

professionFilter.addEventListener("change", applyFilters);
sortFilter.addEventListener("change", applyFilters);
skillsFilter.addEventListener("input", applyFilters);
minFeeFilter.addEventListener("input", applyFilters);
minRatingFilter.addEventListener("input", applyFilters);
clearFiltersBtn.addEventListener("click", clearFilters);

loadStudents();
