(() => {
  const App = (window.KomfiKatApp = window.KomfiKatApp || {});

  // DOM references
  App.dom = {
    root: document.documentElement,
    body: document.body,
    themeToggle: document.querySelector("[data-theme-toggle]"),
    shareMenu: document.querySelector("[data-share-menu]"),
    shareRail: document.querySelector("[data-share-rail]"),
    shareRailHint: document.querySelector("[data-share-rail-hint]"),
    shareHoverBridge: document.querySelector(".share-rail__hover-bridge"),
    shareButton: document.querySelector("[data-share-page]"),
    shareCopyButton: document.querySelector('[data-share-option="copy"]'),
    shareOptions: document.querySelectorAll("[data-share-option]"),
    themeColorMeta: document.querySelector('meta[name="theme-color"]'),
    canonicalLink: document.querySelector('link[rel="canonical"]'),
    metaDescription: document.querySelector('meta[name="description"]'),
    storyTrigger: document.querySelector("[data-story-open]"),
    profileLogo: document.querySelector(".profile__logo"),
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
    promoCarousel: document.querySelector("[data-promo-carousel]"),
    promoCarouselViewport: document.querySelector("[data-promo-carousel-viewport]"),
    promoCarouselTrack: document.querySelector("[data-promo-carousel-track]"),
    promoCarouselDots: document.querySelector("[data-promo-carousel-dots]"),
    promoCarouselPrev: document.querySelector("[data-promo-carousel-prev]"),
    promoCarouselNext: document.querySelector("[data-promo-carousel-next]"),
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

  function isDesktopPointerDevice() {
    return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  }

  function isTouchLikeDevice() {
    return !isDesktopPointerDevice();
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

  async function copyText(text) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }

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

  App.helpers = {
    formatStoryDate,
    readStorageValue,
    writeStorageValue,
    isDesktopPointerDevice,
    isTouchLikeDevice,
    createShareHintText,
    createShareHintIcon,
    createShareHintStatusIcon,
    setShareHintContent,
    copyText,
  };

  document.addEventListener("DOMContentLoaded", () => {
    [App.dom.storyTrigger, App.dom.profileLogo].forEach((element) => {
      if (!element) {
        return;
      }

      element.addEventListener("dragstart", (event) => event.preventDefault());
      element.addEventListener("contextmenu", (event) => event.preventDefault());
    });

    App.initTheme?.();
    App.initShare?.();
    App.initStories?.();
    App.initCarousel?.();
  });
})();
