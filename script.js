const WEBINAR_CONFIG = window.WEBINAR_CONFIG || {};

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

const DEFAULT_GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwb8IT-nIQS_YAtYBLykix1Bbhm9WD5fB1ti0Qaj2531lK-j4s0qngPSq8kbE_fjUGQTQ/exec";
const DEFAULT_THANK_YOU_URL = "https://lp.avikdas10x.com/thank-you";
const DEFAULT_OFFER_DURATION_SECONDS = 14 * 60 + 20;

const DEFAULT_VIP_BENEFITS = [
  {
    id: "vip-days",
    title: "2 Special VIP Days",
    description: "Private implementation days with direct strategy walkthroughs.",
    image: "https://images.unsplash.com/photo-1560439514-e960a3ef5019?auto=format&fit=crop&w=1200&q=85"
  },
  {
    id: "recordings",
    title: "Lifetime Recordings",
    description: "Rewatch all premium sessions and execution sequences anytime.",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=85"
  },
  {
    id: "zoom-room",
    title: "Zoom Room Access",
    description: "Join intimate rooms for expert Q and A with direct feedback.",
    image: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=85"
  },
  {
    id: "strategy-session",
    title: "1-on-1 Strategy Session",
    description: "A tactical plan tuned to your current business stage.",
    image: "https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=1200&q=85"
  },
  {
    id: "ai-playbooks",
    title: "AI Playbook Bundle",
    description: "Ready-to-run systems and prompts to accelerate execution.",
    image: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=1200&q=85"
  }
];

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
const leadForm = document.getElementById("leadForm");
const formStatus = document.getElementById("formStatus");
const formSubmitButton = document.getElementById("formSubmitButton");

const infoBtn = document.getElementById("infoBtn");
const formModal = document.getElementById("formModal");
const upsellModal = document.getElementById("upsellModal");
const infoModal = document.getElementById("infoModal");
const upsellAccept = document.getElementById("upsellAccept");
const upsellDecline = document.getElementById("upsellDecline");
const scrollProgressBar = document.getElementById("scrollProgressBar");
const cursorGlow = document.getElementById("cursorGlow");

let pendingFreeCheckout = false;

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

function getBumpInput() {
  return document.querySelector(".bump-offer");
}

function getBundleSelected() {
  const input = getBumpInput();
  return Boolean(input && input.checked);
}

function getSelectedOffers() {
  if (!getBundleSelected()) {
    return [];
  }
  return [{ id: "vip-bundle", price: 199 }];
}

function getOfferStateKey(offers) {
  return offers
    .map((offer) => offer.id)
    .sort((a, b) => a.localeCompare(b))
    .join("+");
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
      <article class="benefit-card reveal" data-benefit-card="${id}">
        <img src="${image}" alt="${title}" loading="lazy" />
        <div class="benefit-copy">
          <h3>${title}</h3>
          <p>${description}</p>
        </div>
      </article>
    `;
  }).join("");
}

function syncSelectedBenefitStyles() {
  const selected = getBundleSelected();
  document.querySelectorAll(".benefit-card").forEach((card) => {
    card.classList.toggle("selected", selected);
  });
}

function updateSummary() {
  const offers = getSelectedOffers();
  const total = offers.reduce((sum, offer) => sum + offer.price, 0);

  if (totalAmountEl) {
    totalAmountEl.textContent = `₹${total}`;
  }

  syncSelectedBenefitStyles();

  if (!primaryCta) {
    return;
  }

  if (total === 0) {
    primaryCta.textContent = "Join for free";
    primaryCta.dataset.mode = "free";
  } else {
    primaryCta.textContent = `Unlock VIP Bundle for ₹${total}`;
    primaryCta.dataset.mode = "paid";
  }
}

function openModal(modalEl) {
  if (!modalEl) {
    return;
  }
  modalEl.classList.remove("hidden");
  modalEl.setAttribute("aria-hidden", "false");
}

function closeModal(modalEl) {
  if (!modalEl) {
    return;
  }
  modalEl.classList.add("hidden");
  modalEl.setAttribute("aria-hidden", "true");
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

function collectFormPayload() {
  const formData = new FormData(leadForm);

  return {
    timestamp: new Date().toISOString(),
    firstName: String(formData.get("firstName") || "").trim(),
    lastName: String(formData.get("lastName") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    profession: String(formData.get("profession") || "").trim(),
    city: String(formData.get("city") || "").trim(),
    countryCode: String(formData.get("countryCode") || "+91").trim(),
    phone: String(formData.get("phone") || "").trim(),
    selectedOfferState: "free-masterclass",
    selectedOffers: "None",
    totalAmount: 0
  };
}

function validateForm(payload) {
  if (!payload.firstName || !payload.lastName || !payload.email || !payload.profession || !payload.city || !payload.phone) {
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
    pendingFreeCheckout = true;
    openModal(upsellModal);
    return;
  }

  const key = getOfferStateKey(offers);
  const fallbackLink = WEBINAR_CONFIG.defaultRazorpayLink || WEBINAR_CONFIG.razorpayLink || "";
  const targetLink = [RAZORPAY_LINKS[key], fallbackLink].find((link) => !isPlaceholderValue(link));

  if (isPlaceholderValue(targetLink)) {
    alert("No Razorpay link is configured for the VIP bundle yet.");
    return;
  }

  window.location.href = targetLink;
}

async function handleFormSubmit(event) {
  event.preventDefault();
  if (!formStatus || !formSubmitButton) {
    return;
  }

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
    formSubmitButton.textContent = "Submit and Continue";
  }
}

function initEventHandlers() {
  if (primaryCta) {
    primaryCta.addEventListener("click", handleCtaClick);
  }

  if (leadForm) {
    leadForm.addEventListener("submit", handleFormSubmit);
  }

  document.addEventListener("change", (event) => {
    const target = event.target;
    if (target instanceof HTMLInputElement && target.classList.contains("bump-offer")) {
      updateSummary();
    }
  });

  if (infoBtn) {
    infoBtn.addEventListener("click", () => openModal(infoModal));
  }

  if (upsellAccept) {
    upsellAccept.addEventListener("click", () => {
      const bundleInput = getBumpInput();
      if (bundleInput instanceof HTMLInputElement) {
        bundleInput.checked = true;
      }
      closeModal(upsellModal);
      pendingFreeCheckout = false;
      updateSummary();
    });
  }

  if (upsellDecline) {
    upsellDecline.addEventListener("click", () => {
      closeModal(upsellModal);
      if (pendingFreeCheckout) {
        openModal(formModal);
      }
      pendingFreeCheckout = false;
    });
  }

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const closeTarget = target.dataset.closeModal;
    if (!closeTarget) {
      return;
    }

    if (closeTarget === "formModal") {
      closeModal(formModal);
    } else if (closeTarget === "upsellModal") {
      closeModal(upsellModal);
      pendingFreeCheckout = false;
    } else if (closeTarget === "infoModal") {
      closeModal(infoModal);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
      return;
    }
    closeModal(formModal);
    closeModal(upsellModal);
    closeModal(infoModal);
    pendingFreeCheckout = false;
  });

  window.addEventListener("pageshow", () => {
    window.requestAnimationFrame(updateSummary);
  });
}

function initParallaxMotion() {
  const meshes = document.querySelectorAll(".mesh");
  if (!meshes.length) {
    return;
  }

  window.addEventListener("mousemove", (event) => {
    const centerX = event.clientX / window.innerWidth - 0.5;
    const centerY = event.clientY / window.innerHeight - 0.5;

    meshes.forEach((mesh, index) => {
      const power = (index + 1) * 14;
      mesh.style.transform = `translate3d(${centerX * power}px, ${centerY * power}px, 0)`;
    });
  });
}

function initScrollProgress() {
  if (!scrollProgressBar) {
    return;
  }

  const syncProgress = () => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = maxScroll > 0 ? (window.scrollY / maxScroll) * 100 : 0;
    scrollProgressBar.style.width = `${Math.max(0, Math.min(100, progress))}%`;
  };

  syncProgress();
  window.addEventListener("scroll", syncProgress, { passive: true });
  window.addEventListener("resize", syncProgress);
}

function initCursorGlow() {
  if (!cursorGlow || window.matchMedia("(max-width: 640px)").matches) {
    return;
  }

  window.addEventListener("mousemove", (event) => {
    cursorGlow.style.left = `${event.clientX}px`;
    cursorGlow.style.top = `${event.clientY}px`;
  });
}

function initCounters() {
  const counters = document.querySelectorAll("[data-count]");
  if (!counters.length) {
    return;
  }

  const animateCounter = (el) => {
    const target = Number(el.getAttribute("data-count") || 0);
    const suffix = target >= 1000 ? "+" : "%";
    const showSuffix = el.id === "countSatisfaction" || el.id === "countAttendees";
    let current = 0;
    const step = Math.max(1, Math.ceil(target / 60));

    const tick = () => {
      current = Math.min(target, current + step);
      const text = current.toLocaleString("en-IN");
      el.textContent = showSuffix ? `${text}${suffix}` : text;
      if (current < target) {
        window.requestAnimationFrame(tick);
      }
    };

    tick();
  };

  counters.forEach((counter) => animateCounter(counter));
}

function initTiltCards() {
  document.querySelectorAll("[data-tilt]").forEach((card) => {
    card.addEventListener("mousemove", (event) => {
      const bounds = card.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;
      card.style.transform = `rotateX(${y * -8}deg) rotateY(${x * 10}deg)`;
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "rotateX(0deg) rotateY(0deg)";
    });
  });
}

function initMagneticButton() {
  const button = document.querySelector(".magnetic");
  if (!button) {
    return;
  }

  button.addEventListener("mousemove", (event) => {
    const bounds = button.getBoundingClientRect();
    const x = event.clientX - bounds.left - bounds.width / 2;
    const y = event.clientY - bounds.top - bounds.height / 2;
    button.style.transform = `translate(${x * 0.08}px, ${y * 0.08}px)`;
  });

  button.addEventListener("mouseleave", () => {
    button.style.transform = "translate(0, 0)";
  });
}

function initGsap() {
  if (!("gsap" in window)) {
    document.querySelectorAll(".reveal").forEach((el) => {
      el.style.opacity = "1";
      el.style.transform = "none";
    });
    return;
  }

  if ("ScrollTrigger" in window) {
    window.gsap.registerPlugin(window.ScrollTrigger);
  }

  window.gsap.to(".reveal", {
    opacity: 1,
    y: 0,
    stagger: 0.08,
    duration: 0.9,
    ease: "power2.out"
  });

  window.gsap.to(".mesh", {
    y: (index) => (index + 1) * 30,
    x: (index) => (index % 2 === 0 ? 40 : -40),
    repeat: -1,
    yoyo: true,
    duration: 9,
    ease: "sine.inOut",
    stagger: 0.3
  });

  window.gsap.fromTo(
    ".lux-card",
    { opacity: 0, y: 20, scale: 0.96 },
    {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.7,
      stagger: 0.08,
      scrollTrigger: {
        trigger: ".lux-section",
        start: "top 82%"
      }
    }
  );

  if ("ScrollTrigger" in window) {
    window.gsap.utils.toArray(".benefit-card").forEach((card, index) => {
      window.gsap.fromTo(
        card,
        { opacity: 0, y: 16 },
        {
          opacity: 1,
          y: 0,
          delay: index * 0.04,
          duration: 0.55,
          scrollTrigger: {
            trigger: card,
            start: "top 88%"
          }
        }
      );
    });
  }
}

function init() {
  renderVipBenefits();
  updateSummary();
  startOfferTimer();
  initEventHandlers();
  initParallaxMotion();
  initScrollProgress();
  initCursorGlow();
  initTiltCards();
  initMagneticButton();
  initCounters();
  initGsap();
}

init();
