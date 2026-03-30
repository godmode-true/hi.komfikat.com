(() => {
  const App = (window.KomfiKatApp = window.KomfiKatApp || {});

  // DOM references
  App.dom = {
    root: document.documentElement,
    body: document.body,
    topBar: document.querySelector(".top-bar"),
    topBarTooltip: document.querySelector("[data-top-bar-tooltip]"),
    homeHero: document.querySelector("[data-home-hero]"),
    themeToggle: document.querySelector("[data-theme-toggle]"),
    shareMenu: document.querySelector("[data-share-menu]"),
    shareRail: document.querySelector("[data-share-rail]"),
    shareRailHint: document.querySelector("[data-share-rail-hint]"),
    shareHoverBridge: document.querySelector(".share-rail__hover-bridge"),
    shareButton: document.querySelector("[data-share-page]"),
    subscribeButton: document.querySelector(".action-button--subscribe"),
    socialHandleLinks: document.querySelectorAll(".social-links__link[data-handle-label]"),
    socialHashtagLinks: document.querySelectorAll(".social-links__hashtag[data-hashtag-tooltip]"),
    shareCopyButton: document.querySelector('[data-share-option="copy"]'),
    shareOptions: document.querySelectorAll("[data-share-option]"),
    themeColorMeta: document.querySelector('meta[name="theme-color"]'),
    canonicalLink: document.querySelector('link[rel="canonical"]'),
    metaDescription: document.querySelector('meta[name="description"]'),
    storyTrigger: document.querySelector("[data-story-open]"),
    profileLogo: document.querySelector(".profile__logo"),
    profileTitle: document.querySelector("[data-copy-profile-title]"),
    storyViewer: document.querySelector("[data-story-viewer]"),
    storyTitle: document.querySelector("[data-story-title]"),
    storyEyebrow: document.querySelector("[data-story-eyebrow]"),
    storyMeta: document.querySelector("[data-story-meta]"),
    storyDescription: document.querySelector("[data-story-description]"),
    storyImage: document.querySelector("[data-story-image]"),
    storyProgress: document.querySelector("[data-story-progress]"),
    storyCta: document.querySelector("[data-story-cta]"),
    storyPrev: document.querySelector("[data-story-prev]"),
    storyNext: document.querySelector("[data-story-next]"),
    storyClose: document.querySelector("[data-story-close]"),
    storyPlaybackToggle: document.querySelector("[data-story-toggle-playback]"),
    storySurface: document.querySelector(".story-viewer__surface"),
    storyMobileHint: document.querySelector(".profile__story-mobile-hint"),
    storyDesktopHint: document.querySelector(".profile__story-desktop-hint"),
    promoCarousel: document.querySelector("[data-promo-carousel]"),
    promoCarouselViewport: document.querySelector("[data-promo-carousel-viewport]"),
    promoCarouselTrack: document.querySelector("[data-promo-carousel-track]"),
    promoCarouselDots: document.querySelector("[data-promo-carousel-dots]"),
    promoCarouselPrev: document.querySelector("[data-promo-carousel-prev]"),
    promoCarouselNext: document.querySelector("[data-promo-carousel-next]"),
    promoRedirectToast: document.querySelector("[data-promo-redirect-toast]"),
    promoRedirectBody: document.querySelector("[data-promo-redirect-body]"),
    promoRedirectCode: document.querySelector("[data-promo-redirect-code]"),
    promoRedirectCountdown: document.querySelector("[data-promo-redirect-countdown]"),
    promoRedirectOpenNow: document.querySelector("[data-promo-redirect-open-now]"),
    promoRedirectCancel: document.querySelector("[data-promo-redirect-cancel]"),
  };

  App.storageKeys = {
    theme: "komfi-theme",
    themePreset: "komfi-theme-preset",
    storyViewed: "komfi-story-viewed-signature-v2",
    storyHintDismissed: "komfi-story-hint-dismissed-signature-v1",
  };

  App.flags = {
    themeInitialized: false,
    shareInitialized: false,
    storiesInitialized: false,
    carouselInitialized: false,
  };

  let promoViewportFitFrame = 0;
  let promoViewportFitResizeTimeout = 0;
  let promoViewportFitStableHeight = 0;
  let promoViewportFitStableWidth = 0;
  let topBarTooltipOwner = "";
  let topBarTooltipStickyOwner = "";
  let topBarTooltipClickOwner = "";
  let topBarTooltipCleanupTimeout = 0;
  let topBarTooltipIdleRestoreTimeout = 0;
  const topBarTooltipTransitionMs = 180;
  const topBarTooltipIdleOwner = "top-bar-idle";
  const topBarTooltipIdleDesktopText = "Welcome to Komfi Kat community!";
  const topBarTooltipIdleMobileText = "Welcome to Komfi Kat community!";
  const topBarTooltipStickyBlockedHoverOwners = new Set();

  const monthMap = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  function formatStoryDate(dateString) {
    if (typeof dateString !== "string") {
      return "";
    }

    const [yearPart, monthPart, dayPart] = dateString.split("-");
    const year = Number.parseInt(yearPart, 10);
    const month = Number.parseInt(monthPart, 10);
    const day = Number.parseInt(dayPart, 10);

    if (!year || !month || !day || month < 1 || month > 12) {
      return dateString;
    }

    return `${monthMap[month - 1]} ${day}, ${year}`;
  }

  function readStorageValue(key, fallback = "") {
    try {
      return localStorage.getItem(key) || fallback;
    } catch {
      return fallback;
    }
  }

  function writeStorageValue(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {}
  }

  function removeStorageValue(key) {
    try {
      localStorage.removeItem(key);
    } catch {}
  }

  function isDesktopPointerDevice() {
    const hasCoarsePointer = window.matchMedia("(any-pointer: coarse)").matches;
    const hasTouchPoints = typeof navigator.maxTouchPoints === "number" && navigator.maxTouchPoints > 0;
    return window.matchMedia("(hover: hover) and (pointer: fine)").matches && !hasCoarsePointer && !hasTouchPoints;
  }

  function isTouchLikeDevice() {
    const hasCoarsePointer = window.matchMedia("(any-pointer: coarse)").matches;
    const hasTouchPoints = typeof navigator.maxTouchPoints === "number" && navigator.maxTouchPoints > 0;
    return hasCoarsePointer || hasTouchPoints || !isDesktopPointerDevice();
  }

  function isDevPreviewHost() {
    const host = window.location.hostname || "";
    return host === "localhost" || host === "127.0.0.1" || host.startsWith("192.168.");
  }

  function lockViewportGestureZoom() {
    if (!isTouchLikeDevice()) {
      return;
    }

    let lastTouchEndAt = 0;
    let lastTouchX = 0;
    let lastTouchY = 0;

    const isEditableTarget = (target) =>
      target instanceof Element && Boolean(target.closest('input, textarea, select, [contenteditable="true"]'));
    const findTapTarget = (target) =>
      target instanceof Element
        ? target.closest('button, a, summary, [role="button"], input[type="button"], input[type="submit"], input[type="reset"]')
        : null;

    const preventGestureZoom = (event) => {
      if (event.cancelable) {
        event.preventDefault();
      }
    };

    ["gesturestart", "gesturechange", "gestureend"].forEach((eventName) => {
      document.addEventListener(eventName, preventGestureZoom, { passive: false });
    });

    document.addEventListener(
      "touchstart",
      (event) => {
        if (event.touches.length > 1 && event.cancelable) {
          event.preventDefault();
        }
      },
      { passive: false },
    );

    document.addEventListener(
      "touchmove",
      (event) => {
        if (event.touches.length > 1 && event.cancelable) {
          event.preventDefault();
        }
      },
      { passive: false },
    );

    document.addEventListener(
      "touchend",
      (event) => {
        const touch = event.changedTouches[0];

        if (!touch) {
          return;
        }

        const now = window.performance.now();
        const isRapidSecondTap = now - lastTouchEndAt < 320;
        const isNearbyTap = Math.abs(touch.clientX - lastTouchX) < 28 && Math.abs(touch.clientY - lastTouchY) < 28;
        const tapTarget = findTapTarget(event.target);

        lastTouchEndAt = now;
        lastTouchX = touch.clientX;
        lastTouchY = touch.clientY;

        if (!isRapidSecondTap || !isNearbyTap || isEditableTarget(event.target)) {
          return;
        }

        if (event.cancelable) {
          event.preventDefault();
        }

        if (tapTarget) {
          tapTarget.dispatchEvent(
            new MouseEvent("click", {
              bubbles: true,
              cancelable: true,
              view: window,
            }),
          );
        }
      },
      { passive: false },
    );
  }

  function syncPromoCarouselViewportFit() {
    const page = document.querySelector(".page");
    const homeHero = App.dom.homeHero;
    const promoShell = App.dom.promoCarousel;
    const promoSection = promoShell?.closest(".promo-carousel");
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;

    if (!page || !homeHero || !promoShell || !promoSection) {
      return;
    }

    delete homeHero.dataset.homeHeroFit;
    delete promoSection.dataset.viewportFit;
    promoSection.style.removeProperty("--promo-screen-available-height");

    if (viewportWidth > 1024 || isTouchLikeDevice()) {
      promoViewportFitStableHeight = 0;
      promoViewportFitStableWidth = 0;
      return;
    }

    const rawViewportHeight = window.visualViewport?.height || window.innerHeight || 0;
    const shouldUseStableMobileViewportHeight = isTouchLikeDevice();

    if (
      shouldUseStableMobileViewportHeight &&
      (!promoViewportFitStableHeight || Math.abs(viewportWidth - promoViewportFitStableWidth) > 24)
    ) {
      promoViewportFitStableHeight = rawViewportHeight;
      promoViewportFitStableWidth = viewportWidth;
    } else if (shouldUseStableMobileViewportHeight) {
      promoViewportFitStableHeight = Math.min(promoViewportFitStableHeight, rawViewportHeight);
      promoViewportFitStableWidth = viewportWidth;
    }

    const viewportHeight = shouldUseStableMobileViewportHeight ? promoViewportFitStableHeight : rawViewportHeight;
    const pageStyles = window.getComputedStyle(page);
    const pageTopPadding = Number.parseFloat(pageStyles.paddingTop || "0") || 0;
    const pageBottomPadding = Number.parseFloat(pageStyles.paddingBottom || "0") || 0;
    const availableHeroHeight = Math.floor(viewportHeight - pageTopPadding - pageBottomPadding);

    if (availableHeroHeight <= 0) {
      return;
    }

    const naturalHeight = homeHero.offsetHeight;

    if (naturalHeight <= availableHeroHeight) {
      return;
    }

    homeHero.dataset.homeHeroFit = "true";

    const heroRect = homeHero.getBoundingClientRect();
    const promoRect = promoSection.getBoundingClientRect();
    const availablePromoHeight = Math.floor(heroRect.bottom - promoRect.top);

    if (availablePromoHeight <= 0) {
      delete homeHero.dataset.homeHeroFit;
      return;
    }

    promoSection.dataset.viewportFit = "true";
    promoSection.style.setProperty("--promo-screen-available-height", `${availablePromoHeight}px`);
  }

  function schedulePromoCarouselViewportFitSync({ debounce = false } = {}) {
    window.cancelAnimationFrame(promoViewportFitFrame);
    window.clearTimeout(promoViewportFitResizeTimeout);

    const runSync = () => {
      promoViewportFitFrame = window.requestAnimationFrame(() => {
        syncPromoCarouselViewportFit();
      });
    };

    if (debounce) {
      promoViewportFitResizeTimeout = window.setTimeout(runSync, 180);
      return;
    }

    runSync();
  }

  function createShareHintText(text) {
    const textElement = document.createElement("span");
    textElement.className = "share-rail__hint-text";
    textElement.textContent = text;
    return textElement;
  }

  function createShareHintIcon(icon) {
    const iconElement = document.createElement("span");
    iconElement.className = "share-rail__hint-icon";
    iconElement.textContent = icon;
    return iconElement;
  }

  function createShareHintStatusIcon() {
    const iconElement = document.createElement("img");
    iconElement.className = "share-rail__hint-status-icon";
    iconElement.src = "img/icons/success.svg";
    iconElement.alt = "";
    iconElement.width = 18;
    iconElement.height = 18;
    iconElement.decoding = "async";
    iconElement.setAttribute("aria-hidden", "true");
    return iconElement;
  }

  function setShareHintContent({ text, icon = "", success = false }) {
    if (!App.dom.shareRailHint) {
      return;
    }

    const nodes = [];

    if (success) {
      nodes.push(createShareHintStatusIcon());
    }

    nodes.push(createShareHintText(text));

    if (icon) {
      nodes.push(createShareHintIcon(icon));
    }

    App.dom.shareRailHint.replaceChildren(...nodes);
  }

  function createTopBarTooltipLabel(text, options = {}) {
    const normalizedText = typeof text === "string" ? text.trim() : "";

    if (!normalizedText) {
      return null;
    }

    const label = document.createElement("span");
    const variant = typeof options.variant === "string" ? options.variant.trim() : "";

    label.className = "top-bar__tooltip-label";

    if (variant) {
      label.classList.add(`top-bar__tooltip-label--${variant}`);
    }

    label.textContent = normalizedText;
    return label;
  }

  function setTopBarTooltipContent(content) {
    if (!App.dom.topBarTooltip) {
      return false;
    }

    if (typeof content === "string") {
      const label = createTopBarTooltipLabel(content);

      if (!(label instanceof HTMLElement)) {
        return false;
      }

      App.dom.topBarTooltip.replaceChildren(label);
      return true;
    }

    const nodes = (Array.isArray(content) ? content : [content]).filter((node) => node instanceof Node);

    if (!nodes.length) {
      return false;
    }

    App.dom.topBarTooltip.replaceChildren(...nodes);
    return true;
  }

  function getIdleTopBarTooltipText() {
    return isTouchLikeDevice() || window.matchMedia("(max-width: 48rem)").matches
      ? topBarTooltipIdleMobileText
      : topBarTooltipIdleDesktopText;
  }

  function isPromoRedirectToastVisible() {
    return (
      App.isPromoRedirectVisible?.() === true ||
      App.dom.shareMenu?.dataset.promoRedirectVisible === "true" ||
      App.dom.promoRedirectToast?.dataset.visible === "true"
    );
  }

  function canShowIdleTopBarTooltip() {
    return (
      !!App.dom.topBarTooltip &&
      App.dom.shareMenu?.dataset.shareMenuOpen !== "true" &&
      App.dom.shareMenu?.dataset.shareHintVisible !== "true" &&
      App.dom.shareMenu?.dataset.shareFeedbackVisible !== "true" &&
      !isPromoRedirectToastVisible()
    );
  }

  function showIdleTopBarTooltip() {
    if (!canShowIdleTopBarTooltip()) {
      return false;
    }

    const idleLabel = createTopBarTooltipLabel(getIdleTopBarTooltipText(), { variant: "welcome" });

    if (!(idleLabel instanceof HTMLElement) || !setTopBarTooltipContent(idleLabel)) {
      return false;
    }

    window.clearTimeout(topBarTooltipCleanupTimeout);
    window.clearTimeout(topBarTooltipIdleRestoreTimeout);
    topBarTooltipOwner = topBarTooltipIdleOwner;
    topBarTooltipStickyOwner = "";
    topBarTooltipClickOwner = "";
    App.dom.topBarTooltip.dataset.anchor = "center";
    delete App.dom.topBarTooltip.dataset.interactive;
    App.dom.topBarTooltip.dataset.visible = "true";
    return true;
  }

  function scheduleIdleTopBarTooltipRestore() {
    window.clearTimeout(topBarTooltipIdleRestoreTimeout);
    topBarTooltipIdleRestoreTimeout = window.setTimeout(() => {
      if (topBarTooltipOwner && topBarTooltipOwner !== topBarTooltipIdleOwner) {
        return;
      }

      showIdleTopBarTooltip();
    }, 0);
  }

  function showTopBarTooltip(content, owner = "default", anchor = "center", options = {}) {
    if (!App.dom.topBarTooltip || !isDesktopPointerDevice()) {
      return;
    }

    if (isPromoRedirectToastVisible()) {
      return;
    }

    window.clearTimeout(topBarTooltipIdleRestoreTimeout);
    const trigger = options.trigger === "click" ? "click" : "hover";

    if (
      App.dom.topBarTooltip.dataset.visible === "true" &&
      topBarTooltipStickyOwner &&
      topBarTooltipStickyOwner !== owner &&
      trigger !== "click" &&
      topBarTooltipStickyBlockedHoverOwners.has(owner)
    ) {
      return;
    }

    if (!setTopBarTooltipContent(content)) {
      return;
    }

    dismissStickyMenuPrompts("top-bar-tooltip");
    window.clearTimeout(topBarTooltipCleanupTimeout);
    topBarTooltipOwner = owner;
    App.dom.topBarTooltip.dataset.anchor = anchor;
    if (options.interactive) {
      App.dom.topBarTooltip.dataset.interactive = "true";
    } else {
      delete App.dom.topBarTooltip.dataset.interactive;
    }
    if (options.sticky) {
      topBarTooltipStickyOwner = owner;
    } else if (topBarTooltipStickyOwner && topBarTooltipStickyOwner !== owner) {
      topBarTooltipStickyOwner = "";
    } else if (trigger === "click") {
      topBarTooltipStickyOwner = "";
    }
    if (trigger === "click" && options.sticky) {
      topBarTooltipClickOwner = owner;
    } else if (owner !== topBarTooltipClickOwner) {
      topBarTooltipClickOwner = "";
    }
    App.dom.topBarTooltip.dataset.visible = "true";
  }

  function scheduleTopBarTooltipCleanup() {
    window.clearTimeout(topBarTooltipCleanupTimeout);
    topBarTooltipCleanupTimeout = window.setTimeout(() => {
      if (App.dom.topBarTooltip?.dataset.visible === "true") {
        return;
      }

      delete App.dom.topBarTooltip.dataset.anchor;
      delete App.dom.topBarTooltip.dataset.interactive;
      App.dom.topBarTooltip.replaceChildren();
    }, topBarTooltipTransitionMs);
  }

  function forceHideTopBarTooltip() {
    if (!App.dom.topBarTooltip) {
      return;
    }

    window.clearTimeout(topBarTooltipIdleRestoreTimeout);
    topBarTooltipOwner = "";
    topBarTooltipStickyOwner = "";
    topBarTooltipClickOwner = "";
    delete App.dom.topBarTooltip.dataset.visible;
    delete App.dom.topBarTooltip.dataset.interactive;
    scheduleTopBarTooltipCleanup();
  }

  function dismissTopBarTooltipUntilNextStateChange() {
    if (!App.dom.topBarTooltip) {
      return;
    }

    window.clearTimeout(topBarTooltipIdleRestoreTimeout);
    topBarTooltipOwner = "__dismissed__";
    topBarTooltipStickyOwner = "";
    topBarTooltipClickOwner = "";
    delete App.dom.topBarTooltip.dataset.visible;
    delete App.dom.topBarTooltip.dataset.interactive;
    scheduleTopBarTooltipCleanup();
  }

  function hideTopBarTooltip(owner = "") {
    if (!App.dom.topBarTooltip) {
      return;
    }

    if (owner && topBarTooltipOwner && topBarTooltipOwner !== owner) {
      return;
    }

    window.clearTimeout(topBarTooltipIdleRestoreTimeout);
    topBarTooltipOwner = "";
    topBarTooltipStickyOwner = "";
    topBarTooltipClickOwner = "";
    delete App.dom.topBarTooltip.dataset.visible;
    delete App.dom.topBarTooltip.dataset.interactive;
    scheduleTopBarTooltipCleanup();
    scheduleIdleTopBarTooltipRestore();
  }

  function dismissStickyMenuPrompts(except = "") {
    if (isPromoRedirectToastVisible()) {
      return;
    }

    if (except !== "top-bar-tooltip") {
      forceHideTopBarTooltip();
    }

    if (except !== "share") {
      App.hideShareStickyUi?.();
    }

    if (except !== "promo-redirect") {
      App.dismissPromoRedirectToast?.();
    }
  }

  function createPromoRedirectBodyContent(promoCode = "") {
    const body = document.createElement("span");
    body.className = "promo-redirect-toast__body";
    body.setAttribute("data-promo-redirect-body", "");

    const eyebrow = document.createElement("span");
    eyebrow.className = "promo-redirect-toast__eyebrow";
    eyebrow.append("Promo code ");

    if (promoCode) {
      const code = document.createElement("span");
      code.className = "promo-redirect-toast__code";
      code.setAttribute("data-promo-redirect-code", "");
      code.textContent = promoCode;
      eyebrow.append(code, " copied");
    } else {
      eyebrow.append("copied");
    }

    const text = document.createElement("span");
    text.className = "promo-redirect-toast__text";
    text.append("Redirecting to Etsy in ");

    const countdown = document.createElement("span");
    countdown.className = "promo-redirect-toast__countdown";
    countdown.setAttribute("data-promo-redirect-countdown", "");
    countdown.textContent = "5";
    text.append(countdown);

    body.append(eyebrow, text);
    return body;
  }

  function setPromoRedirectToastContent({ mode = "redirect", message = "", success = false, promoCode = "" } = {}) {
    if (!App.dom.promoRedirectToast) {
      return;
    }

    const bodyElement = App.dom.promoRedirectToast.querySelector("[data-promo-redirect-body]");

    if (!bodyElement) {
      return;
    }

    if (mode === "feedback") {
      const nodes = [];

      if (success) {
        const successIcon = createShareHintStatusIcon();
        successIcon.classList.add("promo-redirect-toast__status-icon");
        nodes.push(successIcon);
      }

      const messageNode = document.createElement("span");
      messageNode.className = "promo-redirect-toast__feedback-label";
      messageNode.textContent = message;
      nodes.push(messageNode);

      bodyElement.replaceChildren(...nodes);
      App.dom.promoRedirectCountdown = App.dom.promoRedirectToast.querySelector("[data-promo-redirect-countdown]");
      App.dom.promoRedirectCode = App.dom.promoRedirectToast.querySelector("[data-promo-redirect-code]");
      App.dom.promoRedirectBody = bodyElement;

      if (App.dom.promoRedirectOpenNow) {
        App.dom.promoRedirectOpenNow.hidden = true;
      }

      if (App.dom.promoRedirectCancel) {
        App.dom.promoRedirectCancel.hidden = true;
      }

      App.dom.promoRedirectToast.dataset.mode = "feedback";
      return;
    }

    const nextBody = createPromoRedirectBodyContent(promoCode);
    bodyElement.replaceWith(nextBody);
    App.dom.promoRedirectBody = nextBody;
    App.dom.promoRedirectCountdown = App.dom.promoRedirectToast.querySelector("[data-promo-redirect-countdown]");
    App.dom.promoRedirectCode = App.dom.promoRedirectToast.querySelector("[data-promo-redirect-code]");

    if (App.dom.promoRedirectOpenNow) {
      App.dom.promoRedirectOpenNow.hidden = false;
    }

    if (App.dom.promoRedirectCancel) {
      App.dom.promoRedirectCancel.hidden = false;
    }

    App.dom.promoRedirectToast.dataset.mode = "redirect";
  }

  function legacyCopyText(text) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    textarea.style.pointerEvents = "none";
    document.body.append(textarea);
    textarea.select();

    let didCopy = false;

    try {
      didCopy = document.execCommand("copy");
    } catch {
      didCopy = false;
    }

    textarea.remove();
    return didCopy;
  }

  async function copyText(text) {
    if (isTouchLikeDevice()) {
      const didLegacyCopy = legacyCopyText(text);

      if (didLegacyCopy) {
        return true;
      }
    }

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    return legacyCopyText(text);
  }

  App.helpers = {
    formatStoryDate,
    readStorageValue,
    writeStorageValue,
    removeStorageValue,
    isDesktopPointerDevice,
    isTouchLikeDevice,
    isDevPreviewHost,
    createShareHintText,
    createShareHintIcon,
    createShareHintStatusIcon,
    setShareHintContent,
    showTopBarTooltip,
    hideTopBarTooltip,
    dismissStickyMenuPrompts,
    showIdleTopBarTooltip,
    scheduleIdleTopBarTooltipRestore,
    dismissTopBarTooltipUntilNextStateChange,
    isPromoRedirectToastVisible,
    setPromoRedirectToastContent,
    copyText,
    lockViewportGestureZoom,
  };

  document.addEventListener("DOMContentLoaded", () => {
    App.dom.socialHandleLinks?.forEach((link, index) => {
      const tooltipText = link.dataset.handleLabel?.trim() || "";
      const tooltipOwner = `social-handle-${index}`;
      const createTooltipContent = () => {
        const icon = link.querySelector(".social-links__icon")?.cloneNode(true);
        const label = document.createElement("span");

        label.className = "top-bar__tooltip-label";
        label.textContent = tooltipText;

        if (!(icon instanceof SVGElement)) {
          return [label];
        }

        icon.classList.remove("social-links__icon");
        icon.classList.add("top-bar__tooltip-social-icon");
        icon.setAttribute("aria-hidden", "true");

        return [icon, label];
      };

      if (!tooltipText) {
        return;
      }

      link.addEventListener("mouseenter", () => {
        App.helpers.showTopBarTooltip(createTooltipContent(), tooltipOwner, "center", { sticky: true });
      });

      link.addEventListener("mouseleave", () => {
        App.helpers.hideTopBarTooltip(tooltipOwner);
      });

      link.addEventListener("focus", () => {
        App.helpers.showTopBarTooltip(createTooltipContent(), tooltipOwner, "center", { sticky: true });
      });

      link.addEventListener("blur", () => {
        App.helpers.hideTopBarTooltip(tooltipOwner);
      });
    });

    const createHashtagCopyFeedback = (link) => {
      const feedback = document.createElement("span");
      const label = document.createElement("button");
      const platforms = document.createElement("span");
      const platformConfigs = [
        { key: "instagram", label: "Instagram", url: link.dataset.hashtagInstagramUrl?.trim() || "" },
        { key: "youtube", label: "YouTube", url: link.dataset.hashtagYoutubeUrl?.trim() || "" },
        { key: "tiktok", label: "TikTok", url: link.dataset.hashtagTiktokUrl?.trim() || "" },
      ];

      feedback.className = "social-links__hashtag-feedback";
      label.className = "social-links__hashtag-feedback-label";
      label.type = "button";
      label.textContent = "Tag copied!";
      platforms.className = "social-links__hashtag-feedback-links";

      platformConfigs.forEach(({ key: platformKey, label: platformLabel, url }) => {
        const sourceIcon = document.querySelector(
          `.social-links__link[data-platform="${platformKey}"] .social-links__icon`,
        )?.cloneNode(true);

        if (!(sourceIcon instanceof SVGElement) || !url) {
          return;
        }

        const platform = document.createElement("a");

        platform.className = "social-links__hashtag-feedback-link";
        platform.href = url;
        platform.target = "_blank";
        platform.rel = "noopener noreferrer";
        platform.setAttribute("aria-label", `Open ${platformLabel} posts for ${link.textContent?.trim() || "this hashtag"}`);
        sourceIcon.classList.remove("social-links__icon");
        sourceIcon.classList.add("social-links__hashtag-feedback-icon");
        sourceIcon.setAttribute("aria-hidden", "true");
        platform.append(sourceIcon);
        platforms.append(platform);
      });

      if (!platforms.childElementCount) {
        return null;
      }

      feedback.append(label, platforms);
      return feedback;
    };

    App.dom.socialHashtagLinks?.forEach((link, index) => {
      const tooltipOwner = `social-hashtag-${index}`;
      const hashtagItem = link.closest(".social-links__hashtag-item");
      const hashtagLabel = link.querySelector(".social-links__hashtag-label");
      const defaultHashtagLabel = hashtagLabel?.textContent?.trim() || "";
      const hashtagFeedback = createHashtagCopyFeedback(link);
      let hashtagFeedbackTimeout = 0;
      const getHashtagCopyText = () => defaultHashtagLabel;
      const setHashtagFeedbackVisible = (isVisible) => {
        if (!(hashtagItem instanceof HTMLElement) || !hashtagFeedback) {
          return;
        }

        window.clearTimeout(hashtagFeedbackTimeout);
        hashtagFeedbackTimeout = 0;

        if (isVisible) {
          hashtagItem.dataset.feedbackVisible = "true";
          hashtagFeedbackTimeout = window.setTimeout(() => {
            delete hashtagItem.dataset.feedbackVisible;
            hashtagFeedbackTimeout = 0;
          }, 10000);
          return;
        }

        delete hashtagItem.dataset.feedbackVisible;
      };

      if (hashtagFeedback && hashtagItem instanceof HTMLElement) {
        hashtagItem.append(hashtagFeedback);

        hashtagFeedback.querySelector(".social-links__hashtag-feedback-label")?.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          setHashtagFeedbackVisible(false);
        });
      }

      link.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopPropagation();

        const hashtagText = getHashtagCopyText();

        if (!hashtagText) {
          return;
        }

        const didCopy = await App.helpers.copyText(hashtagText);

        if (!didCopy) {
          return;
        }

        App.helpers.hideTopBarTooltip(tooltipOwner);
        setHashtagFeedbackVisible(true);
      });
    });

    App.dom.socialHandleLinks?.forEach((link) => {
      link.addEventListener("click", () => {
        App.helpers.hideTopBarTooltip();
      });
    });

    document.addEventListener("click", () => {
      if (!topBarTooltipStickyOwner.startsWith("social-hashtag-")) {
        return;
      }

      App.helpers.hideTopBarTooltip();
    });

    if (App.helpers.isDevPreviewHost()) {
      App.helpers.removeStorageValue(App.storageKeys.storyViewed);
      App.helpers.removeStorageValue(App.storageKeys.storyHintDismissed);
      App.dom.root.dataset.devStoryReset = "true";
    }

    [App.dom.storyTrigger, App.dom.profileLogo].forEach((element) => {
      if (!element) {
        return;
      }

      element.addEventListener("dragstart", (event) => event.preventDefault());
      element.addEventListener("contextmenu", (event) => event.preventDefault());
    });

    if (App.dom.subscribeButton) {
      const subscribeTooltip = "Get your free cozy coloring pages!";

      App.dom.subscribeButton.addEventListener("mouseenter", () => {
        App.helpers.showTopBarTooltip(subscribeTooltip, "subscribe-button", "subscribe-button-right");
      });

      App.dom.subscribeButton.addEventListener("mouseleave", () => {
        App.helpers.hideTopBarTooltip("subscribe-button");
      });

      App.dom.subscribeButton.addEventListener("focus", () => {
        App.helpers.showTopBarTooltip(subscribeTooltip, "subscribe-button", "subscribe-button-right");
      });

      App.dom.subscribeButton.addEventListener("blur", () => {
        App.helpers.hideTopBarTooltip("subscribe-button");
      });
    }

    App.helpers.lockViewportGestureZoom();

    App.initTheme?.();
    App.initShare?.();
    App.initStories?.();
    App.initCarousel?.();
    App.helpers.scheduleIdleTopBarTooltipRestore?.();

    document.addEventListener("keydown", (event) => {
      if (
        event.key !== "Escape" ||
        !isDesktopPointerDevice() ||
        App.dom.topBarTooltip?.dataset.visible !== "true" ||
        topBarTooltipOwner === topBarTooltipIdleOwner
      ) {
        return;
      }

      App.helpers.hideTopBarTooltip();
    });

    schedulePromoCarouselViewportFitSync();
    window.addEventListener("resize", () => schedulePromoCarouselViewportFitSync({ debounce: true }));
    window.visualViewport?.addEventListener("resize", () => schedulePromoCarouselViewportFitSync({ debounce: true }));
    window.addEventListener("orientationchange", () => {
      promoViewportFitStableHeight = 0;
      promoViewportFitStableWidth = 0;
      schedulePromoCarouselViewportFitSync();
    });
    window.addEventListener("resize", () => {
      if (topBarTooltipOwner === topBarTooltipIdleOwner && !canShowIdleTopBarTooltip()) {
        forceHideTopBarTooltip();
        return;
      }

      if (!topBarTooltipOwner || topBarTooltipOwner === topBarTooltipIdleOwner) {
        scheduleIdleTopBarTooltipRestore();
      }
    });
  });
})();
