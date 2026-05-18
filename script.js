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
    id: "prompt-profit",
    bonusNum: 1,
    title: "Prompt to Profit Signature Method",
    bullets: [
      "Turn AI into income",
      "Package your skills",
      "Reduce work time",
      "Build repeatable AI income systems",
      "Position yourself as an AI-powered authority"
    ],
    image: "https://i.ibb.co/99qqYWTG/69707e5512863-4.png"
  },
  {
    id: "chatgpt-50",
    bonusNum: 2,
    title: "50 Ways to Use ChatGPT in Business",
    bullets: [
      "Instantly apply AI across 50 scenarios",
      "Gain a competitive edge",
      "Increase revenue",
      "Eliminate trial-and-error",
      "Build a lean, AI-driven business engine"
    ],
    image: "https://i.ibb.co/Xxgt5x0H/69707f0333bd9-5.png"
  },
  {
    id: "authority-kit",
    bonusNum: 3,
    title: "Authority Builder Kit (Tailored to Niche)",
    bullets: [
      "Position yourself as the go-to expert",
      "Create high-impact content",
      "Build a personal brand identity",
      "Build trust faster",
      "Increase your perceived value"
    ],
    image: "https://i.ibb.co/VpNQnLqw/6995d4fba848f-6.png"
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
const primaryCtaSticky = document.getElementById("primaryCtaSticky");
const offerTimer = document.getElementById("offerTimer");
const vipBenefitsGrid = document.getElementById("vipBenefits");
const leadForm = document.getElementById("leadForm");
const formStatus = document.getElementById("formStatus");
const formSubmitButton = document.getElementById("formSubmitButton");

const formModal = document.getElementById("formModal");
const upsellModal = document.getElementById("upsellModal");
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
  const input = getBumpInput();
  if (!input || !input.checked) {
    return [];
  }
  const price = Number(input.dataset.price);
  return [{ id: "vip-bundle", price: Number.isFinite(price) && price > 0 ? price : 199 }];
}

function getOfferStateKey(offers) {
  return offers
    .map((offer) => offer.id)
    .sort((a, b) => a.localeCompare(b))
    .join("+");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function safeImageUrl(url) {
  const trimmed = String(url || "").trim();
  if (!/^https:\/\//i.test(trimmed)) {
    return "";
  }
  return trimmed.replace(/"/g, "");
}

function renderVipBenefits() {
  if (!vipBenefitsGrid) {
    return;
  }

  vipBenefitsGrid.innerHTML = VIP_BENEFITS.map((benefit, index) => {
    const id = String(benefit.id || "").trim();
    const title = String(benefit.title || "VIP Benefit");
    const image = safeImageUrl(benefit.image);
    const bonusNum = Number(benefit.bonusNum) > 0 ? Number(benefit.bonusNum) : index + 1;
    const bullets = Array.isArray(benefit.bullets) ? benefit.bullets : [];
    const bulletItems = bullets
      .map((line) => {
        const text = escapeHtml(String(line));
        return `<li><span class="vip-bonus-check" aria-hidden="true"><svg width="11" height="9" viewBox="0 0 11 9" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 4.5L4 7.5L10 1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span>${text}</li>`;
      })
      .join("");

    if (!id) {
      return "";
    }

    return `
      <article class="vip-bonus-card benefit-card reveal" data-benefit-card="${escapeHtml(id)}">
        <div class="vip-bonus-card-inner">
          <div class="vip-bonus-card-top">
            <span class="vip-bonus-script-label">Bonus</span>
            <span class="vip-bonus-num-badge">${bonusNum}</span>
          </div>
          <h3 class="vip-bonus-card-title">${escapeHtml(title)}</h3>
          <div class="vip-bonus-visual">
            <img src="${image}" alt="${escapeHtml(title)}" loading="lazy" />
          </div>
          <ul class="vip-bonus-points">${bulletItems}</ul>
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

  const ctas = [primaryCta, primaryCtaSticky].filter(Boolean);
  if (!ctas.length) {
    return;
  }

  let label;
  let mode;
  if (total === 0) {
    label = "Join for free";
    mode = "free";
  } else {
    label = `Unlock VIP bonus for ₹${total}`;
    mode = "paid";
  }

  ctas.forEach((btn) => {
    btn.textContent = label;
    btn.dataset.mode = mode;
  });
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

function navigateToRazorpayCheckout() {
  const offers = getSelectedOffers();
  const total = offers.reduce((sum, offer) => sum + offer.price, 0);
  if (total === 0) {
    return false;
  }

  const key = getOfferStateKey(offers);
  const fallbackLink = WEBINAR_CONFIG.defaultRazorpayLink || WEBINAR_CONFIG.razorpayLink || "";
  const targetLink = [RAZORPAY_LINKS[key], fallbackLink].find((link) => !isPlaceholderValue(link));

  if (isPlaceholderValue(targetLink)) {
    alert("No Razorpay link is configured for the VIP bundle yet.");
    return false;
  }

  // open checkout in a new tab so the main page remains available
  try {
    const newWin = window.open(targetLink, "_blank");
    if (newWin) {
      try {
        newWin.opener = null;
      } catch (e) {
        // ignore
      }
    }
  } catch (e) {
    // fallback to same-tab navigation if popups are blocked
    window.location.href = targetLink;
  }
  return true;
}

function handleCtaClick() {
  const offers = getSelectedOffers();
  const total = offers.reduce((sum, offer) => sum + offer.price, 0);

  if (total === 0) {
    pendingFreeCheckout = true;
    openModal(upsellModal);
    return;
  }

  navigateToRazorpayCheckout();
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
  const ctaClick = (event) => {
    const target = event.currentTarget;
    if (target instanceof HTMLButtonElement && target.disabled) {
      return;
    }
    handleCtaClick();
  };

  if (primaryCta) {
    primaryCta.addEventListener("click", ctaClick);
  }

  if (primaryCtaSticky) {
    primaryCtaSticky.addEventListener("click", ctaClick);
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

  if (upsellAccept) {
    upsellAccept.addEventListener("click", () => {
      const bundleInput = getBumpInput();
      if (bundleInput instanceof HTMLInputElement) {
        bundleInput.checked = true;
      }
      pendingFreeCheckout = false;
      updateSummary();

      if (!navigateToRazorpayCheckout()) {
        if (bundleInput instanceof HTMLInputElement) {
          bundleInput.checked = false;
        }
        updateSummary();
        return;
      }

      closeModal(upsellModal);
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
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
      return;
    }
    closeModal(formModal);
    closeModal(upsellModal);
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
  document.querySelectorAll(".magnetic").forEach((button) => {
    button.addEventListener("mousemove", (event) => {
      const bounds = button.getBoundingClientRect();
      const x = event.clientX - bounds.left - bounds.width / 2;
      const y = event.clientY - bounds.top - bounds.height / 2;
      button.style.transform = `translate(${x * 0.08}px, ${y * 0.08}px)`;
    });

    button.addEventListener("mouseleave", () => {
      button.style.transform = "translate(0, 0)";
    });
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
    ".vip-compare-card",
    { opacity: 0, y: 20, scale: 0.98 },
    {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.7,
      stagger: 0.1,
      scrollTrigger: {
        trigger: ".vip-compare-section",
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

function initSysAltProgress() {
  const finalValue = 82.22;
  const duration = 4000;
  const numberEl = document.getElementById("sys-alt-progress-number");
  const target = document.getElementById("sys-alt-target-element");
  const bar = target ? target.querySelector(".sys-alt-progress-bar") : null;

  if (!numberEl || !bar) {
    return;
  }

  let hasStarted = false;

  function animateNumber() {
    const startTime = performance.now();

    function updateNumber(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const currentValue = (progress * finalValue).toFixed(2);
      numberEl.textContent = `${currentValue}%`;

      if (progress < 1) {
        requestAnimationFrame(updateNumber);
      }
    }

    requestAnimationFrame(updateNumber);
  }

  function startAnimation() {
    if (hasStarted) {
      return;
    }
    hasStarted = true;
    bar.classList.add("sys-alt-start-animation");
    animateNumber();
  }

  window.setTimeout(startAnimation, 300);

  if ("IntersectionObserver" in window && target) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            startAnimation();
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );
    observer.observe(target);
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
  initGsap();
  initSysAltProgress();
}

init();
