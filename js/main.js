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
    socialHashtagLinks: document.querySelectorAll(".social-links__hashtag"),
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
    promoCarousel: document.querySelector("[data-promo-carousel]"),
    promoCarouselViewport: document.querySelector("[data-promo-carousel-viewport]"),
    promoCarouselTrack: document.querySelector("[data-promo-carousel-track]"),
    promoCarouselDots: document.querySelector("[data-promo-carousel-dots]"),
    promoCarouselPrev: document.querySelector("[data-promo-carousel-prev]"),
    promoCarouselNext: document.querySelector("[data-promo-carousel-next]"),
    scrollTopLinks: document.querySelectorAll("[data-scroll-top]"),
  };

  App.storageKeys = {
    theme: "komfi-theme",
    themePreset: "komfi-theme-preset",
    storyViewed: "komfi-story-viewed-signature-v2",
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
  let stickyHeaderMaskSyncFrame = 0;
  let stickyHeaderMaskSyncResizeTimeout = 0;
  let topBarTooltipOwner = "";
  let topBarTooltipStickyOwner = "";
  let topBarTooltipClickOwner = "";
  let topBarTooltipCleanupTimeout = 0;
  let topBarTooltipIdleRestoreTimeout = 0;
  let topBarTooltipSwapTimeout = 0;
  let topBarTooltipSwapFrame = 0;
  const topBarTooltipTransitionMs = 120;
  const topBarTooltipSwapOutMs = 90;
  const socialHandleTooltipHideDelayMs = 220;
  const socialHandleTooltipIdleRestoreDelayMs = 150;
  const topBarTooltipIdleOwner = "top-bar-idle";
  const topBarTooltipIdleDesktopText = "Welcome to Komfi Kat community!";
  const topBarTooltipIdleMobileText = "Welcome to Komfi Kat community!";
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
    return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  }

  function isTouchLikeDevice() {
    return !isDesktopPointerDevice();
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

  function syncStickyHeaderMaskGeometry() {
    const root = App.dom.root;
    const topBar = App.dom.topBar;

    if (!(root instanceof HTMLElement) || !(topBar instanceof HTMLElement)) {
      return;
    }

    const rect = topBar.getBoundingClientRect();

    if (rect.width <= 0 || rect.height <= 0) {
      return;
    }

    const halfHeight = rect.height / 2;

    root.style.setProperty("--sticky-header-mask-rect-height", `${rect.top + halfHeight}px`);
    root.style.setProperty("--sticky-header-mask-half-height", `${halfHeight}px`);
    root.style.setProperty("--sticky-header-mask-top", `${rect.top}px`);
    root.style.setProperty("--sticky-header-mask-left", `${rect.left}px`);
    root.style.setProperty("--sticky-header-mask-width", `${rect.width}px`);
    root.style.setProperty("--sticky-header-mask-translate-x", "0px");
  }

  function scheduleStickyHeaderMaskGeometrySync({ debounce = false } = {}) {
    window.cancelAnimationFrame(stickyHeaderMaskSyncFrame);
    window.clearTimeout(stickyHeaderMaskSyncResizeTimeout);

    const runSync = () => {
      stickyHeaderMaskSyncFrame = window.requestAnimationFrame(() => {
        syncStickyHeaderMaskGeometry();
      });
    };

    if (debounce) {
      stickyHeaderMaskSyncResizeTimeout = window.setTimeout(runSync, 180);
      return;
    }

    runSync();
  }

  function scrollPageToAbsoluteTop() {
    const scrollingElement = document.scrollingElement;
    const root = document.documentElement;
    const body = document.body;
    const previousRootScrollBehavior = root?.style.scrollBehavior || "";
    const previousBodyScrollBehavior = body?.style.scrollBehavior || "";
    let settleRestoreScheduled = false;
    const clearPageTopHash = () => {
      if (window.location.hash !== "#page-top") {
        return;
      }

      const cleanUrl = `${window.location.pathname}${window.location.search}`;
      window.history.replaceState(window.history.state, "", cleanUrl);
    };

    const restoreScrollBehavior = () => {
      if (settleRestoreScheduled) {
        return;
      }

      settleRestoreScheduled = true;

      window.setTimeout(() => {
        if (root) {
          root.style.scrollBehavior = previousRootScrollBehavior;
        }

        if (body) {
          body.style.scrollBehavior = previousBodyScrollBehavior;
        }
      }, 220);
    };

    const forceTop = () => {
      window.scrollTo(0, 0);

      if (scrollingElement) {
        scrollingElement.scrollTop = 0;
        scrollingElement.scrollLeft = 0;
      }
    };

    if (root) {
      root.style.scrollBehavior = "auto";
    }

    if (body) {
      body.style.scrollBehavior = "auto";
    }

    clearPageTopHash();
    forceTop();

    window.requestAnimationFrame(() => {
      forceTop();

      window.requestAnimationFrame(() => {
        clearPageTopHash();
        forceTop();

        promoViewportFitStableHeight = 0;
        promoViewportFitStableWidth = 0;
        schedulePromoCarouselViewportFitSync();
        restoreScrollBehavior();
      });
    });

    window.setTimeout(forceTop, 60);
    window.setTimeout(forceTop, 140);
    window.setTimeout(() => {
      clearPageTopHash();
      forceTop();
      promoViewportFitStableHeight = 0;
      promoViewportFitStableWidth = 0;
      schedulePromoCarouselViewportFitSync();
      restoreScrollBehavior();
    }, 220);
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
    return App.isPromoRedirectVisible?.() === true;
  }

  function canShowIdleTopBarTooltip() {
    return (
      !!App.dom.topBarTooltip &&
      App.dom.shareMenu?.dataset.shareMenuOpen !== "true" &&
      App.dom.shareMenu?.dataset.shareHintVisible !== "true" &&
      !isPromoRedirectToastVisible()
    );
  }

  function clearTopBarTooltipSwapState() {
    window.clearTimeout(topBarTooltipSwapTimeout);
    window.cancelAnimationFrame(topBarTooltipSwapFrame);
    topBarTooltipSwapTimeout = 0;
    topBarTooltipSwapFrame = 0;

    if (App.dom.topBarTooltip) {
      delete App.dom.topBarTooltip.dataset.swapState;
    }
  }

  function applyTopBarTooltipState(content, owner = "default", anchor = "center", options = {}, trigger = "hover") {
    if (!setTopBarTooltipContent(content)) {
      return false;
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
    scheduleStickyHeaderMaskGeometrySync();
    return true;
  }

  function showIdleTopBarTooltip() {
    if (!canShowIdleTopBarTooltip()) {
      return false;
    }

    const idleLabel = createTopBarTooltipLabel(getIdleTopBarTooltipText(), { variant: "welcome" });

    if (!(idleLabel instanceof HTMLElement) || !setTopBarTooltipContent(idleLabel)) {
      return false;
    }

    clearTopBarTooltipSwapState();
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

  function scheduleIdleTopBarTooltipRestore(delayMs = 0) {
    window.clearTimeout(topBarTooltipIdleRestoreTimeout);
    topBarTooltipIdleRestoreTimeout = window.setTimeout(() => {
      if (topBarTooltipSwapTimeout || App.dom.topBarTooltip?.dataset.swapState === "out") {
        return;
      }

      if (topBarTooltipOwner && topBarTooltipOwner !== topBarTooltipIdleOwner) {
        return;
      }

      showIdleTopBarTooltip();
    }, Math.max(0, delayMs));
  }

  function showTopBarTooltip(content, owner = "default", anchor = "center", options = {}) {
    const allowTouch = options.allowTouch === true;

    if (!App.dom.topBarTooltip || (!allowTouch && !isDesktopPointerDevice())) {
      return;
    }

    if (isPromoRedirectToastVisible()) {
      return;
    }

    window.clearTimeout(topBarTooltipIdleRestoreTimeout);
    clearTopBarTooltipSwapState();
    const trigger = options.trigger === "click" ? "click" : "hover";

    const shouldFadeBetweenOwners =
      App.dom.topBarTooltip.dataset.visible === "true" &&
      topBarTooltipOwner &&
      topBarTooltipOwner !== owner;

    if (shouldFadeBetweenOwners) {
      App.dom.topBarTooltip.dataset.swapState = "out";
      topBarTooltipSwapTimeout = window.setTimeout(() => {
        if (
          !App.dom.topBarTooltip ||
          !applyTopBarTooltipState(content, owner, anchor, options, trigger)
        ) {
          clearTopBarTooltipSwapState();
          return;
        }

        topBarTooltipSwapFrame = window.requestAnimationFrame(() => {
          if (!App.dom.topBarTooltip) {
            return;
          }

          delete App.dom.topBarTooltip.dataset.swapState;
        });
      }, topBarTooltipSwapOutMs);
      return;
    }

    applyTopBarTooltipState(content, owner, anchor, options, trigger);
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
      scheduleStickyHeaderMaskGeometrySync();
    }, topBarTooltipTransitionMs);
  }

  function forceHideTopBarTooltip() {
    if (!App.dom.topBarTooltip) {
      return;
    }

    clearTopBarTooltipSwapState();
    window.clearTimeout(topBarTooltipIdleRestoreTimeout);
    topBarTooltipOwner = "";
    topBarTooltipStickyOwner = "";
    topBarTooltipClickOwner = "";
    delete App.dom.topBarTooltip.dataset.visible;
    delete App.dom.topBarTooltip.dataset.interactive;
    scheduleTopBarTooltipCleanup();
    scheduleStickyHeaderMaskGeometrySync();
  }

  function dismissTopBarTooltipUntilNextStateChange() {
    if (!App.dom.topBarTooltip) {
      return;
    }

    clearTopBarTooltipSwapState();
    window.clearTimeout(topBarTooltipIdleRestoreTimeout);
    topBarTooltipOwner = "__dismissed__";
    topBarTooltipStickyOwner = "";
    topBarTooltipClickOwner = "";
    delete App.dom.topBarTooltip.dataset.visible;
    delete App.dom.topBarTooltip.dataset.interactive;
    scheduleTopBarTooltipCleanup();
    scheduleStickyHeaderMaskGeometrySync();
  }

  function hideTopBarTooltip(owner = "", options = {}) {
    if (!App.dom.topBarTooltip) {
      return;
    }

    if (owner && topBarTooltipOwner && topBarTooltipOwner !== owner) {
      return;
    }

    clearTopBarTooltipSwapState();
    window.clearTimeout(topBarTooltipIdleRestoreTimeout);
    topBarTooltipOwner = "";
    topBarTooltipStickyOwner = "";
    topBarTooltipClickOwner = "";
    delete App.dom.topBarTooltip.dataset.visible;
    delete App.dom.topBarTooltip.dataset.interactive;
    scheduleTopBarTooltipCleanup();
    scheduleIdleTopBarTooltipRestore(options.restoreIdleDelayMs);
    scheduleStickyHeaderMaskGeometrySync();
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
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {}
    }

    try {
      if (legacyCopyText(text)) {
        return true;
      }
    } catch {}

    return false;
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
    copyText,
    lockViewportGestureZoom,
    scheduleStickyHeaderMaskGeometrySync,
  };

  document.addEventListener("DOMContentLoaded", () => {
    let socialHandleTooltipHideTimeout = 0;
    const clearSocialHandleTooltipHideTimeout = () => {
      window.clearTimeout(socialHandleTooltipHideTimeout);
      socialHandleTooltipHideTimeout = 0;
    };
    const getSocialHandleLinkFromTarget = (target) =>
      target instanceof Element ? target.closest(".social-links__link[data-handle-label]") : null;
    const scheduleSocialHandleTooltipHide = (owner) => {
      clearSocialHandleTooltipHideTimeout();
      socialHandleTooltipHideTimeout = window.setTimeout(() => {
        socialHandleTooltipHideTimeout = 0;
        App.helpers.hideTopBarTooltip(owner, { restoreIdleDelayMs: socialHandleTooltipIdleRestoreDelayMs });
      }, socialHandleTooltipHideDelayMs);
    };

    App.dom.socialHandleLinks?.forEach((link, index) => {
      const tooltipText = link.dataset.handleLabel?.trim() || "";
      const tooltipOwner = `social-handle-${index}`;
      const createTooltipContent = () => {
        const icon = link.querySelector(".social-links__icon")?.cloneNode(true);
        const label = document.createElement("span");

        label.className = "top-bar__tooltip-label";
        label.classList.add("top-bar__tooltip-label--accent");
        label.textContent = tooltipText;

        if (!(icon instanceof SVGElement)) {
          return [label];
        }

        icon.classList.remove("social-links__icon");
        icon.classList.add("top-bar__tooltip-social-icon");
        icon.classList.add("top-bar__tooltip-social-icon--accent");
        icon.setAttribute("aria-hidden", "true");

        return [icon, label];
      };

      if (!tooltipText) {
        return;
      }

      link.addEventListener("mouseenter", () => {
        clearSocialHandleTooltipHideTimeout();
        App.helpers.showTopBarTooltip(createTooltipContent(), tooltipOwner, "center", { sticky: true });
      });

      link.addEventListener("mouseleave", (event) => {
        if (getSocialHandleLinkFromTarget(event.relatedTarget)) {
          return;
        }

        scheduleSocialHandleTooltipHide(tooltipOwner);
      });

      link.addEventListener("focus", () => {
        clearSocialHandleTooltipHideTimeout();
        App.helpers.showTopBarTooltip(createTooltipContent(), tooltipOwner, "center", { sticky: true });
      });

      link.addEventListener("blur", (event) => {
        if (getSocialHandleLinkFromTarget(event.relatedTarget)) {
          return;
        }

        scheduleSocialHandleTooltipHide(tooltipOwner);
      });
    });

    const createHashtagCopyFeedback = (link) => {
      const feedback = document.createElement("span");
      const content = document.createElement("span");
      const label = document.createElement("span");
      const platforms = document.createElement("span");
      const platformConfigs = [
        { key: "instagram", label: "Instagram", url: link.dataset.hashtagInstagramUrl?.trim() || "" },
        { key: "youtube", label: "YouTube", url: link.dataset.hashtagYoutubeUrl?.trim() || "" },
        { key: "tiktok", label: "TikTok", url: link.dataset.hashtagTiktokUrl?.trim() || "" },
      ];

      feedback.className = "social-links__hashtag-feedback";
      content.className = "social-links__hashtag-feedback-content";
      label.className = "social-links__hashtag-feedback-label";
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

      content.append(label, platforms);
      feedback.append(content);
      return feedback;
    };

    App.dom.socialHashtagLinks?.forEach((link, index) => {
      const tooltipOwner = `social-hashtag-${index}`;
      const hashtagItem = link.closest(".social-links__hashtag-item");
      const hashtagLabel = link.querySelector(".social-links__hashtag-label");
      const defaultHashtagLabel = hashtagLabel?.textContent?.trim() || "";
      const hashtagFeedback = createHashtagCopyFeedback(link);
      let hashtagFeedbackModeTimeout = 0;
      const hashtagFeedbackStageDelayMs = 720;
      const getHashtagCopyText = () => defaultHashtagLabel;
      const clearHashtagFeedbackModeTimeout = () => {
        window.clearTimeout(hashtagFeedbackModeTimeout);
        hashtagFeedbackModeTimeout = 0;
      };
      const isHashtagFeedbackPinned = () =>
        hashtagItem instanceof HTMLElement &&
        (hashtagItem.matches(":hover") || hashtagItem.contains(document.activeElement));
      const hideHashtagFeedback = () => {
        if (!(hashtagItem instanceof HTMLElement) || !hashtagFeedback) {
          return;
        }

        clearHashtagFeedbackModeTimeout();
        delete hashtagItem.dataset.feedbackVisible;
        delete hashtagItem.dataset.feedbackMode;
      };
      const setHashtagFeedbackVisible = (mode = "") => {
        if (!(hashtagItem instanceof HTMLElement) || !hashtagFeedback) {
          return;
        }

        clearHashtagFeedbackModeTimeout();
        hashtagItem.dataset.feedbackVisible = "true";

        if (mode) {
          hashtagItem.dataset.feedbackMode = mode;
        } else {
          delete hashtagItem.dataset.feedbackMode;
        }
      };
      const scheduleHashtagFeedbackLinksMode = () => {
        if (!(hashtagItem instanceof HTMLElement) || !hashtagFeedback) {
          return;
        }

        clearHashtagFeedbackModeTimeout();
        hashtagFeedbackModeTimeout = window.setTimeout(() => {
          if (!isHashtagFeedbackPinned()) {
            hideHashtagFeedback();
            return;
          }

          hashtagItem.dataset.feedbackVisible = "true";
          hashtagItem.dataset.feedbackMode = "links";
          hashtagFeedbackModeTimeout = 0;
        }, hashtagFeedbackStageDelayMs);
      };

      if (hashtagFeedback && hashtagItem instanceof HTMLElement) {
        hashtagItem.append(hashtagFeedback);

        hashtagFeedback.querySelectorAll(".social-links__hashtag-feedback-link").forEach((platformLink) => {
          platformLink.addEventListener("click", () => {
            hideHashtagFeedback();
          });
        });

        hashtagItem.addEventListener("mouseleave", () => {
          hideHashtagFeedback();
        });

        hashtagItem.addEventListener("focusout", (event) => {
          if (!(hashtagItem instanceof HTMLElement) || hashtagItem.contains(event.relatedTarget)) {
            return;
          }

          hideHashtagFeedback();
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
        setHashtagFeedbackVisible("copied");
        scheduleHashtagFeedbackLinksMode();
      });
    });

    App.dom.socialHandleLinks?.forEach((link) => {
      link.addEventListener("click", () => {
        clearSocialHandleTooltipHideTimeout();
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

    App.dom.scrollTopLinks?.forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        if (link instanceof HTMLElement) {
          link.blur();
        }
        if (document.activeElement instanceof HTMLElement && document.activeElement !== link) {
          document.activeElement.blur();
        }
        scrollPageToAbsoluteTop();
      });
    });

    App.helpers.lockViewportGestureZoom();

    App.initTheme?.();
    App.initShare?.();
    App.initStories?.();
    App.initCarousel?.();
    App.helpers.scheduleIdleTopBarTooltipRestore?.();
    scheduleStickyHeaderMaskGeometrySync();

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
    window.addEventListener("load", () => scheduleStickyHeaderMaskGeometrySync());
    window.addEventListener("resize", () => schedulePromoCarouselViewportFitSync({ debounce: true }));
    window.visualViewport?.addEventListener("resize", () => schedulePromoCarouselViewportFitSync({ debounce: true }));
    window.addEventListener("resize", () => scheduleStickyHeaderMaskGeometrySync({ debounce: true }));
    window.visualViewport?.addEventListener("resize", () => scheduleStickyHeaderMaskGeometrySync({ debounce: true }));
    window.addEventListener("orientationchange", () => {
      promoViewportFitStableHeight = 0;
      promoViewportFitStableWidth = 0;
      schedulePromoCarouselViewportFitSync();
      scheduleStickyHeaderMaskGeometrySync();
    });
    document.fonts?.ready.then(() => scheduleStickyHeaderMaskGeometrySync()).catch(() => {});
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
