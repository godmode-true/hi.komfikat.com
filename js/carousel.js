(() => {
  const App = window.KomfiKatApp;

  if (!App) {
    return;
  }

  const { dom } = App;
  const visibleCards = 2;
  const defaultManifest = {
    actions: [
      {
        label: "Buy on Amazon",
        subtitle: "Physical Copy",
        icon: "img/icons/amazon.svg",
        className: "promo-carousel__shop-button--amazon",
        disabled: true,
      },
      {
        label: "Buy on Etsy",
        subtitle: "Digital Version",
        icon: "img/icons/etsy_168752.svg",
        href: "https://komfikatcoloring.etsy.com/",
        className: "promo-carousel__shop-button--etsy",
      },
      {
        label: "View on Website",
        subtitle: "Official Website",
        icon: "img/icons/favicon.png",
        className: "promo-carousel__shop-button--website",
        disabled: true,
      },
    ],
    slides: {
      directory: "img/carousel",
      startIndex: 1,
      maxIndex: 24,
      extension: "png",
      alts: {},
    },
  };

  function getCarouselManifest() {
    const manifest = window.KomfiKatCarouselManifest || {};
    const slideConfig = manifest.slides || {};

    return {
      actions: Array.isArray(manifest.actions) && manifest.actions.length > 0 ? manifest.actions : defaultManifest.actions,
      slides: {
        directory:
          typeof slideConfig.directory === "string" && slideConfig.directory.trim()
            ? slideConfig.directory.replace(/\/+$/, "")
            : defaultManifest.slides.directory,
        startIndex: Number.isInteger(slideConfig.startIndex) && slideConfig.startIndex > 0 ? slideConfig.startIndex : 1,
        maxIndex: Number.isInteger(slideConfig.maxIndex) && slideConfig.maxIndex > 0 ? slideConfig.maxIndex : 24,
        extension:
          typeof slideConfig.extension === "string" && slideConfig.extension.trim()
            ? slideConfig.extension.replace(/^\./, "")
            : defaultManifest.slides.extension,
        alts: slideConfig.alts && typeof slideConfig.alts === "object" ? slideConfig.alts : {},
      },
    };
  }

  function probeImage(src) {
    return new Promise((resolve) => {
      const image = new Image();

      image.onload = () => resolve(true);
      image.onerror = () => resolve(false);
      image.src = src;
    });
  }

  async function loadImageSlides(slideConfig) {
    const slides = [];

    // Load numbered files in order and stop at the first gap: 1.png, 2.png, 3.png...
    for (let index = slideConfig.startIndex; index <= slideConfig.maxIndex; index += 1) {
      const src = `${slideConfig.directory}/${index}.${slideConfig.extension}`;
      const exists = await probeImage(src);

      if (!exists) {
        break;
      }

      slides.push({
        type: "image",
        image: src,
        alt: slideConfig.alts[index] || `Instagram carousel image ${index}`,
      });
    }

    return slides;
  }

  function createShopButton(action) {
    const className = `promo-carousel__shop-button ${action.className}`.trim();
    const content = document.createElement("span");
    content.className = "promo-carousel__shop-button-content";

    const badge = document.createElement("span");
    badge.className = "promo-carousel__shop-button-badge";
    badge.setAttribute("aria-hidden", "true");

    const icon = document.createElement("img");
    icon.className = "promo-carousel__shop-button-icon";
    icon.src = action.icon;
    icon.alt = "";
    badge.append(icon);

    const copy = document.createElement("span");
    copy.className = "promo-carousel__shop-button-copy";

    const title = document.createElement("span");
    title.className = "promo-carousel__shop-button-title";
    title.textContent = action.label;

    const subtitle = document.createElement("span");
    subtitle.className = "promo-carousel__shop-button-subtitle";
    subtitle.textContent = action.subtitle || "";

    const spacer = document.createElement("span");
    spacer.className = "promo-carousel__shop-button-spacer";
    spacer.setAttribute("aria-hidden", "true");

    copy.append(title, subtitle);
    content.append(badge, copy, spacer);

    if (action.disabled) {
      const button = document.createElement("button");
      button.className = className;
      button.type = "button";
      button.disabled = true;
      button.setAttribute("aria-disabled", "true");
      button.append(content);
      return button;
    }

    const link = document.createElement("a");
    link.className = className;
    link.href = action.href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.append(content);
    return link;
  }

  function createCard(item, index) {
    const card = document.createElement("article");
    card.className = `promo-carousel__card promo-carousel__card--${item.type}`;

    if (item.type === "cta") {
      card.setAttribute("aria-label", item.title);

      const panel = document.createElement("div");
      panel.className = "promo-carousel__cta-panel";

      const actions = document.createElement("div");
      actions.className = "promo-carousel__cta-actions";
      item.actions.forEach((action) => actions.append(createShopButton(action)));

      panel.append(actions);
      card.append(panel);
      return card;
    }

    card.setAttribute("aria-label", item.alt || `Carousel preview ${index + 1}`);

    const image = document.createElement("img");
    image.className = "promo-carousel__image";
    image.src = item.image;
    image.alt = item.alt || "";
    image.loading = index < visibleCards + 1 ? "eager" : "lazy";
    image.decoding = "async";
    image.draggable = false;
    card.append(image);

    return card;
  }

  App.initCarousel = async function initCarousel() {
    if (App.flags.carouselInitialized) {
      return;
    }

    App.flags.carouselInitialized = true;

    const shell = dom.promoCarousel;
    const viewport = dom.promoCarouselViewport;
    const track = dom.promoCarouselTrack;
    const dotsRoot = dom.promoCarouselDots;
    const prevButton = dom.promoCarouselPrev;
    const nextButton = dom.promoCarouselNext;

    if (!shell || !viewport || !track || !dotsRoot || !prevButton || !nextButton) {
      return;
    }

    const manifest = getCarouselManifest();
    const imageSlides = await loadImageSlides(manifest.slides);
    const carouselItems = [
      {
        type: "cta",
        title: "Shop links",
        actions: manifest.actions,
      },
      ...imageSlides,
    ];

    const maxIndex = Math.max(carouselItems.length - visibleCards, 0);
    const pageCount = maxIndex + 1;
    const hasPagination = maxIndex > 0;
    const shouldLoop = pageCount > 2;
    const cloneCount = shouldLoop ? Math.min(visibleCards, carouselItems.length) : 0;
    const renderedItems = [
      ...carouselItems.slice(-cloneCount),
      ...carouselItems,
      ...carouselItems.slice(0, cloneCount),
    ];
    let activeIndex = 0;
    let renderedIndex = cloneCount + activeIndex;
    let isDragging = false;
    let isAnimating = false;
    let pointerId = null;
    let pendingSnapIndex = null;
    let dragStartX = 0;
    let dragOffset = 0;
    let suppressClick = false;
    let stepSize = 0;
    let navRepeatDelayTimer = 0;
    let navRepeatInterval = 0;
    let activeNavButton = null;
    let wheelUnlockTimer = 0;
    let wheelLocked = false;
    let wheelCaptureArmed = false;
    let wheelForwardWrapped = false;
    let wheelForwardReleaseReady = false;
    let wheelBackwardWrapped = false;
    let wheelBackwardReleaseReady = false;

    shell.setAttribute("aria-roledescription", "carousel");
    viewport.setAttribute("tabindex", "0");
    viewport.setAttribute("aria-label", "Instagram-style preview carousel");
    track.replaceChildren(...renderedItems.map(createCard));

    const dots = Array.from({ length: maxIndex + 1 }, (_, index) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "promo-carousel__dot";
      dot.setAttribute("aria-label", `Go to preview ${index + 1}`);
      dot.addEventListener("click", () => {
        if (isAnimating || index === activeIndex) {
          return;
        }

        activeIndex = index;
        renderedIndex = cloneCount + activeIndex;
        isAnimating = true;
        syncPosition();
      });
      dotsRoot.append(dot);
      return dot;
    });
    dotsRoot.hidden = !hasPagination;

    function getGap() {
      const styles = window.getComputedStyle(track);
      return Number.parseFloat(styles.columnGap || styles.gap || "0") || 0;
    }

    function getStep() {
      const gap = getGap();
      return (viewport.clientWidth - gap) / visibleCards + gap;
    }

    function updateMetrics() {
      stepSize = getStep();
    }

    function syncControls() {
      dots.forEach((dot, index) => {
        dot.setAttribute("aria-current", String(index === activeIndex));
      });

      prevButton.hidden = !hasPagination || activeIndex === 0;
      nextButton.hidden = !hasPagination || (!shouldLoop && activeIndex === maxIndex);
    }

    function syncPosition(immediate = false) {
      const position = -renderedIndex * stepSize + dragOffset;

      if (immediate) {
        track.style.transition = "none";
        track.style.transform = `translate3d(${position}px, 0, 0)`;
        track.getBoundingClientRect();
        track.style.removeProperty("transition");
      } else {
        track.style.transform = `translate3d(${position}px, 0, 0)`;
      }

      syncControls();
    }

    function cancelGestureHint() {}

    function dismissGestureHint() {}

    function clearNavRepeat() {
      window.clearTimeout(navRepeatDelayTimer);
      window.clearInterval(navRepeatInterval);
      navRepeatDelayTimer = 0;
      navRepeatInterval = 0;

      if (activeNavButton) {
        delete activeNavButton.dataset.pressing;
        activeNavButton = null;
      }
    }

    function unlockWheelNavigation() {
      wheelLocked = false;
      window.clearTimeout(wheelUnlockTimer);
      wheelUnlockTimer = 0;
    }

    function armWheelCapture() {
      if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches || window.innerWidth <= 1024) {
        return;
      }

      wheelCaptureArmed = true;
      wheelForwardWrapped = false;
      wheelForwardReleaseReady = false;
      wheelBackwardWrapped = false;
      wheelBackwardReleaseReady = false;
    }

    function disarmWheelCapture() {
      wheelCaptureArmed = false;
      wheelForwardWrapped = false;
      wheelForwardReleaseReady = false;
      wheelBackwardWrapped = false;
      wheelBackwardReleaseReady = false;
      unlockWheelNavigation();
    }

    function scheduleGestureHint() {}

    function goToNext() {
      if (isAnimating || maxIndex <= 0) {
        return;
      }

      dismissGestureHint();
      wheelBackwardWrapped = false;
      wheelBackwardReleaseReady = false;

      if (activeIndex === maxIndex) {
        if (!shouldLoop) {
          return;
        }

        wheelForwardWrapped = true;
        activeIndex = 0;
        renderedIndex += visibleCards;
        pendingSnapIndex = cloneCount;
      } else {
        activeIndex += 1;
        renderedIndex += 1;
        pendingSnapIndex = null;
      }

      dragOffset = 0;
      isAnimating = true;
      syncPosition();
    }

    function goToPrevious() {
      if (isAnimating || maxIndex <= 0) {
        return;
      }

      dismissGestureHint();
      wheelForwardWrapped = false;
      wheelForwardReleaseReady = false;

      if (activeIndex === 0) {
        if (!shouldLoop) {
          return;
        }

        wheelBackwardWrapped = true;
        activeIndex = maxIndex;
        renderedIndex -= visibleCards;
        pendingSnapIndex = cloneCount + maxIndex;
      } else {
        activeIndex -= 1;
        renderedIndex -= 1;
        pendingSnapIndex = null;
      }

      dragOffset = 0;
      isAnimating = true;
      syncPosition();
    }

    function bindNavButton(button, action) {
      button.addEventListener("pointerdown", (event) => {
        if ((event.pointerType === "mouse" && event.button !== 0) || button.hidden || button.disabled) {
          return;
        }

        event.preventDefault();
        clearNavRepeat();
        activeNavButton = button;
        button.dataset.pressing = "true";
        action();

        navRepeatDelayTimer = window.setTimeout(() => {
          navRepeatInterval = window.setInterval(() => {
            action();
          }, 320);
        }, 260);

        button.setPointerCapture?.(event.pointerId);
      });

      const stopRepeat = () => {
        if (activeNavButton === button) {
          clearNavRepeat();
        }
      };

      button.addEventListener("pointerup", stopRepeat);
      button.addEventListener("pointercancel", stopRepeat);
      button.addEventListener("lostpointercapture", stopRepeat);
      button.addEventListener("click", (event) => {
        if (event.detail !== 0) {
          event.preventDefault();
          return;
        }

        action();
      });
    }

    function finishDrag(currentPointerId) {
      if (!isDragging || currentPointerId !== pointerId) {
        return;
      }

      const threshold = Math.max(36, stepSize * 0.16);
      suppressClick = Math.abs(dragOffset) > 8;

      dismissGestureHint();
      isDragging = false;
      pointerId = null;
      delete shell.dataset.dragging;

      if (dragOffset > threshold) {
        goToPrevious();
        return;
      }

      if (dragOffset < -threshold) {
        goToNext();
        return;
      }

      dragOffset = 0;
      syncPosition();
    }

    bindNavButton(prevButton, goToPrevious);
    bindNavButton(nextButton, goToNext);

    viewport.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goToPrevious();
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        goToNext();
      }
    });

    viewport.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "mouse" && event.button !== 0) {
        return;
      }

      if (isAnimating) {
        return;
      }

      dismissGestureHint();

      if (
        event.target instanceof Element &&
        event.target.closest(".promo-carousel__shop-button, .promo-carousel__nav, .promo-carousel__dot")
      ) {
        return;
      }

      isDragging = true;
      pointerId = event.pointerId;
      dragStartX = event.clientX;
      dragOffset = 0;
      shell.dataset.dragging = "true";
      viewport.setPointerCapture?.(event.pointerId);
    });

    viewport.addEventListener("pointermove", (event) => {
      if (!isDragging || event.pointerId !== pointerId) {
        return;
      }

      dragOffset = event.clientX - dragStartX;

      if (event.cancelable && Math.abs(dragOffset) > 4) {
        event.preventDefault();
      }

      syncPosition();
    });

    viewport.addEventListener("pointerup", (event) => finishDrag(event.pointerId));
    viewport.addEventListener("pointercancel", (event) => finishDrag(event.pointerId));
    viewport.addEventListener("lostpointercapture", (event) => finishDrag(event.pointerId));

    shell.addEventListener("mouseenter", armWheelCapture);
    shell.addEventListener("mouseleave", disarmWheelCapture);

    shell.addEventListener(
      "wheel",
      (event) => {
        const isDesktopWheelContext =
          window.matchMedia("(hover: hover) and (pointer: fine)").matches && window.innerWidth > 1024;

        if (!isDesktopWheelContext || !wheelCaptureArmed) {
          return;
        }

        if (Math.abs(event.deltaY) < 10 || Math.abs(event.deltaY) < Math.abs(event.deltaX)) {
          event.preventDefault();
          return;
        }

        const direction = event.deltaY > 0 ? 1 : -1;
        const reachedTerminalEdge =
          !shouldLoop && ((activeIndex === maxIndex && direction > 0) || (activeIndex === 0 && direction < 0));

        if (reachedTerminalEdge) {
          disarmWheelCapture();
          return;
        }

        if (shouldLoop && direction > 0 && activeIndex === 0 && wheelForwardReleaseReady) {
          disarmWheelCapture();
          return;
        }

        if (shouldLoop && direction < 0 && activeIndex === 0 && wheelBackwardReleaseReady) {
          disarmWheelCapture();
          return;
        }

        event.preventDefault();

        if (
          !hasPagination ||
          isAnimating ||
          isDragging ||
          wheelLocked
        ) {
          return;
        }

        dismissGestureHint();
        wheelLocked = true;
        wheelUnlockTimer = window.setTimeout(unlockWheelNavigation, 260);

        if (event.deltaY > 0) {
          goToNext();
          return;
        }

        goToPrevious();
      },
      { passive: false },
    );

    track.addEventListener("transitionend", (event) => {
      if (event.target !== track || event.propertyName !== "transform") {
        return;
      }

      if (pendingSnapIndex !== null) {
        renderedIndex = pendingSnapIndex;
        pendingSnapIndex = null;
        syncPosition(true);
      }

      if (shouldLoop && activeIndex === 0 && wheelForwardWrapped) {
        wheelForwardReleaseReady = true;
      }

      if (shouldLoop && activeIndex === 0 && wheelBackwardWrapped) {
        wheelBackwardReleaseReady = true;
      }

      isAnimating = false;
      scheduleGestureHint();
    });

    track.addEventListener(
      "click",
      (event) => {
        if (!suppressClick) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        suppressClick = false;
      },
      true,
    );

    if (typeof ResizeObserver === "function") {
      const resizeObserver = new ResizeObserver(() => {
        cancelGestureHint();
        updateMetrics();
        syncPosition(true);
        scheduleGestureHint();
      });
      resizeObserver.observe(viewport);
    } else {
      window.addEventListener("resize", () => {
        cancelGestureHint();
        updateMetrics();
        syncPosition(true);
        scheduleGestureHint();
      });
    }

    window.addEventListener("blur", clearNavRepeat);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        clearNavRepeat();
        unlockWheelNavigation();
      }
    });

    updateMetrics();
    syncPosition(true);
    scheduleGestureHint();
  };
})();
