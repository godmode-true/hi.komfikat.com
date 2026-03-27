const root = document.documentElement;
const body = document.body;
const themeToggle = document.querySelector("[data-theme-toggle]");
const shareMenu = document.querySelector("[data-share-menu]");
const shareRail = document.querySelector("[data-share-rail]");
const shareRailHint = document.querySelector("[data-share-rail-hint]");
const shareHoverBridge = document.querySelector(".share-rail__hover-bridge");
const shareButton = document.querySelector("[data-share-page]");
const shareCopyButton = document.querySelector('[data-share-option="copy"]');
const shareOptions = document.querySelectorAll("[data-share-option]");
const themeColorMeta = document.querySelector('meta[name="theme-color"]');
const canonicalLink = document.querySelector('link[rel="canonical"]');
const metaDescription = document.querySelector('meta[name="description"]');
const storyTrigger = document.querySelector("[data-story-open]");
const storyViewer = document.querySelector("[data-story-viewer]");
const storyTitle = document.querySelector("[data-story-title]");
const storyEyebrow = document.querySelector("[data-story-eyebrow]");
const storyMeta = document.querySelector("[data-story-meta]");
const storyDescription = document.querySelector("[data-story-description]");
const storyImage = document.querySelector("[data-story-image]");
const storyFrame = document.querySelector("[data-story-frame]");
const storyProgress = document.querySelector("[data-story-progress]");
const storyCta = document.querySelector("[data-story-cta]");
const storyPrev = document.querySelector("[data-story-prev]");
const storyNext = document.querySelector("[data-story-next]");
const storyClose = document.querySelector("[data-story-close]");
const storyPlaybackToggle = document.querySelector("[data-story-toggle-playback]");
const storySurface = document.querySelector(".story-viewer__surface");
const storyMobileHint = document.querySelector(".profile__story-mobile-hint");
const storageKey = "komfi-theme";
const storyViewedKey = "komfi-story-viewed-signature-v2";

// Recommended story artwork size: 1080 x 1350 px.
// Story date format: "Mar 27, 2026" (US short month + day + year).
// Month abbreviations: Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec.
const stories = [
  {
    eyebrow: "Komfi Kat",
    title: "Mar 27, 2026",
    meta: "Instagram Story",
    description: "Fresh little peeks at new coloring pages, cute scenes, and what Komfi Kat is making next.",
    ctaLabel: "Visit Instagram",
    url: "https://www.instagram.com/komfikat/",
    image: "img/stories/placeholder-white.svg",
    imageAlt: "White story placeholder",
    imageFit: "cover",
    layout: "caption",
  },
  {
    eyebrow: "Komfi Kat",
    title: "Apr 3, 2026",
    meta: "",
    description: "",
    ctaLabel: "Open Reel on Instagram",
    url: "https://www.instagram.com/komfikat/",
    image: "img/stories/placeholder-white.svg",
    imageAlt: "White story placeholder",
    imageFit: "cover",
    layout: "full",
  },
  {
    eyebrow: "Komfi Kat",
    title: "Apr 3, 2026",
    meta: "",
    description: "",
    ctaLabel: "Open Reel on Instagram",
    url: "https://www.instagram.com/komfikat/",
    image: "img/stories/placeholder-white.svg",
    imageAlt: "White story placeholder",
    imageFit: "cover",
    layout: "full",
  },
  {
    eyebrow: "Komfi Kat",
    title: "Apr 3, 2026",
    meta: "",
    description: "",
    ctaLabel: "Open Reel on Instagram",
    url: "https://www.instagram.com/komfikat/",
    image: "img/stories/placeholder-white.svg",
    imageAlt: "White story placeholder",
    imageFit: "cover",
    layout: "full",
  },
];

const storySignature = JSON.stringify(
  stories.map(({ eyebrow, title, meta, description, ctaLabel, url, image, imageAlt, imageFit, layout }) => ({
    eyebrow,
    title,
    meta,
    description,
    ctaLabel,
    url,
    image,
    imageAlt,
    imageFit: imageFit || "cover",
    layout: layout || "caption",
  })),
);

let activeStoryIndex = 0;
let storyRafId = 0;
let storyStartedAt = 0;
let storyElapsedBeforePause = 0;
let isStoryPaused = false;
let isStoryHeld = false;
let isStoryManuallyPaused = false;
let sessionViewedStories = new Set();
const storyDuration = 4200;
const storyNavHoldDelay = 140;
let storyNavHoldTimer = 0;
let storyNavHoldTriggered = false;
let activeStoryNavTarget = null;
let shareTooltipTimeout = 0;
let shareRailHintTimeout = 0;
let shareHintSuppressed = false;
let storyHintCleanupTimeout = 0;

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

function shouldUseNativeShare() {
  if (typeof navigator.share !== "function") {
    return false;
  }

  return window.matchMedia("(hover: none), (pointer: coarse)").matches;
}

function shouldUseDesktopShareRail() {
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

function getSharePayload() {
  const url = canonicalLink?.href || window.location.href;
  const title = document.title;
  const text = metaDescription?.content || "Cozy hand-drawn coloring books by Komfi Kat.";

  return {
    url,
    title,
    text,
    message: `Take a cozy peek at Komfi Kat. ${text} ${url}`,
    emailBody: `Take a cozy peek at Komfi Kat.\n\n${text}\n\n${url}`,
  };
}

function isShareMenuOpen() {
  return shareMenu?.dataset.shareMenuOpen === "true";
}

function setShareRailHint(text = "Share with your friend 👉") {
  if (!shareRailHint || !shareMenu) {
    return;
  }

  if (text.endsWith("👉")) {
    const label = text.slice(0, -2).trim();
    shareRailHint.innerHTML = `<span class="share-rail__hint-text">${label}</span><span class="share-rail__hint-icon">👉</span>`;
  } else {
    shareRailHint.textContent = text;
  }

  shareMenu.dataset.shareHintVisible = "true";
}

function resetShareRailHint() {
  if (shareMenu) {
    delete shareMenu.dataset.shareHintVisible;
  }

  window.clearTimeout(shareRailHintTimeout);
}

function closeShareMenu() {
  if (!shareMenu || !shareButton) {
    return;
  }

  resetShareRailHint();
  delete shareMenu.dataset.shareMenuOpen;
  shareButton.setAttribute("aria-expanded", "false");
}

function openShareMenu() {
  if (!shareMenu || !shareButton) {
    return;
  }

  window.clearTimeout(shareTooltipTimeout);
  resetShareButtonState();
  delete shareMenu.dataset.shareTooltipSuppressed;
  delete shareMenu.dataset.shareHintVisible;
  shareMenu.dataset.shareMenuOpen = "true";
  shareButton.setAttribute("aria-expanded", "true");

  if (shareButton.matches(":hover, :focus-visible, :focus")) {
    setShareRailHint();
  }
}

function toggleShareMenu() {
  if (!shareMenu) {
    return;
  }

  if (isShareMenuOpen()) {
    shareHintSuppressed = true;
    shareMenu.dataset.shareTooltipSuppressed = "true";
    closeShareMenu();
    return;
  }

  shareHintSuppressed = false;
  openShareMenu();
}

function resetShareCopyState() {
  if (!shareCopyButton) {
    return;
  }
}

function showShareCopyButtonState() {
  if (!shareCopyButton || !shouldUseDesktopShareRail()) {
    return;
  }

  window.clearTimeout(shareRailHintTimeout);
  setShareRailHint("Link copied!");
  shareRailHintTimeout = window.setTimeout(() => {
    if (!isShareMenuOpen()) {
      return;
    }

    resetShareCopyState();
  }, 1800);
}

function resetShareButtonState() {
  if (!shareButton) {
    return;
  }

  shareButton.dataset.shareState = "";
  shareButton.setAttribute("data-tooltip", "Share with a friend");
  shareButton.setAttribute("aria-label", "Share");
}

function showShareCopiedState() {
  if (!shareButton) {
    return;
  }

  closeShareMenu();
  window.clearTimeout(shareTooltipTimeout);
  shareButton.dataset.shareState = "copied";
  shareButton.setAttribute("data-tooltip", "Link copied!");
  shareButton.setAttribute("aria-label", "Link copied!");
  shareTooltipTimeout = window.setTimeout(() => {
    resetShareButtonState();
  }, 1800);
}

function getSeenStorySignature() {
  try {
    return localStorage.getItem(storyViewedKey) || "";
  } catch {
    return "";
  }
}

function hasSeenCurrentStories() {
  return getSeenStorySignature() === storySignature;
}

function isTouchLikeDevice() {
  return window.matchMedia("(hover: none), (pointer: coarse)").matches;
}

function hideStoryHint() {
  if (!storyTrigger || !storyMobileHint) {
    return;
  }

  window.clearTimeout(storyHintCleanupTimeout);

  if (!storyMobileHint.dataset.storyHint) {
    return;
  }

  storyMobileHint.dataset.storyHint = "closing";
  storyHintCleanupTimeout = window.setTimeout(() => {
    delete storyMobileHint.dataset.storyHint;
  }, 220);
}

function showStoryHint() {
  if (!storyTrigger || !storyMobileHint || hasSeenCurrentStories() || !isTouchLikeDevice()) {
    return;
  }

  window.clearTimeout(storyHintCleanupTimeout);
  storyMobileHint.dataset.storyHint = "visible";
}

function updateStoryTriggerState() {
  if (!storyTrigger) {
    return;
  }

  const hasSeenStories = hasSeenCurrentStories();
  storyTrigger.dataset.storyState = hasSeenStories ? "viewed" : "new";
  storyTrigger.setAttribute(
    "aria-label",
    hasSeenStories ? "Rewatch Komfi Kat stories" : "Open Komfi Kat stories with new updates",
  );

  if (hasSeenStories) {
    hideStoryHint();
  }
}

function markCurrentStoriesSeen() {
  try {
    localStorage.setItem(storyViewedKey, storySignature);
  } catch {}

  updateStoryTriggerState();
}

function updateThemeColor() {
  if (!themeColorMeta) {
    return;
  }

  const pageBg = getComputedStyle(root).getPropertyValue("--page-bg").trim();
  if (pageBg) {
    themeColorMeta.setAttribute("content", pageBg);
  }
}

function setTheme(theme) {
  root.dataset.theme = theme;
  try {
    localStorage.setItem(storageKey, theme);
  } catch {}

  if (themeToggle) {
    const isDark = theme === "dark";
    const tooltipText = isDark ? "Switch to light mode" : "Switch to dark mode";
    themeToggle.setAttribute("aria-pressed", String(isDark));
    themeToggle.setAttribute("aria-label", tooltipText);
    themeToggle.setAttribute("data-tooltip", tooltipText);
  }

  updateThemeColor();
}

function ensureProgressSegments() {
  if (!storyProgress) {
    return [];
  }

  storyProgress.innerHTML = "";
  storyProgress.style.setProperty("--story-count", String(stories.length));

  return stories.map(() => {
    const segment = document.createElement("span");
    segment.className = "story-viewer__progress-segment";
    storyProgress.append(segment);
    return segment;
  });
}

const progressSegments = ensureProgressSegments();

function syncStoryProgress(currentProgress = 0) {
  progressSegments.forEach((segment, index) => {
    segment.classList.toggle("is-complete", index < activeStoryIndex);

    if (index === activeStoryIndex) {
      segment.style.setProperty("--story-progress", String(currentProgress));
    } else {
      segment.style.setProperty("--story-progress", index < activeStoryIndex ? "1" : "0");
    }
  });
}

function renderStory(index) {
  const story = stories[index];

  if (!story || !storyTitle || !storyMeta || !storyDescription || !storyImage || !storyFrame || !storyCta) {
    return;
  }

  activeStoryIndex = index;
  sessionViewedStories.add(index);

  if (storyEyebrow) {
    storyEyebrow.textContent = story.eyebrow || "Komfi Kat";
  }

  storyTitle.textContent = story.title;
  storyMeta.textContent = story.meta;
  storyDescription.textContent = story.description;
  storyImage.src = story.image;
  storyImage.alt = story.imageAlt;
  storyImage.style.objectFit = story.imageFit || "cover";
  storySurface?.setAttribute("data-story-layout", story.layout || "caption");
  storyMeta.parentElement.hidden = (story.layout || "caption") === "full";

  if (story.url) {
    storyCta.hidden = false;
    storyCta.textContent = story.ctaLabel;
  } else {
    storyCta.hidden = true;
  }

  if (storyPrev) {
    storyPrev.disabled = index === 0;
  }

  syncStoryProgress(0);
}

function stopStoryTimer() {
  if (storyRafId) {
    cancelAnimationFrame(storyRafId);
    storyRafId = 0;
  }
}

function pauseStoryTimer() {
  if (isStoryPaused || !storyViewer?.open) {
    return;
  }

  isStoryPaused = true;
  storyElapsedBeforePause += performance.now() - storyStartedAt;
  stopStoryTimer();
}

function resumeStoryTimer() {
  if (!isStoryPaused || !storyViewer?.open || isStoryHeld || isStoryManuallyPaused) {
    return;
  }

  isStoryPaused = false;
  startStoryTimer();
}

function beginHeldPause() {
  isStoryHeld = true;
  pauseStoryTimer();
}

function endHeldPause() {
  isStoryHeld = false;
  resumeStoryTimer();
}

function clearStoryNavHoldTimer() {
  if (storyNavHoldTimer) {
    window.clearTimeout(storyNavHoldTimer);
    storyNavHoldTimer = 0;
  }
}

function syncPlaybackToggle() {
  if (!storyPlaybackToggle) {
    return;
  }

  const isPaused = isStoryManuallyPaused;
  storyPlaybackToggle.setAttribute("aria-pressed", String(isPaused));
  storyPlaybackToggle.setAttribute("aria-label", isPaused ? "Play stories" : "Pause stories");
}

function finalizeStorySession() {
  if (sessionViewedStories.size === stories.length && stories.length > 0) {
    markCurrentStoriesSeen();
  }
}

function resetStorySessionState() {
  clearStoryNavHoldTimer();
  storyNavHoldTriggered = false;
  activeStoryNavTarget = null;
  stopStoryTimer();
  isStoryPaused = false;
  isStoryHeld = false;
  isStoryManuallyPaused = false;
  storyElapsedBeforePause = 0;
  syncPlaybackToggle();
  body.classList.remove("story-viewer-is-open");
}

function closeStories() {
  finalizeStorySession();
  resetStorySessionState();

  if (storyViewer?.open) {
    storyViewer.close();
  }
}

function goToStory(index) {
  if (!stories.length) {
    return;
  }

  const boundedIndex = Math.min(Math.max(index, 0), stories.length - 1);
  storyElapsedBeforePause = 0;
  isStoryPaused = false;
  isStoryHeld = false;
  isStoryManuallyPaused = false;
  syncPlaybackToggle();
  renderStory(boundedIndex);
  startStoryTimer();
}

function goToNextStory() {
  if (activeStoryIndex >= stories.length - 1) {
    closeStories();
    return;
  }

  goToStory(activeStoryIndex + 1);
}

function goToPreviousStory() {
  if (activeStoryIndex <= 0) {
    goToStory(0);
    return;
  }

  goToStory(activeStoryIndex - 1);
}

function startStoryTimer() {
  stopStoryTimer();
  storyStartedAt = performance.now();

  const tick = (timestamp) => {
    const elapsed = storyElapsedBeforePause + (timestamp - storyStartedAt);
    const progress = Math.min(elapsed / storyDuration, 1);

    syncStoryProgress(progress);

    if (progress >= 1) {
      goToNextStory();
      return;
    }

    storyRafId = requestAnimationFrame(tick);
  };

  storyRafId = requestAnimationFrame(tick);
}

function openStories(startIndex = 0) {
  if (!storyViewer || !stories.length || typeof storyViewer.showModal !== "function") {
    return;
  }

  sessionViewedStories = new Set();
  storyElapsedBeforePause = 0;
  isStoryPaused = false;
  isStoryHeld = false;
  isStoryManuallyPaused = false;
  syncPlaybackToggle();
  renderStory(startIndex);
  body.classList.add("story-viewer-is-open");
  storyViewer.showModal();
  startStoryTimer();
}

if (themeToggle) {
  let savedTheme = "light";
  try {
    savedTheme = localStorage.getItem(storageKey) || "light";
  } catch {}
  setTheme(savedTheme === "dark" ? "dark" : "light");

  themeToggle.addEventListener("click", () => {
    const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  });
} else {
  updateThemeColor();
}

if (shareButton) {
  shareButton.addEventListener("click", async (event) => {
    if (shouldUseDesktopShareRail()) {
      event.preventDefault();
      toggleShareMenu();
      return;
    }

    const sharePayload = getSharePayload();

    if (shouldUseNativeShare()) {
      try {
        await navigator.share({
          title: sharePayload.title,
          text: sharePayload.text,
          url: sharePayload.url,
        });
        return;
      } catch (error) {
        if (error?.name === "AbortError") {
          return;
        }
      }
    }

    const didCopy = await copyText(sharePayload.url);

    if (didCopy) {
      showShareCopiedState();
    }
  });
}

if (shareOptions.length) {
  shareOptions.forEach((shareOption) => {
    const optionHint = shareOption.dataset.shareHint || "Share with your friend 👉";

    shareOption.addEventListener("mouseenter", () => {
      if (!shouldUseDesktopShareRail() || !isShareMenuOpen()) {
        return;
      }

      window.clearTimeout(shareRailHintTimeout);
      setShareRailHint(optionHint);
    });

    shareOption.addEventListener("mouseleave", (event) => {
      if (!shouldUseDesktopShareRail() || !isShareMenuOpen()) {
        return;
      }

      const nextTarget = event.relatedTarget;

      if (nextTarget && shareRail?.contains(nextTarget)) {
        return;
      }

      if (
        nextTarget &&
        ((shareButton && shareButton.contains(nextTarget)) ||
          (shareHoverBridge && shareHoverBridge.contains(nextTarget)))
      ) {
        if (shareButton && shareButton.matches(":hover, :focus-visible, :focus")) {
          setShareRailHint();
        } else {
          resetShareRailHint();
        }
        return;
      }

      if (nextTarget && shareMenu?.contains(nextTarget)) {
        return;
      }

      resetShareRailHint();
    });

    shareOption.addEventListener("focus", () => {
      if (!shouldUseDesktopShareRail() || !isShareMenuOpen()) {
        return;
      }

      window.clearTimeout(shareRailHintTimeout);
      setShareRailHint(optionHint);
    });

    shareOption.addEventListener("blur", (event) => {
      if (!shouldUseDesktopShareRail() || !isShareMenuOpen()) {
        return;
      }

      const nextTarget = event.relatedTarget;

      if (nextTarget && shareRail?.contains(nextTarget)) {
        return;
      }

      if (
        nextTarget &&
        ((shareButton && shareButton.contains(nextTarget)) ||
          (shareHoverBridge && shareHoverBridge.contains(nextTarget)))
      ) {
        if (shareButton && shareButton.matches(":hover, :focus-visible, :focus")) {
          setShareRailHint();
        } else {
          resetShareRailHint();
        }
        return;
      }

      if (nextTarget && shareMenu?.contains(nextTarget)) {
        return;
      }

      resetShareRailHint();
    });

    shareOption.addEventListener("click", async () => {
      const sharePayload = getSharePayload();
      const option = shareOption.dataset.shareOption;

      if (option === "copy") {
        const didCopy = await copyText(sharePayload.url);

        if (didCopy) {
          showShareCopyButtonState();
        }
        return;
      }

      closeShareMenu();

      if (option === "whatsapp") {
        window.open(`https://wa.me/?text=${encodeURIComponent(sharePayload.message)}`, "_blank", "noopener,noreferrer");
        return;
      }

      if (option === "facebook") {
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(sharePayload.url)}`,
          "_blank",
          "noopener,noreferrer",
        );
        return;
      }

      if (option === "email") {
        window.location.href = `mailto:?subject=${encodeURIComponent(sharePayload.title)}&body=${encodeURIComponent(sharePayload.emailBody)}`;
      }
    });
  });
}

if (shareMenu && shareRail) {
  if (shareButton) {
    shareButton.addEventListener("mouseenter", () => {
      if (shouldUseDesktopShareRail() && isShareMenuOpen() && !shareHintSuppressed) {
        setShareRailHint();
      }
    });

    shareButton.addEventListener("focus", () => {
      if (shouldUseDesktopShareRail() && isShareMenuOpen() && !shareHintSuppressed) {
        setShareRailHint();
      }
    });

    shareButton.addEventListener("mouseleave", () => {
      shareHintSuppressed = false;
      delete shareMenu.dataset.shareTooltipSuppressed;
      if (shouldUseDesktopShareRail() && isShareMenuOpen()) {
        resetShareRailHint();
      }
    });

    shareButton.addEventListener("blur", () => {
      shareHintSuppressed = false;
      delete shareMenu.dataset.shareTooltipSuppressed;
      if (shouldUseDesktopShareRail() && isShareMenuOpen()) {
        resetShareRailHint();
      }
    });
  }

  shareMenu.addEventListener("mouseenter", () => {
    if (shouldUseDesktopShareRail()) {
      openShareMenu();
    }
  });

  shareMenu.addEventListener("mouseleave", () => {
    if (shouldUseDesktopShareRail()) {
      closeShareMenu();
    }
  });

  shareMenu.addEventListener("focusin", () => {
    if (shouldUseDesktopShareRail()) {
      openShareMenu();
    }
  });

  shareMenu.addEventListener("focusout", (event) => {
    if (!shouldUseDesktopShareRail() || shareMenu.contains(event.relatedTarget)) {
      return;
    }

    closeShareMenu();
  });

  document.addEventListener("pointerdown", (event) => {
    if (!isShareMenuOpen() || shareMenu.contains(event.target)) {
      return;
    }

    closeShareMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isShareMenuOpen()) {
      closeShareMenu();
    }
  });

  window.addEventListener("resize", () => {
    if (!shouldUseDesktopShareRail()) {
      closeShareMenu();
    }
  });
}

if (themeToggle) {
  themeToggle.addEventListener("mouseenter", () => {
    if (shouldUseDesktopShareRail()) {
      closeShareMenu();
    }
  });

  themeToggle.addEventListener("focusin", () => {
    if (shouldUseDesktopShareRail()) {
      closeShareMenu();
    }
  });
}

if (storyTrigger && storyViewer && stories.length) {
  updateStoryTriggerState();
  window.setTimeout(() => {
    showStoryHint();
  }, 420);

  storyTrigger.addEventListener("click", () => {
    hideStoryHint();
    openStories(0);
  });

  const handleStoryNavPointerDown = (event, direction) => {
    if (!storyViewer.open) {
      return;
    }

    clearStoryNavHoldTimer();
    storyNavHoldTriggered = false;
    activeStoryNavTarget = direction;

    event.currentTarget?.setPointerCapture?.(event.pointerId);

    storyNavHoldTimer = window.setTimeout(() => {
      storyNavHoldTriggered = true;
      beginHeldPause();
    }, storyNavHoldDelay);
  };

  const handleStoryNavPointerEnd = (direction) => {
    if (activeStoryNavTarget !== direction) {
      return;
    }

    clearStoryNavHoldTimer();

    if (storyNavHoldTriggered) {
      storyNavHoldTriggered = false;
      activeStoryNavTarget = null;
      endHeldPause();
      return;
    }

    activeStoryNavTarget = null;

    if (direction === "prev") {
      goToPreviousStory();
    } else {
      goToNextStory();
    }
  };

  const handleStoryNavPointerCancel = (direction) => {
    if (activeStoryNavTarget !== direction) {
      return;
    }

    clearStoryNavHoldTimer();

    if (storyNavHoldTriggered) {
      storyNavHoldTriggered = false;
      endHeldPause();
    }

    activeStoryNavTarget = null;
  };

  storyPrev?.addEventListener("pointerdown", (event) => {
    handleStoryNavPointerDown(event, "prev");
  });

  storyPrev?.addEventListener("pointerup", () => {
    handleStoryNavPointerEnd("prev");
  });

  storyPrev?.addEventListener("pointercancel", () => {
    handleStoryNavPointerCancel("prev");
  });

  storyPrev?.addEventListener("click", (event) => {
    if (event.detail !== 0) {
      event.preventDefault();
    } else {
      goToPreviousStory();
    }
  });

  storyNext?.addEventListener("pointerdown", (event) => {
    handleStoryNavPointerDown(event, "next");
  });

  storyNext?.addEventListener("pointerup", () => {
    handleStoryNavPointerEnd("next");
  });

  storyNext?.addEventListener("pointercancel", () => {
    handleStoryNavPointerCancel("next");
  });

  storyNext?.addEventListener("click", (event) => {
    if (event.detail !== 0) {
      event.preventDefault();
    } else {
      goToNextStory();
    }
  });

  storyClose?.addEventListener("click", () => {
    closeStories();
  });

  storyViewer.addEventListener("close", () => {
    finalizeStorySession();
    resetStorySessionState();
  });

  storyViewer.addEventListener("cancel", () => {
    finalizeStorySession();
    resetStorySessionState();
  });

  storyViewer.addEventListener("click", (event) => {
    if (event.target === storyViewer) {
      closeStories();
    }
  });

  storyViewer.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      goToNextStory();
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goToPreviousStory();
    }
  });

  storyCta?.addEventListener("click", () => {
    const story = stories[activeStoryIndex];
    if (!story?.url) {
      return;
    }

    window.open(story.url, "_blank", "noopener,noreferrer");
  });

  storyPlaybackToggle?.addEventListener("click", () => {
    isStoryManuallyPaused = !isStoryManuallyPaused;
    syncPlaybackToggle();

    if (isStoryManuallyPaused) {
      pauseStoryTimer();
    } else {
      resumeStoryTimer();
    }
  });

  const handlePressStart = (event) => {
    if (!storyViewer.open) {
      return;
    }

    if (
      event.target instanceof Element &&
      event.target.closest(
        "[data-story-prev], [data-story-next], [data-story-close], [data-story-cta], [data-story-toggle-playback]",
      )
    ) {
      return;
    }

    beginHeldPause();
  };

  const handlePressEnd = () => {
    endHeldPause();
  };

  storySurface?.addEventListener("pointerdown", handlePressStart);
  window.addEventListener("pointerup", handlePressEnd);
  window.addEventListener("pointercancel", handlePressEnd);
  window.addEventListener("blur", handlePressEnd);
}
