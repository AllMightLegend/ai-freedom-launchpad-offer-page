const WEBINAR_CONFIG = window.WEBINAR_CONFIG || {};

// Compatibility shim for environments that call mgt.clearMarks().
const rootScope = typeof globalThis !== "undefined" ? globalThis : window;
const mgtRef = rootScope.mgt || {};
if (typeof mgtRef.clearMarks !== "function") {
  mgtRef.clearMarks = () => {};
}
rootScope.mgt = mgtRef;
if (typeof window !== "undefined") {
  window.mgt = mgtRef;
}
if (typeof self !== "undefined") {
  self.mgt = mgtRef;
}

const DEFAULT_GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxBOeVVPIhq31My66TFqT_wqpAOiFsHXCRQcA2VVKv56i4xZ75ZV2wLOP79LkJejA5CzA/exec";
const DEFAULT_THANK_YOU_URL = "https://lp.avikdas10x.com/thank-you";
const DEFAULT_OFFER_DURATION_SECONDS = 14 * 60 + 20;

const DEFAULT_VIP_BENEFITS = [
  {
    id: "vip-days",
    title: "2 Special VIP Days",
    description: "Get 2 VIP-only sessions with direct strategy breakdowns and deeper playbooks.",
    image: "https://images.unsplash.com/photo-1556742031-c6961e8560b0?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "recordings",
    title: "Lifetime Recordings",
    description: "Rewatch all premium sessions anytime and turn notes into repeatable systems.",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "zoom-room",
    title: "Zoom Room Access",
    description: "Join private Zoom rooms for live Q&A and implementation guidance.",
    image: "https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "strategy-session",
    title: "1-on-1 Strategy Session",
    description: "Get tactical feedback tailored to your business and current growth stage.",
    image: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "ai-playbooks",
    title: "AI Playbook Bundle",
    description: "Ready-to-use AI workflows and templates to execute faster after the summit.",
    image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=900&q=80"
  }
];

// Add your real Razorpay payment links for each offer-state key.
const DEFAULT_RAZORPAY_LINKS = {
  "vip-bundle": "https://rzp.io/rzp/6wOpB3g"
};

const GOOGLE_SCRIPT_URL = WEBINAR_CONFIG.googleScriptUrl || DEFAULT_GOOGLE_SCRIPT_URL;
const THANK_YOU_URL = WEBINAR_CONFIG.thankYouUrl || DEFAULT_THANK_YOU_URL;
const RAZORPAY_LINKS = {
  ...DEFAULT_RAZORPAY_LINKS,
  ...(WEBINAR_CONFIG.razorpayLinks || {})
};
const VIP_BENEFITS = WEBINAR_CONFIG.vipBenefits || DEFAULT_VIP_BENEFITS;
const OFFER_DURATION_SECONDS = Number(WEBINAR_CONFIG.offerDurationSeconds || DEFAULT_OFFER_DURATION_SECONDS);

const totalAmountEl = document.getElementById("totalAmount");
const primaryCta = document.getElementById("primaryCta");
const offerTimer = document.getElementById("offerTimer");
const vipBenefitsGrid = document.getElementById("vipBenefits");
const formModal = document.getElementById("formModal");
const closeButtons = [...document.querySelectorAll(".close-icon")];
const leadForm = document.getElementById("leadForm");
const formStatus = document.getElementById("formStatus");
const formSubmitButton = document.getElementById("formSubmitButton");
const offerCard = document.querySelector(".offer-card");

function isPlaceholderValue(value) {
  return !value || /placeholder|PASTE_YOUR|example\.com/i.test(value);
}

function formatDuration(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function startOfferTimer() {
  if (!offerTimer || !Number.isFinite(OFFER_DURATION_SECONDS) || OFFER_DURATION_SECONDS <= 0) {
    return;
  }

  let remaining = OFFER_DURATION_SECONDS;
  offerTimer.textContent = formatDuration(remaining);

  const timerId = window.setInterval(() => {
    remaining -= 1;
    if (remaining <= 0) {
      offerTimer.textContent = "00:00";
      window.clearInterval(timerId);
      return;
    }
    offerTimer.textContent = formatDuration(remaining);
  }, 1000);
}

function renderVipBenefits() {
  if (!vipBenefitsGrid) {
    return;
  }

  vipBenefitsGrid.innerHTML = VIP_BENEFITS.map((benefit) => {
    const id = String(benefit.id || "").trim();
    const title = String(benefit.title || "VIP Benefit");
    const description = String(benefit.description || "");
    const image = String(benefit.image || "");

    if (!id) {
      return "";
    }

    return `
      <label class="benefit-card" data-benefit-card="${id}">
        <img src="${image}" alt="${title}" loading="lazy" />
        <div class="benefit-copy">
          <h3>${title}</h3>
          <p>${description}</p>
        </div>
      </label>
    `;
  }).join("");
}

function getBumpInputs() {
  return [...document.querySelectorAll(".bump-offer")];
}

function syncSelectedBenefitStyles() {
  const bundleSelected = getBumpInputs().some((input) => input.checked);
  document.querySelectorAll(".benefit-card").forEach((card) => {
    card.classList.toggle("selected", bundleSelected);
  });
}

function getSelectedOffers() {
  return getBumpInputs()
    .filter((input) => input.checked)
    .map((input) => ({
      id: input.dataset.id,
      price: Number(input.dataset.price || 0)
    }));
}

function getOfferStateKey(offers) {
  return offers
    .map((offer) => offer.id)
    .sort((a, b) => a.localeCompare(b))
    .join("+");
}

function updateSummary() {
  const offers = getSelectedOffers();
  const total = offers.reduce((sum, offer) => sum + offer.price, 0);

  totalAmountEl.textContent = `₹${total}`;
  syncSelectedBenefitStyles();

  if (total === 0) {
    primaryCta.textContent = "Join now ▶";
    primaryCta.dataset.mode = "free";
  } else {
    primaryCta.textContent = `Pay ₹${total} now ▶`;
    primaryCta.dataset.mode = "paid";
  }
}

function syncOfferStateAfterRestore() {
  // Browsers can restore checkbox state from bfcache after navigation.
  // Recompute total/CTA so UI matches the restored bundle selection.
  window.requestAnimationFrame(updateSummary);
}

function openModal() {
  formModal.classList.remove("hidden");
  formModal.setAttribute("aria-hidden", "false");
}

function closeModal() {
  formModal.classList.add("hidden");
  formModal.setAttribute("aria-hidden", "true");
}

function closeOfferCard() {
  if (offerCard) {
    offerCard.classList.add("dismissed");
  }
}

function collectFormPayload() {
  const formData = new FormData(leadForm);

  return {
    timestamp: new Date().toISOString(),
    firstName: String(formData.get("firstName") || "").trim(),
    lastName: String(formData.get("lastName") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    countryCode: String(formData.get("countryCode") || "+91").trim(),
    phone: String(formData.get("phone") || "").trim(),
    selectedOfferState: "free-masterclass",
    selectedOffers: "None",
    totalAmount: 0
  };
}

function validateForm(payload) {
  if (!payload.firstName || !payload.lastName || !payload.email || !payload.phone) {
    return "Please fill all required fields.";
  }

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email);
  if (!emailOk) {
    return "Please enter a valid email address.";
  }

  const phoneOk = /^[0-9]{8,14}$/.test(payload.phone);
  if (!phoneOk) {
    return "Phone number should contain 8 to 14 digits.";
  }

  return "";
}

async function submitToGoogleSheet(payload) {
  if (isPlaceholderValue(GOOGLE_SCRIPT_URL)) {
    throw new Error("Google Apps Script URL is missing.");
  }

  await fetch(GOOGLE_SCRIPT_URL, {
    method: "POST",
    mode: "no-cors",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}

function handleCtaClick() {
  const offers = getSelectedOffers();
  const total = offers.reduce((sum, offer) => sum + offer.price, 0);

  if (total === 0) {
    openModal();
    return;
  }

  const key = getOfferStateKey(offers);
  const fallbackLink = WEBINAR_CONFIG.defaultRazorpayLink || WEBINAR_CONFIG.razorpayLink || "";
  const targetLink = [
    RAZORPAY_LINKS[key],
    ...offers.map((offer) => RAZORPAY_LINKS[offer.id]),
    fallbackLink
  ].find((link) => !isPlaceholderValue(link));

  if (isPlaceholderValue(targetLink)) {
    alert("No Razorpay link is configured for this selected benefit set yet.");
    return;
  }

  window.location.href = targetLink;
}

async function handleFormSubmit(event) {
  event.preventDefault();
  formStatus.textContent = "";
  formStatus.classList.remove("error");

  const payload = collectFormPayload();
  const validationError = validateForm(payload);
  if (validationError) {
    formStatus.textContent = validationError;
    formStatus.classList.add("error");
    return;
  }

  formSubmitButton.disabled = true;
  formSubmitButton.textContent = "Submitting...";

  try {
    await submitToGoogleSheet(payload);
    window.location.href = THANK_YOU_URL;
  } catch (error) {
    formStatus.textContent = "Could not submit right now. Please try again.";
    formStatus.classList.add("error");
    formSubmitButton.disabled = false;
    formSubmitButton.textContent = "Submit & Continue";
  }
}

primaryCta.addEventListener("click", handleCtaClick);
leadForm.addEventListener("submit", handleFormSubmit);

if (vipBenefitsGrid) {
  vipBenefitsGrid.addEventListener("change", (event) => {
    const target = event.target;
    if (target instanceof HTMLInputElement && target.classList.contains("bump-offer")) {
      updateSummary();
    }
  });
}

document.addEventListener("change", (event) => {
  const target = event.target;
  if (target instanceof HTMLInputElement && target.classList.contains("bump-offer")) {
    updateSummary();
  }
});

closeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const modalClose = button.classList.contains("modal-close");
    if (modalClose) {
      closeModal();
    } else {
      closeOfferCard();
    }
  });
});

document.addEventListener("click", (event) => {
  const target = event.target;
  if (target instanceof HTMLElement && target.dataset.closeModal === "true") {
    closeModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !formModal.classList.contains("hidden")) {
    closeModal();
  }
});

window.addEventListener("pageshow", syncOfferStateAfterRestore);

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    syncOfferStateAfterRestore();
  }
});

updateSummary();
renderVipBenefits();
updateSummary();
startOfferTimer();
