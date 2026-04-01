(() => {
  const App = (window.KomfiKatApp = window.KomfiKatApp || {});

  // DOM references
  App.dom = {
    root: document.documentElement,
    body: document.body,
    topBar: document.querySelector(".top-bar"),
    homeHero: document.querySelector("[data-home-hero]"),
    themeToggle: document.querySelector("[data-theme-toggle]"),
    shareMenu: document.querySelector("[data-share-menu]"),
    shareButton: document.querySelector("[data-share-page]"),
    shareDialog: document.querySelector("[data-share-dialog]"),
    shareDialogCloseButtons: document.querySelectorAll("[data-share-dialog-close]"),
    shareCopyFeedbackWrap: document.querySelector("[data-share-copy-feedback-wrap]"),
    shareCopyFeedbackOverlay: document.querySelector("[data-share-copy-feedback]"),
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
        ? target.closest(
            'button, a, summary, [role="button"], input[type="button"], input[type="submit"], input[type="reset"]',
          )
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

  function isPromoRedirectToastVisible() {
    return App.isPromoRedirectVisible?.() === true;
  }
  function dismissStickyMenuPrompts(except = "") {
    if (isPromoRedirectToastVisible()) {
      return;
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
    dismissStickyMenuPrompts,
    isPromoRedirectToastVisible,
    copyText,
    lockViewportGestureZoom,
    scheduleStickyHeaderMaskGeometrySync,
  };

  document.addEventListener("DOMContentLoaded", () => {
    const scheduleIdle = (callback, { timeoutMs = 900 } = {}) => {
      if (typeof window.requestIdleCallback === "function") {
        window.requestIdleCallback(
          () => {
            callback();
          },
          { timeout: timeoutMs },
        );
        return;
      }

      window.setTimeout(() => {
        callback();
      }, Math.min(timeoutMs, 600));
    };

    const runOnce = (callback) => {
      let didRun = false;
      return () => {
        if (didRun) {
          return;
        }
        didRun = true;
        callback();
      };
    };

    const createHashtagCopyFeedback = (link) => {
      const feedback = document.createElement("span");
      const content = document.createElement("span");
      const inner = document.createElement("span");
      const label = document.createElement("span");
      const labelText = document.createElement("span");
      const platforms = document.createElement("span");
      const platformConfigs = [
        { key: "instagram", label: "Instagram", url: link.dataset.hashtagInstagramUrl?.trim() || "" },
        { key: "youtube", label: "YouTube", url: link.dataset.hashtagYoutubeUrl?.trim() || "" },
        { key: "tiktok", label: "TikTok", url: link.dataset.hashtagTiktokUrl?.trim() || "" },
      ];

      feedback.className = "social-links__hashtag-feedback";
      content.className = "social-links__hashtag-feedback-content";
      inner.className = "social-links__hashtag-feedback-inner";
      label.className = "social-links__hashtag-feedback-label";
      labelText.className = "social-links__hashtag-feedback-label-text";
      labelText.textContent = "Tag copied!";
      platforms.className = "social-links__hashtag-feedback-links";

      platformConfigs.forEach(({ key: platformKey, label: platformLabel, url }) => {
        const sourceIcon = document
          .querySelector(`.social-links__link[data-platform="${platformKey}"] .social-links__icon`)
          ?.cloneNode(true);

        if (!(sourceIcon instanceof SVGElement) || !url) {
          return;
        }

        const platform = document.createElement("a");

        platform.className = "social-links__hashtag-feedback-link";
        platform.href = url;
        platform.target = "_blank";
        platform.rel = "noopener noreferrer";
        platform.setAttribute(
          "aria-label",
          `Open ${platformLabel} posts for ${link.textContent?.trim() || "this hashtag"}`,
        );
        sourceIcon.classList.remove("social-links__icon");
        sourceIcon.classList.add("social-links__hashtag-feedback-icon");
        sourceIcon.setAttribute("aria-hidden", "true");
        platform.append(sourceIcon);
        platforms.append(platform);
      });

      if (!platforms.childElementCount) {
        return null;
      }

      label.append(labelText);
      inner.append(label, platforms);
      content.append(inner);
      feedback.append(content);
      return feedback;
    };

    const initHashtagFeedback = runOnce(() => {
      App.dom.socialHashtagLinks?.forEach((link, index) => {
      const tooltipOwner = `social-hashtag-${index}`;
      const hashtagItem = link.closest(".social-links__hashtag-item");
      const hashtagLabel = link.querySelector(".social-links__hashtag-label");
      const defaultHashtagLabel = hashtagLabel?.textContent?.trim() || "";
      const hashtagFeedback = createHashtagCopyFeedback(link);
      const getHashtagCopyText = () => defaultHashtagLabel;
      const dismissOtherHashtagFeedback = () => {
        document
          .querySelectorAll('.social-links__hashtag-item[data-feedback-visible="true"]')
          .forEach((activeItem) => {
            if (!(activeItem instanceof HTMLElement) || activeItem === hashtagItem) {
              return;
            }

            delete activeItem.dataset.feedbackVisible;
            delete activeItem.dataset.feedbackArming;

            const activeFeedback = activeItem.querySelector(".social-links__hashtag-feedback");
            if (activeFeedback instanceof HTMLElement) {
              activeFeedback.style.removeProperty("--social-hashtag-feedback-label-scale");
            }
          });
      };
      const syncHashtagFeedbackScale = () => {
        if (!(hashtagItem instanceof HTMLElement) || !(hashtagFeedback instanceof HTMLElement)) {
          return;
        }

        const inner = hashtagFeedback.querySelector(".social-links__hashtag-feedback-inner");
        const label = hashtagFeedback.querySelector(".social-links__hashtag-feedback-label");
        const labelText = hashtagFeedback.querySelector(".social-links__hashtag-feedback-label-text");
        const links = hashtagFeedback.querySelector(".social-links__hashtag-feedback-links");

        if (
          !(inner instanceof HTMLElement) ||
          !(label instanceof HTMLElement) ||
          !(labelText instanceof HTMLElement) ||
          !(links instanceof HTMLElement)
        ) {
          return;
        }

        // Ensure measurements happen at scale 1.
        hashtagFeedback.style.setProperty("--social-hashtag-feedback-label-scale", "1");

        const feedbackRect = hashtagFeedback.getBoundingClientRect();

        if (!(feedbackRect.width > 0)) {
          return;
        }

        const styles = window.getComputedStyle(hashtagFeedback);
        const padLeft = Number.parseFloat(styles.paddingLeft || "0") || 0;
        const padRight = Number.parseFloat(styles.paddingRight || "0") || 0;
        const availableWidth = Math.max(1, feedbackRect.width - padLeft - padRight);
        const innerStyles = window.getComputedStyle(inner);
        const gap = Number.parseFloat(innerStyles.columnGap || innerStyles.gap || "0") || 0;
        const availableLabelWidth = Math.max(1, availableWidth - links.scrollWidth - gap);
        const naturalLabelWidth = Math.max(1, labelText.scrollWidth);
        const scale = Math.min(1, availableLabelWidth / naturalLabelWidth);

        hashtagFeedback.style.setProperty("--social-hashtag-feedback-label-scale", String(scale));
      };
      const hideHashtagFeedback = () => {
        if (!(hashtagItem instanceof HTMLElement) || !hashtagFeedback) {
          return;
        }

        delete hashtagItem.dataset.feedbackVisible;
        delete hashtagItem.dataset.feedbackArming;
        if (hashtagFeedback instanceof HTMLElement) {
          hashtagFeedback.style.removeProperty("--social-hashtag-feedback-label-scale");
        }
      };
      const setHashtagFeedbackVisible = () => {
        if (!(hashtagItem instanceof HTMLElement) || !hashtagFeedback) {
          return;
        }

        dismissOtherHashtagFeedback();
        hashtagItem.dataset.feedbackVisible = "true";
        // Prevent "click-through" into the overlay links on the same interaction
        // that revealed the overlay.
        hashtagItem.dataset.feedbackArming = "true";
        window.setTimeout(() => {
          if (hashtagItem instanceof HTMLElement) {
            delete hashtagItem.dataset.feedbackArming;
          }
        }, 140);
        window.requestAnimationFrame(() => window.requestAnimationFrame(() => syncHashtagFeedbackScale()));
      };

      if (hashtagFeedback && hashtagItem instanceof HTMLElement) {
        hashtagItem.append(hashtagFeedback);

        hashtagFeedback.addEventListener(
          "click",
          (event) => {
            if (!hashtagItem?.dataset.feedbackVisible) {
              return;
            }

            if (event.target instanceof Element && event.target.closest(".social-links__hashtag-feedback-content")) {
              // If the overlay was *just* shown, swallow the click so it can't trigger a platform link.
              if (hashtagItem?.dataset.feedbackArming) {
                event.preventDefault();
                event.stopPropagation();
                return;
              }

              const clickedLink = event.target instanceof Element ? event.target.closest("a") : null;

              hideHashtagFeedback();

              // Allow platform links to navigate; otherwise swallow the click.
              if (!clickedLink) {
                event.preventDefault();
                event.stopPropagation();
              }
            }
          },
          { capture: true },
        );
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

        setHashtagFeedbackVisible();
      });
      });
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

    const initShareOnce = runOnce(() => App.initShare?.());
    const initStoriesOnce = runOnce(() => App.initStories?.());
    const initCarouselOnce = runOnce(() => App.initCarousel?.());

    // Lazy-init on first interaction (so user never waits).
    App.dom.shareButton?.addEventListener("pointerdown", initShareOnce, { once: true, capture: true });
    App.dom.storyTrigger?.addEventListener("pointerdown", initStoriesOnce, { once: true, capture: true });
    App.dom.promoCarousel?.addEventListener("pointerdown", initCarouselOnce, { once: true, capture: true });

    // Idle init for everything else.
    scheduleIdle(() => {
      initShareOnce();
      initStoriesOnce();
      initCarouselOnce();
      initHashtagFeedback();
    });

    scheduleStickyHeaderMaskGeometrySync();

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
  });
})();
