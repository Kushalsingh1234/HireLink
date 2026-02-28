import { auth, db } from "./firebase.js";
import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import {
  doc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-storage.js";

const storage = getStorage();
let currentUser = null;
let currentPortfolio = [];

function getOffers() {
  return JSON.parse(localStorage.getItem("offers") || "[]");
}

function formatDate(value) {
  if (!value) return "Not set";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  currentUser = user;

  try {
    const snap = await getDoc(doc(db, "users", user.uid));
    if (!snap.exists()) {
      window.location.href = "login.html";
      return;
    }

    const data = snap.data();
    if (!data.profileCompleted) {
      window.location.href = "student-setup.html";
      return;
    }

    document.getElementById("studentName").textContent = `Welcome, ${data.name}`;
    document.getElementById("studentRole").textContent = "Student Dashboard";

    document.getElementById("edu").textContent = data.education || "Not specified";
    document.getElementById("exp").textContent = data.experience || "Not specified";

    const viewProfileBtn = document.getElementById("viewProfileBtn");
    if (viewProfileBtn) {
      viewProfileBtn.href = `student-profile.html?uid=${user.uid}`;
    }

    renderSkills(data.skills || []);
    renderPortfolio(data.portfolio || []);
    renderWorkLinks(data.workLinks || "");
    renderProjects();

  } catch (err) {
    console.error(err);
    window.location.href = "login.html";
  }
});

function renderSkills(skills) {
  const skillsList = document.getElementById("skillsList");
  skillsList.innerHTML = "";
  skills.forEach((skill) => {
    const span = document.createElement("span");
    span.className = "skill";
    span.textContent = skill;
    skillsList.appendChild(span);
  });
}

function renderPortfolio(portfolio) {
  currentPortfolio = portfolio;
  const grid = document.getElementById("portfolioGrid");
  const empty = document.getElementById("portfolioEmpty");

  grid.innerHTML = "";
  empty.style.display = "none";

  if (!portfolio.length) {
    empty.style.display = "block";
    return;
  }

  portfolio.forEach((item, index) => {
    const url = typeof item === "string" ? item : item.url;
    const name = item.name || "Portfolio file";
    const ext = name.split(".").pop().toLowerCase();
    const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);

    const card = document.createElement("div");
    card.className = "portfolio-item";

    if (isImage) {
      const img = document.createElement("img");
      img.src = url;
      img.alt = name;
      card.appendChild(img);
    } else {
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = `View ${name}`;
      card.appendChild(a);
    }

    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.className = "btn danger small";
    delBtn.onclick = () => deletePortfolioItem(url, index);

    card.appendChild(delBtn);
    grid.appendChild(card);
  });
}

document.getElementById("addPortfolioBtn")
  ?.addEventListener("click", async () => {

  const input = document.getElementById("addPortfolioInput");
  const files = Array.from(input.files);

  if (!files.length) return;

  try {
    for (const file of files) {
      const fileRef = ref(
        storage,
        `portfolios/${currentUser.uid}/${Date.now()}_${file.name}`
      );
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);

      currentPortfolio.push({
        name: file.name,
        url
      });
    }

    await updateDoc(doc(db, "users", currentUser.uid), {
      portfolio: currentPortfolio
    });

    renderPortfolio(currentPortfolio);
    input.value = "";

  } catch (err) {
    console.error(err);
    alert("Failed to upload portfolio files.");
  }
});

async function deletePortfolioItem(url, index) {
  if (!confirm("Delete this portfolio item?")) return;

  try {
    const fileRef = ref(storage, url);
    await deleteObject(fileRef);

    currentPortfolio.splice(index, 1);

    await updateDoc(doc(db, "users", currentUser.uid), {
      portfolio: currentPortfolio
    });

    renderPortfolio(currentPortfolio);

  } catch (err) {
    console.error(err);
    alert("Failed to delete file.");
  }
}

function renderWorkLinks(workLinks) {
  const list = document.getElementById("workLinksList");
  const empty = document.getElementById("linksEmpty");
  list.innerHTML = "";
  empty.style.display = "none";

  if (!workLinks.trim()) {
    empty.style.display = "block";
    return;
  }

  workLinks
    .split(",")
    .map((l) => l.trim())
    .filter(Boolean)
    .forEach((link) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = link;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = link;
      li.appendChild(a);
      list.appendChild(li);
    });
}

function renderProjects() {
  const offers = getOffers();

  const ongoingItems = offers
    .filter((offer) => offer.acceptedStudentUid === currentUser?.uid)
    .map((offer) => ({
      id: offer.id,
      title: offer.projectTitle || "Untitled Project",
      meta: `${offer.startupName || "Startup"} • Due ${formatDate(offer.deadline)} • ₹${offer.budget || "0"}`
    }));

  const receivedItems = offers
    .filter((offer) =>
      Array.isArray(offer.applicants) &&
      offer.applicants.some((entry) =>
        entry.studentUid === currentUser?.uid && entry.status === "applied"
      )
    )
    .map((offer) => ({
      id: offer.id,
      title: offer.projectTitle || "Untitled Project",
      meta: `Applied to ${offer.startupName || "Startup"} • Awaiting decision`
    }));

  const completedItems = offers
    .filter((offer) => offer.status === "completed" && offer.acceptedStudentUid === currentUser?.uid)
    .map((offer) => ({
      id: offer.id,
      title: offer.projectTitle || "Untitled Project",
      meta: `${offer.startupName || "Startup"} • Completed`
    }));

  renderProjectList(receivedItems, "receivedProjects", "receivedEmpty", "received");
  renderProjectList(ongoingItems, "ongoingProjects", "ongoingEmpty", "ongoing");
  renderProjectList(completedItems, "completedProjects", "completedEmpty", "completed");
}

function renderProjectList(items, listId, emptyId, type) {
  const list = document.getElementById(listId);
  const empty = document.getElementById(emptyId);

  list.innerHTML = "";
  empty.style.display = "none";

  if (!items.length) {
    empty.style.display = "block";
    return;
  }

  items.forEach((item) => {
    const li = document.createElement("li");
    li.className = "project-item";

    const info = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = item.title;
    const meta = document.createElement("p");
    meta.className = "muted";
    meta.textContent = item.meta;
    info.appendChild(title);
    info.appendChild(meta);

    const actions = document.createElement("div");
    actions.className = "project-actions";

    if (type === "received") {
      const tag = document.createElement("span");
      tag.className = "project-tag";
      tag.textContent = "Awaiting";
      actions.appendChild(tag);
    } else if (type === "ongoing") {
      const tag = document.createElement("span");
      tag.className = "project-tag ongoing";
      tag.textContent = "In Progress";
      actions.appendChild(tag);
    } else {
      const tag = document.createElement("span");
      tag.className = "project-tag done";
      tag.textContent = "Done";
      actions.appendChild(tag);
    }

    li.appendChild(info);
    li.appendChild(actions);
    list.appendChild(li);
  });
}
