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
    socialHashtagButtons: document.querySelectorAll(".social-hashtag__btn"),
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

  /** Fallback when the Async Clipboard API is unavailable or denied. */
  function copyTextFallback(text) {
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
      if (copyTextFallback(text)) {
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
    copyText,
    lockViewportGestureZoom,
    scheduleStickyHeaderMaskGeometrySync,
    /** Reserved for future top-bar tooltip restore after dialogs; safe no-op. */
    scheduleIdleTopBarTooltipRestore() {},
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

    const populateSocialHashtagNavs = () => {
      document.querySelectorAll(".social-hashtag").forEach((root) => {
        const btn = root.querySelector(".social-hashtag__btn");
        const nav = root.querySelector(".social-hashtag__nav");
        if (!(btn instanceof HTMLButtonElement) || !(nav instanceof HTMLElement)) {
          return;
        }

        if (nav.childElementCount > 0) {
          return;
        }

        const platforms = [
          { key: "instagram", label: "Instagram", url: btn.dataset.hashtagInstagramUrl?.trim() || "" },
          { key: "youtube", label: "YouTube", url: btn.dataset.hashtagYoutubeUrl?.trim() || "" },
          { key: "tiktok", label: "TikTok", url: btn.dataset.hashtagTiktokUrl?.trim() || "" },
        ];

        platforms.forEach(({ key, label, url }) => {
          if (!url) {
            return;
          }

          const sourceIcon = document.querySelector(
            `.social-links__icons .social-links__link[data-platform="${key}"] .social-links__icon`,
          )?.cloneNode(true);

          if (!(sourceIcon instanceof SVGElement)) {
            return;
          }

          sourceIcon.classList.remove("social-links__icon");
          sourceIcon.classList.add("social-hashtag__platform-icon");
          sourceIcon.setAttribute("aria-hidden", "true");

          const a = document.createElement("a");
          a.className = "social-hashtag__platform";
          a.href = url;
          a.target = "_blank";
          a.rel = "noopener noreferrer";
          a.setAttribute(
            "aria-label",
            `Open ${label} posts for ${btn.querySelector(".social-hashtag__label")?.textContent?.trim() || "this hashtag"}`,
          );
          a.append(sourceIcon);
          nav.append(a);
        });
      });
    };

    const syncSocialHashtagToastScale = (root) => {
      const panel = root.querySelector(".social-hashtag__panel");
      const inner = root.querySelector(".social-hashtag__panel-inner");
      const toast = root.querySelector(".social-hashtag__toast");
      const nav = root.querySelector(".social-hashtag__nav");
      if (
        !(panel instanceof HTMLElement) ||
        !(inner instanceof HTMLElement) ||
        !(toast instanceof HTMLElement) ||
        !(nav instanceof HTMLElement)
      ) {
        return;
      }

      panel.style.setProperty("--social-hashtag-toast-scale", "1");

      const rect = panel.getBoundingClientRect();
      if (!(rect.width > 0)) {
        return;
      }

      const styles = window.getComputedStyle(panel);
      const padLeft = Number.parseFloat(styles.paddingLeft || "0") || 0;
      const padRight = Number.parseFloat(styles.paddingRight || "0") || 0;
      const availableWidth = Math.max(1, rect.width - padLeft - padRight);
      const innerStyles = window.getComputedStyle(inner);
      const gap = Number.parseFloat(innerStyles.columnGap || innerStyles.gap || "0") || 0;
      const availableToastWidth = Math.max(1, availableWidth - nav.scrollWidth - gap);
      const naturalToastWidth = Math.max(1, toast.scrollWidth);
      const scale = Math.min(1, availableToastWidth / naturalToastWidth);

      panel.style.setProperty("--social-hashtag-toast-scale", String(scale));
    };

    const closeSocialHashtag = (root) => {
      const btn = root.querySelector(".social-hashtag__btn");
      const panel = root.querySelector(".social-hashtag__panel");
      if (!(btn instanceof HTMLButtonElement) || !(panel instanceof HTMLElement)) {
        return;
      }

      root.classList.remove("is-open");
      panel.hidden = true;
      panel.setAttribute("aria-hidden", "true");
      btn.setAttribute("aria-expanded", "false");
      panel.style.removeProperty("--social-hashtag-toast-scale");
    };

    const closeAllSocialHashtagsExcept = (except) => {
      document.querySelectorAll(".social-hashtag.is-open").forEach((root) => {
        if (root !== except) {
          closeSocialHashtag(root);
        }
      });
    };

    const openSocialHashtag = (root) => {
      const btn = root.querySelector(".social-hashtag__btn");
      const panel = root.querySelector(".social-hashtag__panel");
      if (!(btn instanceof HTMLButtonElement) || !(panel instanceof HTMLElement)) {
        return;
      }

      closeAllSocialHashtagsExcept(root);

      root.classList.add("is-open");
      panel.hidden = false;
      panel.setAttribute("aria-hidden", "false");
      btn.setAttribute("aria-expanded", "true");

      window.requestAnimationFrame(() => window.requestAnimationFrame(() => syncSocialHashtagToastScale(root)));
    };

    const initSocialHashtagWidgets = runOnce(() => {
      populateSocialHashtagNavs();

      document.querySelectorAll(".social-hashtag").forEach((root) => {
        const btn = root.querySelector(".social-hashtag__btn");
        const panel = root.querySelector(".social-hashtag__panel");
        if (!(btn instanceof HTMLButtonElement) || !(panel instanceof HTMLElement)) {
          return;
        }

        btn.addEventListener("click", async (event) => {
          event.preventDefault();
          event.stopPropagation();

          const labelEl = btn.querySelector(".social-hashtag__label");
          const hashtagText = labelEl?.textContent?.trim() || "";
          if (!hashtagText) {
            return;
          }

          const didCopy = await App.helpers.copyText(hashtagText);
          if (!didCopy) {
            return;
          }

          openSocialHashtag(root);
        });

        panel.addEventListener(
          "click",
          (event) => {
            if (!root.classList.contains("is-open")) {
              return;
            }

            const link = event.target instanceof Element ? event.target.closest("a.social-hashtag__platform") : null;

            if (link instanceof HTMLAnchorElement) {
              closeSocialHashtag(root);
              return;
            }

            event.preventDefault();
            event.stopPropagation();
            closeSocialHashtag(root);
          },
          true,
        );
      });

      document.addEventListener("click", (event) => {
        if (!(event.target instanceof Element)) {
          return;
        }

        document.querySelectorAll(".social-hashtag.is-open").forEach((root) => {
          if (!root.contains(event.target)) {
            closeSocialHashtag(root);
          }
        });
      });

      document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") {
          return;
        }

        document.querySelectorAll(".social-hashtag.is-open").forEach((root) => {
          closeSocialHashtag(root);
        });
      });
    });

    initSocialHashtagWidgets();

    const initSocialIconRowLinks = runOnce(() => {
      const section = document.querySelector("section.social-links");
      if (!(section instanceof HTMLElement)) {
        return;
      }

      const openSocialRowButtonUrl = (btn) => {
        const url = btn.dataset.href?.trim();
        if (!url) {
          return;
        }

        window.open(url, "_blank", "noopener,noreferrer");
      };

      section.addEventListener("click", (event) => {
        const btn = event.target instanceof Element ? event.target.closest("ul.social-links__icons .social-links__link") : null;
        if (!(btn instanceof HTMLButtonElement)) {
          return;
        }

        openSocialRowButtonUrl(btn);
      });

      section.addEventListener("auxclick", (event) => {
        if (event.button !== 1) {
          return;
        }

        const btn = event.target instanceof Element ? event.target.closest("ul.social-links__icons .social-links__link") : null;
        if (!(btn instanceof HTMLButtonElement)) {
          return;
        }

        event.preventDefault();
        openSocialRowButtonUrl(btn);
      });
    });

    initSocialIconRowLinks();

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
    });

    scheduleStickyHeaderMaskGeometrySync();

    schedulePromoCarouselViewportFitSync();
    window.addEventListener("load", () => scheduleStickyHeaderMaskGeometrySync());
    const onViewportResizeDebounced = () => {
      schedulePromoCarouselViewportFitSync({ debounce: true });
      scheduleStickyHeaderMaskGeometrySync({ debounce: true });
    };
    window.addEventListener("resize", onViewportResizeDebounced);
    window.visualViewport?.addEventListener("resize", onViewportResizeDebounced);
    window.addEventListener("orientationchange", () => {
      promoViewportFitStableHeight = 0;
      promoViewportFitStableWidth = 0;
      schedulePromoCarouselViewportFitSync();
      scheduleStickyHeaderMaskGeometrySync();
    });
    document.fonts?.ready.then(() => scheduleStickyHeaderMaskGeometrySync()).catch(() => {});
  });
})();
