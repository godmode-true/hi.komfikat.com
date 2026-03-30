(() => {
  const App = window.KomfiKatApp;

  if (!App) {
    return;
  }

  const { dom, helpers, storageKeys } = App;

  const storyTimings = {
    duration: 4200,
    navHoldDelay: 140,
  };

  // Recommended story artwork size: 1080 x 1350 px.
  // For raster story art, drop PNG/JPG files into img/stories and run .\scripts\update-site-images.ps1.
  // That script will generate smaller WebP versions automatically; story entries themselves live in #komfi-story-data in index.html.
  // Use publishedAt in ISO format: "2026-03-27".
  // It will render as: "Mar 27, 2026".
  // Month abbreviations: Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec.
  const storyDataElement = document.getElementById("komfi-story-data");
  const stories = (() => {
    try {
      const parsedStories = JSON.parse(storyDataElement?.textContent || "[]");
      return Array.isArray(parsedStories) ? parsedStories : [];
    } catch {
      return [];
    }
  })();

  const storySignature = JSON.stringify(
    stories.map(({ eyebrow, publishedAt, meta, description, ctaLabel, url, image, imageAlt, imageFit, layout }) => ({
      eyebrow,
      publishedAt,
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
  let storyNavHoldTimer = 0;
  let storyNavHoldTriggered = false;
  let activeStoryNavTarget = null;
  let storyHintCleanupTimeout = 0;
  let storyHintShowTimeout = 0;
  let storyCloseTimeout = 0;

  function showDesktopStoryHint() {
    if (
      !helpers.isDesktopPointerDevice() ||
      dom.storyTrigger?.dataset.storyState !== "new"
    ) {
      return;
    }

    const storyHintText = dom.storyDesktopHint?.textContent?.trim() || "Click to see new Komfi Kat stories!";
    helpers.showTopBarTooltip(storyHintText, "story-hint");
  }

  function hideDesktopStoryHint() {
    helpers.hideTopBarTooltip("story-hint");
  }

  function getSeenStorySignature() {
    return helpers.readStorageValue(storageKeys.storyViewed);
  }

  function getDismissedStoryHintSignature() {
    return helpers.readStorageValue(storageKeys.storyHintDismissed);
  }

  function hasSeenCurrentStories() {
    return getSeenStorySignature() === storySignature;
  }

  function hasDismissedCurrentStoryHint() {
    return getDismissedStoryHintSignature() === storySignature;
  }

  function hideStoryHint() {
    if (!dom.storyTrigger || !dom.storyMobileHint) {
      return;
    }

    window.clearTimeout(storyHintShowTimeout);
    window.clearTimeout(storyHintCleanupTimeout);

    if (!dom.storyMobileHint.dataset.storyHint) {
      return;
    }

    dom.storyMobileHint.dataset.storyHint = "closing";
    storyHintCleanupTimeout = window.setTimeout(() => {
      delete dom.storyMobileHint.dataset.storyHint;
    }, 220);
  }

  function showStoryHint() {
    if (
      !dom.storyTrigger ||
      !dom.storyMobileHint ||
      hasSeenCurrentStories() ||
      hasDismissedCurrentStoryHint() ||
      !helpers.isTouchLikeDevice()
    ) {
      return;
    }

    window.clearTimeout(storyHintCleanupTimeout);
    window.clearTimeout(storyHintShowTimeout);
    storyHintShowTimeout = window.setTimeout(() => {
      dom.storyMobileHint.dataset.storyHint = "visible";
    }, 200);
  }

  function dismissCurrentStoryHint() {
    helpers.writeStorageValue(storageKeys.storyHintDismissed, storySignature);
    updateStoryTriggerState();
  }

  function updateStoryTriggerState() {
    if (!dom.storyTrigger) {
      return;
    }

    const hasSeenStories = hasSeenCurrentStories();
    const hasDismissedHint = hasDismissedCurrentStoryHint();
    dom.storyTrigger.dataset.storyState = hasSeenStories ? "viewed" : "new";
    dom.storyTrigger.dataset.storyHintState = hasDismissedHint ? "dismissed" : "visible";
    dom.storyTrigger.setAttribute(
      "aria-label",
      hasSeenStories ? "Rewatch Komfi Kat stories" : "Open Komfi Kat stories with new updates",
    );
    dom.root.dataset.storyHintLayout = "collapsed";

    if (dom.storyDesktopHint) {
      dom.storyDesktopHint.dataset.storyHintState = hasSeenStories ? "hidden" : "visible";
    }

    if (hasSeenStories || hasDismissedHint) {
      hideStoryHint();
      hideDesktopStoryHint();
    }
  }

  function markCurrentStoriesSeen() {
    helpers.writeStorageValue(storageKeys.storyViewed, storySignature);
    updateStoryTriggerState();
  }

  function ensureProgressSegments() {
    if (!dom.storyProgress) {
      return [];
    }

    dom.storyProgress.replaceChildren();
    dom.storyProgress.style.setProperty("--story-count", String(stories.length));

    return stories.map(() => {
      const segment = document.createElement("span");
      segment.className = "story-viewer__progress-segment";
      dom.storyProgress.append(segment);
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

    if (!story || !dom.storyTitle || !dom.storyMeta || !dom.storyDescription || !dom.storyImage || !dom.storyCta) {
      return;
    }

    activeStoryIndex = index;
    sessionViewedStories.add(index);

    if (dom.storyEyebrow) {
      dom.storyEyebrow.textContent = story.eyebrow || "Komfi Kat";
    }

    dom.storyTitle.textContent = helpers.formatStoryDate(story.publishedAt);
    dom.storyMeta.textContent = story.meta;
    dom.storyDescription.textContent = story.description;
    dom.storyImage.src = story.image;
    dom.storyImage.alt = story.imageAlt;
    dom.storyImage.style.objectFit = story.imageFit || "cover";
    dom.storySurface?.setAttribute("data-story-layout", story.layout || "caption");
    dom.storyMeta.parentElement.hidden = (story.layout || "caption") === "full";

    if (story.url) {
      dom.storyCta.hidden = false;
      dom.storyCta.textContent = story.ctaLabel;
    } else {
      dom.storyCta.hidden = true;
    }

    if (dom.storyPrev) {
      dom.storyPrev.disabled = index === 0;
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
    if (isStoryPaused || !dom.storyViewer?.open) {
      return;
    }

    isStoryPaused = true;
    storyElapsedBeforePause += performance.now() - storyStartedAt;
    stopStoryTimer();
  }

  function resumeStoryTimer() {
    if (!isStoryPaused || !dom.storyViewer?.open || isStoryHeld || isStoryManuallyPaused) {
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
    if (!dom.storyPlaybackToggle) {
      return;
    }

    const isPaused = isStoryManuallyPaused;
    dom.storyPlaybackToggle.setAttribute("aria-pressed", String(isPaused));
    dom.storyPlaybackToggle.setAttribute("aria-label", isPaused ? "Play stories" : "Pause stories");
  }

  function finalizeStorySession() {
    if (sessionViewedStories.size === stories.length && stories.length > 0) {
      markCurrentStoriesSeen();
    }
  }

  function resetStorySessionState() {
    clearStoryNavHoldTimer();
    window.clearTimeout(storyHintShowTimeout);
    window.clearTimeout(storyCloseTimeout);
    storyNavHoldTriggered = false;
    activeStoryNavTarget = null;
    stopStoryTimer();
    isStoryPaused = false;
    isStoryHeld = false;
    isStoryManuallyPaused = false;
    storyElapsedBeforePause = 0;
    syncPlaybackToggle();
    document.body.classList.add("story-viewer-is-closing");
    storyCloseTimeout = window.setTimeout(() => {
      document.body.classList.remove("story-viewer-is-open");
      document.body.classList.remove("story-viewer-is-closing");
    }, 240);
  }

  function closeStories() {
    finalizeStorySession();
    resetStorySessionState();

    if (dom.storyViewer?.open) {
      dom.storyViewer.close();
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
      const progress = Math.min(elapsed / storyTimings.duration, 1);

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
    if (!dom.storyViewer || !stories.length || typeof dom.storyViewer.showModal !== "function") {
      return;
    }

    sessionViewedStories = new Set();
    storyElapsedBeforePause = 0;
    isStoryPaused = false;
    isStoryHeld = false;
    isStoryManuallyPaused = false;
    syncPlaybackToggle();
    renderStory(startIndex);
    window.clearTimeout(storyCloseTimeout);
    document.body.classList.remove("story-viewer-is-closing");
    document.body.classList.add("story-viewer-is-open");
    dom.storyViewer.showModal();
    startStoryTimer();
  }

  function bindStoryNavigationEvents() {
    const handleStoryNavPointerDown = (event, direction) => {
      if (!dom.storyViewer?.open) {
        return;
      }

      if (event.button !== 0) {
        if (event.cancelable) {
          event.preventDefault();
        }
        return;
      }

      clearStoryNavHoldTimer();
      storyNavHoldTriggered = false;
      activeStoryNavTarget = direction;

      event.currentTarget?.setPointerCapture?.(event.pointerId);

      storyNavHoldTimer = window.setTimeout(() => {
        storyNavHoldTriggered = true;
        beginHeldPause();
      }, storyTimings.navHoldDelay);
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

    dom.storyPrev?.addEventListener("pointerdown", (event) => {
      handleStoryNavPointerDown(event, "prev");
    });

    dom.storyPrev?.addEventListener("pointerup", () => {
      handleStoryNavPointerEnd("prev");
    });

    dom.storyPrev?.addEventListener("pointercancel", () => {
      handleStoryNavPointerCancel("prev");
    });

    dom.storyPrev?.addEventListener("click", (event) => {
      if (event.detail !== 0) {
        event.preventDefault();
      } else {
        goToPreviousStory();
      }
    });

    dom.storyNext?.addEventListener("pointerdown", (event) => {
      handleStoryNavPointerDown(event, "next");
    });

    dom.storyNext?.addEventListener("pointerup", () => {
      handleStoryNavPointerEnd("next");
    });

    dom.storyNext?.addEventListener("pointercancel", () => {
      handleStoryNavPointerCancel("next");
    });

    dom.storyNext?.addEventListener("click", (event) => {
      if (event.detail !== 0) {
        event.preventDefault();
      } else {
        goToNextStory();
      }
    });
  }

  App.initStories = function initStories() {
    if (App.flags.storiesInitialized) {
      return;
    }

    App.flags.storiesInitialized = true;

    if (!dom.storyTrigger || !dom.storyViewer || !stories.length) {
      return;
    }

    updateStoryTriggerState();

    const openStoriesFromTrigger = () => {
      dismissCurrentStoryHint();
      hideStoryHint();
      hideDesktopStoryHint();
      openStories(0);
    };

    dom.storyTrigger.addEventListener("click", openStoriesFromTrigger);
    dom.storyMobileHint?.addEventListener("click", openStoriesFromTrigger);

    dom.storyTrigger.addEventListener("mouseenter", showDesktopStoryHint);
    dom.storyTrigger.addEventListener("mouseleave", hideDesktopStoryHint);
    dom.storyTrigger.addEventListener("focus", showDesktopStoryHint);
    dom.storyTrigger.addEventListener("blur", hideDesktopStoryHint);

    bindStoryNavigationEvents();

    const shouldSuppressStoryContextMenu = (target) =>
      target instanceof Element &&
      Boolean(target.closest("[data-story-viewer]")) &&
      (dom.storyViewer?.open ||
        document.body.classList.contains("story-viewer-is-open") ||
        document.body.classList.contains("story-viewer-is-closing"));

    dom.storyClose?.addEventListener("click", () => {
      closeStories();
    });

    document.addEventListener(
      "contextmenu",
      (event) => {
        if (shouldSuppressStoryContextMenu(event.target)) {
          event.preventDefault();
        }
      },
      true,
    );

    document.addEventListener(
      "selectstart",
      (event) => {
        if (!dom.storyViewer?.open) {
          return;
        }

        if (event.target instanceof Element && event.target.closest("[data-story-viewer]")) {
          event.preventDefault();
        }
      },
      true,
    );

    dom.storyViewer.addEventListener("close", () => {
      finalizeStorySession();
      resetStorySessionState();
    });

    dom.storyViewer.addEventListener("cancel", () => {
      finalizeStorySession();
      resetStorySessionState();
    });

    dom.storyViewer.addEventListener("click", (event) => {
      if (event.target === dom.storyViewer) {
        closeStories();
      }
    });

    dom.storyViewer.addEventListener("contextmenu", (event) => {
      event.preventDefault();
    });

    dom.storyViewer.addEventListener("dragstart", (event) => {
      if (!dom.storyViewer?.open) {
        return;
      }

      event.preventDefault();
    });

    dom.storyViewer.addEventListener("keydown", (event) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goToNextStory();
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goToPreviousStory();
      }
    });

    dom.storyCta?.addEventListener("click", () => {
      const story = stories[activeStoryIndex];
      if (!story?.url) {
        return;
      }

      window.open(story.url, "_blank", "noopener,noreferrer");
    });

    dom.storyPlaybackToggle?.addEventListener("click", () => {
      isStoryManuallyPaused = !isStoryManuallyPaused;
      syncPlaybackToggle();

      if (isStoryManuallyPaused) {
        pauseStoryTimer();
      } else {
        resumeStoryTimer();
      }
    });

    const handlePressStart = (event) => {
      if (!dom.storyViewer?.open) {
        return;
      }

      if (event.button !== 0) {
        if (event.cancelable) {
          event.preventDefault();
        }
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

      if (event.pointerType === "touch" && event.cancelable) {
        event.preventDefault();
      }

      beginHeldPause();
    };

    const handlePressEnd = () => {
      endHeldPause();
    };

    dom.storySurface?.addEventListener("pointerdown", handlePressStart);
    window.addEventListener("pointerup", handlePressEnd);
    window.addEventListener("pointercancel", handlePressEnd);
    window.addEventListener("blur", handlePressEnd);
  };
})();
