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
    promoRedirectCountdown: document.querySelector("[data-promo-redirect-countdown]"),
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
  let topBarTooltipOwner = "";
  let topBarTooltipCleanupTimeout = 0;
  const topBarTooltipTransitionMs = 180;

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

    if (viewportWidth > 1024) {
      return;
    }

    const viewportHeight = window.visualViewport?.height || window.innerHeight || 0;
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

  function schedulePromoCarouselViewportFitSync() {
    window.cancelAnimationFrame(promoViewportFitFrame);
    promoViewportFitFrame = window.requestAnimationFrame(() => {
      syncPromoCarouselViewportFit();
    });
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

  function setTopBarTooltipContent(content) {
    if (!App.dom.topBarTooltip) {
      return false;
    }

    if (typeof content === "string") {
      const normalizedText = content.trim();
      const label = document.createElement("span");

      if (!normalizedText) {
        return false;
      }

      label.className = "top-bar__tooltip-label";
      label.textContent = normalizedText;
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

  function showTopBarTooltip(content, owner = "default", anchor = "center") {
    if (!App.dom.topBarTooltip || !isDesktopPointerDevice()) {
      return;
    }

    if (!setTopBarTooltipContent(content)) {
      return;
    }

    dismissStickyMenuPrompts("top-bar-tooltip");
    window.clearTimeout(topBarTooltipCleanupTimeout);
    topBarTooltipOwner = owner;
    App.dom.topBarTooltip.dataset.anchor = anchor;
    App.dom.topBarTooltip.dataset.visible = "true";
  }

  function scheduleTopBarTooltipCleanup() {
    window.clearTimeout(topBarTooltipCleanupTimeout);
    topBarTooltipCleanupTimeout = window.setTimeout(() => {
      if (App.dom.topBarTooltip?.dataset.visible === "true") {
        return;
      }

      delete App.dom.topBarTooltip.dataset.anchor;
      App.dom.topBarTooltip.replaceChildren();
    }, topBarTooltipTransitionMs);
  }

  function forceHideTopBarTooltip() {
    if (!App.dom.topBarTooltip) {
      return;
    }

    topBarTooltipOwner = "";
    delete App.dom.topBarTooltip.dataset.visible;
    scheduleTopBarTooltipCleanup();
  }

  function hideTopBarTooltip(owner = "") {
    if (!App.dom.topBarTooltip) {
      return;
    }

    if (owner && topBarTooltipOwner && topBarTooltipOwner !== owner) {
      return;
    }

    topBarTooltipOwner = "";
    delete App.dom.topBarTooltip.dataset.visible;
    scheduleTopBarTooltipCleanup();
  }

  function dismissStickyMenuPrompts(except = "") {
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

  const promoRedirectToastDefaultText = App.dom.promoRedirectToast?.querySelector(".promo-redirect-toast__text")?.innerHTML || "";

  function setPromoRedirectToastContent({ mode = "redirect", message = "", success = false } = {}) {
    if (!App.dom.promoRedirectToast) {
      return;
    }

    const textElement = App.dom.promoRedirectToast.querySelector(".promo-redirect-toast__text");

    if (!textElement) {
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

      textElement.replaceChildren(...nodes);
      App.dom.promoRedirectCountdown = App.dom.promoRedirectToast.querySelector("[data-promo-redirect-countdown]");

      if (App.dom.promoRedirectCancel) {
        App.dom.promoRedirectCancel.hidden = true;
      }

      App.dom.promoRedirectToast.dataset.mode = "feedback";
      return;
    }

    textElement.innerHTML = promoRedirectToastDefaultText;
    App.dom.promoRedirectCountdown = App.dom.promoRedirectToast.querySelector("[data-promo-redirect-countdown]");

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
    setPromoRedirectToastContent,
    copyText,
    lockViewportGestureZoom,
  };

  document.addEventListener("DOMContentLoaded", () => {
    const promoRedirectToastDesktopHost = App.dom.shareMenu || null;
    const promoRedirectToastDesktopAnchor = App.dom.shareHoverBridge || null;
    const promoRedirectToastMobileHost = App.dom.topBar || null;
    const shouldCenterPromoToastInStickyBar = () => true;

    const syncPromoRedirectToastHost = () => {
      if (!App.dom.promoRedirectToast) {
        return;
      }

      const targetHost = shouldCenterPromoToastInStickyBar() ? promoRedirectToastMobileHost : promoRedirectToastDesktopHost;

      if (!targetHost || App.dom.promoRedirectToast.parentElement === targetHost) {
        return;
      }

      if (targetHost === promoRedirectToastDesktopHost) {
        targetHost.insertBefore(
          App.dom.promoRedirectToast,
          promoRedirectToastDesktopAnchor && promoRedirectToastDesktopAnchor.parentElement === targetHost
            ? promoRedirectToastDesktopAnchor
            : null,
        );
        return;
      }

      targetHost.append(App.dom.promoRedirectToast);
    };

    syncPromoRedirectToastHost();
    window.addEventListener("resize", syncPromoRedirectToastHost);

    if (
      App.dom.shareMenu &&
      App.dom.storyDesktopHint &&
      App.dom.storyDesktopHint.parentElement !== App.dom.shareMenu
    ) {
      App.dom.shareMenu.insertBefore(
        App.dom.storyDesktopHint,
        App.dom.shareHoverBridge && App.dom.shareHoverBridge.parentElement === App.dom.shareMenu
          ? App.dom.shareHoverBridge
          : App.dom.shareButton || null,
      );
    }

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
        App.helpers.showTopBarTooltip(createTooltipContent(), tooltipOwner);
      });

      link.addEventListener("mouseleave", () => {
        App.helpers.hideTopBarTooltip(tooltipOwner);
      });

      link.addEventListener("focus", () => {
        App.helpers.showTopBarTooltip(createTooltipContent(), tooltipOwner);
      });

      link.addEventListener("blur", () => {
        App.helpers.hideTopBarTooltip(tooltipOwner);
      });
    });

    App.dom.socialHashtagLinks?.forEach((link, index) => {
      const tooltipText = link.dataset.hashtagTooltip?.trim() || "";
      const tooltipOwner = `social-hashtag-${index}`;

      if (!tooltipText) {
        return;
      }

      link.addEventListener("mouseenter", () => {
        App.helpers.showTopBarTooltip(tooltipText, tooltipOwner);
      });

      link.addEventListener("mouseleave", () => {
        App.helpers.hideTopBarTooltip(tooltipOwner);
      });

      link.addEventListener("focus", () => {
        App.helpers.showTopBarTooltip(tooltipText, tooltipOwner);
      });

      link.addEventListener("blur", () => {
        App.helpers.hideTopBarTooltip(tooltipOwner);
      });
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

    if (App.dom.profileTitle) {
      const profileTitleTooltip = "Click to visit home page";

      App.dom.profileTitle.addEventListener("mouseenter", () => {
        App.helpers.showTopBarTooltip(profileTitleTooltip, "profile-title");
      });

      App.dom.profileTitle.addEventListener("mouseleave", () => {
        App.helpers.hideTopBarTooltip("profile-title");
      });

      App.dom.profileTitle.addEventListener("focus", () => {
        App.helpers.showTopBarTooltip(profileTitleTooltip, "profile-title");
      });

      App.dom.profileTitle.addEventListener("blur", () => {
        App.helpers.hideTopBarTooltip("profile-title");
      });
    }

    App.helpers.lockViewportGestureZoom();

    App.initTheme?.();
    App.initShare?.();
    App.initStories?.();
    App.initCarousel?.();

    schedulePromoCarouselViewportFitSync();
    window.addEventListener("resize", schedulePromoCarouselViewportFitSync);
    window.visualViewport?.addEventListener("resize", schedulePromoCarouselViewportFitSync);
  });
})();
