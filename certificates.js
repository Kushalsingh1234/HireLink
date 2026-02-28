// certificates.js — simple mock verification

const verifyBtn = document.getElementById("verifyBtn");
const verifyInput = document.getElementById("verifyInput");
const verifyMessage = document.getElementById("verifyMessage");

verifyBtn.addEventListener("click", () => {
  const id = verifyInput.value.trim();

  if (!id) {
    verifyMessage.textContent = "Please enter a certificate ID.";
    return;
  }

  // Mock check: accept one known ID
  if (id === "HL-CERT-00124") {
    verifyMessage.textContent = "✔ Certificate is valid.";
    verifyMessage.style.color = "#0ea5a4";
  } else {
    verifyMessage.textContent = "✖ Certificate not found.";
    verifyMessage.style.color = "#ff6b6b";
  }
});
