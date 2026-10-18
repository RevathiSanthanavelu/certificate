/**
 * CTDSTN Certificate Verification - Public Homepage Logic
 * Handles certificate number verification and renders results.
 */

document.addEventListener("DOMContentLoaded", () => {
  try {
    initHomepage();
  } catch (e) {
    console.error("Homepage initialization failed:", e);
  }
});

function initHomepage() {
  // Record this page visit for analytics (never let analytics break the UI)
  try {
    storage.recordVisit();
  } catch (e) {
    console.warn("Analytics visit recording failed:", e);
  }

  // Mobile menu toggle
  const mobileMenuBtn = document.getElementById("mobile-menu-btn");
  const navLinks = document.getElementById("nav-links");
  if (mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener("click", () => {
      const isOpen = navLinks.classList.toggle("open");
      mobileMenuBtn.setAttribute("aria-expanded", isOpen);
    });
  }

  const form = document.getElementById("verify-form");
  const input = document.getElementById("cert-number");
  const errorSpan = document.getElementById("input-error");
  const result = document.getElementById("verify-result");
  const btn = document.getElementById("verify-btn");

  // Guard: ensure all required elements exist before attaching listeners
  if (!form || !input || !errorSpan || !result || !btn) {
    console.error("One or more verification form elements are missing from the DOM");
    return;
  }

  function showInputError(msg) {
    input.classList.add("error");
    errorSpan.textContent = msg;
    result.classList.add("hidden");
    result.innerHTML = "";
  }

  function clearInputError() {
    input.classList.remove("error");
    errorSpan.textContent = "";
  }

  function formatDate(dateStr) {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (e) {
      return dateStr;
    }
  }

  function escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function capitalize(str) {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function renderResult(cert) {
    const isActive = cert.status === "active";
    const notExpired =
      !cert.expiryDate || new Date(cert.expiryDate) >= new Date();
    const isValid = isActive && notExpired;

    const statusClass =
      cert.status === "active"
        ? "badge-active"
        : cert.status === "revoked"
          ? "badge-revoked"
          : "badge-expired";

    result.innerHTML = `
      <h3>${isValid ? "Certificate Verified &#10003;" : "Certificate Found"}</h3>
      <div class="cert-detail">
        <div class="label">Certificate Number</div>
        <div class="value">${escapeHtml(cert.certificateNumber)}</div>
        <div class="label">Holder Name</div>
        <div class="value">${escapeHtml(cert.name)}</div>
        <div class="label">Course</div>
        <div class="value">${escapeHtml(cert.course)}</div>
        <div class="label">Institution</div>
        <div class="value">${escapeHtml(cert.institution)}</div>
        <div class="label">Issue Date</div>
        <div class="value">${formatDate(cert.issueDate)}</div>
        <div class="label">Expiry Date</div>
        <div class="value">${cert.expiryDate ? formatDate(cert.expiryDate) : "N/A"}</div>
        <div class="label">Status</div>
        <div class="value"><span class="badge ${statusClass}">${capitalize(cert.status)}</span></div>
        <div class="label">Grade</div>
        <div class="value">${cert.grade || "\u2014"}</div>
      </div>
      <p style="margin-top:1rem;font-size:0.9rem;color:var(--gray-600);">
        ${isValid ? "This certificate is valid and active." : "This certificate exists but is not currently active."}
      </p>
    `;
    result.className = "result " + (isValid ? "found" : "not-found");
    result.classList.remove("hidden");
  }

  function renderNotFound() {
    result.innerHTML = `
      <h3>Certificate Not Found</h3>
      <p>No certificate matches the number you entered. Please double-check the certificate number and try again.</p>
    `;
    result.className = "result not-found";
    result.classList.remove("hidden");
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    clearInputError();

    const number = input.value.trim();
    if (!number) {
      showInputError("Please enter a certificate number.");
      input.focus();
      return;
    }

    btn.disabled = true;
    btn.textContent = "Verifying...";

    // Small delay for feedback UX
    setTimeout(() => {
      try {
        const cert = storage.findCertificate(number);
        if (cert) {
          storage.recordVerification(true);
          renderResult(cert);
        } else {
          storage.recordVerification(false);
          renderNotFound();
        }
      } catch (err) {
        showInputError("Verification failed. Please try again.");
        console.error(err);
      } finally {
        btn.disabled = false;
        btn.textContent = "Verify Certificate";
      }
    }, 350);
  });
}
