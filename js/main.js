const root = document.documentElement;
const body = document.body;
const themeToggle = document.querySelector("[data-theme-toggle]");
const shareButton = document.querySelector("[data-share-page]");
const themeColorMeta = document.querySelector('meta[name="theme-color"]');
const canonicalLink = document.querySelector('link[rel="canonical"]');
const metaDescription = document.querySelector('meta[name="description"]');
const storyTrigger = document.querySelector("[data-story-open]");
const storyViewer = document.querySelector("[data-story-viewer]");
const storyTitle = document.querySelector("[data-story-title]");
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
const storageKey = "komfi-theme";
const storyViewedKey = "komfi-story-viewed-signature";

// Recommended story artwork size: 1080 x 1350 px.
const stories = [
  {
    title: "New Cozy Peeks",
    meta: "Instagram Story",
    description: "Fresh little peeks at new coloring pages, cute scenes, and what Komfi Kat is making next.",
    ctaLabel: "Visit Instagram",
    url: "https://www.instagram.com/komfikat/",
    image: "img/stories/placeholder-white.svg",
    imageAlt: "White story placeholder",
    imageFit: "cover",
  },
];

const storySignature = JSON.stringify(
  stories.map(({ title, meta, description, ctaLabel, url, image, imageAlt, imageFit }) => ({
    title,
    meta,
    description,
    ctaLabel,
    url,
    image,
    imageAlt,
    imageFit: imageFit || "cover",
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

function updateStoryTriggerState() {
  if (!storyTrigger) {
    return;
  }

  const hasSeenStories = hasSeenCurrentStories();
  storyTrigger.style.setProperty("--story-trigger-count", String(Math.max(stories.length, 1)));
  storyTrigger.dataset.storyCount = String(stories.length);
  storyTrigger.dataset.storyState = hasSeenStories ? "viewed" : "new";
  storyTrigger.setAttribute(
    "aria-label",
    hasSeenStories ? "Rewatch Komfi Kat stories" : "Open Komfi Kat stories with new updates",
  );
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

  storyTitle.textContent = story.title;
  storyMeta.textContent = story.meta;
  storyDescription.textContent = story.description;
  storyImage.src = story.image;
  storyImage.alt = story.imageAlt;
  storyImage.style.objectFit = story.imageFit || "cover";

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
  shareButton.addEventListener("click", async () => {
    const shareUrl = canonicalLink?.href || window.location.href;
    const shareTitle = document.title;
    const shareText = metaDescription?.content || "Cozy hand-drawn coloring books by Komfi Kat.";

    if (shouldUseNativeShare()) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (error) {
        if (error?.name === "AbortError") {
          return;
        }
      }
    }

    const didCopy = await copyText(shareUrl);

    if (didCopy) {
      showShareCopiedState();
    }
  });
}

if (storyTrigger && storyViewer && stories.length) {
  updateStoryTriggerState();

  storyTrigger.addEventListener("click", () => {
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
