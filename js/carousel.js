(() => {
  const App = window.KomfiKatApp;

  if (!App) {
    return;
  }

  const { dom } = App;
  const defaultManifest = {
    actions: [
      {
        label: "Buy on Etsy",
        subtitle: "Digital Version",
        icon: "img/icons/etsy.svg",
        href: "https://komfikatcoloring.etsy.com/listing/4472798201",
        className: "promo-carousel__shop-button--etsy",
      },
      {
        label: "Buy on Amazon",
        subtitle: "Coming soon",
        icon: "img/icons/amazon.svg",
        className: "promo-carousel__shop-button--amazon",
        disabled: true,
      },
      {
        label: "View on Website",
        subtitle: "Coming soon",
        icon: "img/icons/favicon.png",
        href: "http://komfikat.com/",
        className: "promo-carousel__shop-button--website",
        disabled: true,
      },
    ],
    slides: {
      files: [],
    },
  };

  function getCarouselManifest() {
    const manifest = window.KomfiKatCarouselManifest || {};
    const slideConfig = manifest.slides || {};
    const slideFiles = Array.isArray(slideConfig.files)
      ? slideConfig.files
          .filter((slide) => slide && typeof slide.src === "string" && slide.src.trim())
          .map((slide, index) => ({
            src: slide.src.trim(),
            alt:
              typeof slide.alt === "string" && slide.alt.trim()
                ? slide.alt.trim()
                : `Instagram carousel image ${index + 1}`,
          }))
      : defaultManifest.slides.files;

    return {
      actions:
        Array.isArray(manifest.actions) && manifest.actions.length > 0 ? manifest.actions : defaultManifest.actions,
      slides: {
        files: slideFiles,
      },
    };
  }

  function createImageSlides(slideConfig) {
    return slideConfig.files.map((slide, index) => ({
      type: "image",
      image: slide.src,
      alt: slide.alt,
      preload: index < 2,
      priority: index === 0,
    }));
  }

  function preloadCarouselImages(imageSlides) {
    imageSlides
      .filter((slide) => slide.preload)
      .forEach((slide) => {
        if (!slide.image || document.head.querySelector(`link[rel="preload"][href="${slide.image}"]`)) {
          return;
        }

        const preload = document.createElement("link");
        preload.rel = "preload";
        preload.as = "image";
        preload.href = slide.image;
        document.head.append(preload);
      });
  }

  function getVisibleCards() {
    return window.matchMedia("(max-width: 30rem)").matches ? 1 : 2;
  }

  function createCarouselItems(imageSlides, actions, visibleCardsCount) {
    const ctaItem = {
      type: "cta",
      title: "Shop links",
      actions,
    };

    if (visibleCardsCount === 1) {
      return [...imageSlides, ctaItem];
    }

    if (imageSlides.length === 0) {
      return [ctaItem];
    }

    // Desktop starts with the first image + CTA. Mobile starts with the first image and keeps CTA last.
    // With only two images, repeat the first one at the tail so the second desktop state can still be image-only.
    if (imageSlides.length === 2) {
      return [imageSlides[0], ctaItem, imageSlides[1], imageSlides[0]];
    }

    return [imageSlides[0], ctaItem, ...imageSlides.slice(1)];
  }

  function createPageStarts(items, visibleCardsCount) {
    if (visibleCardsCount === 1) {
      return items.map((_, index) => index);
    }

    if (items.length <= visibleCardsCount) {
      return [0];
    }

    const hasDesktopIntroState = items[1]?.type === "cta";

    if (hasDesktopIntroState) {
      const imagePairStarts = [];

      for (let index = 2; index <= items.length - visibleCardsCount; index += 1) {
        imagePairStarts.push(index);
      }

      return [0, ...imagePairStarts];
    }

    return Array.from({ length: items.length - visibleCardsCount + 1 }, (_, index) => index);
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
    icon.draggable = false;
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
      button.setAttribute("aria-disabled", "true");
      button.addEventListener("dragstart", (event) => event.preventDefault());
      button.append(content);
      return button;
    }

    const link = document.createElement("a");
    link.className = className;
    link.href = action.href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.draggable = false;
    link.addEventListener("dragstart", (event) => event.preventDefault());
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
      actions.style.setProperty("--promo-cta-action-count", String(item.actions.length || 0));
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
    image.loading = item.preload ? "eager" : "lazy";
    image.decoding = "async";
    image.fetchPriority = item.priority ? "high" : "auto";
    image.draggable = false;
    card.append(image);

    return card;
  }

  App.initCarousel = function initCarousel() {
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
    const imageSlides = createImageSlides(manifest.slides);
    preloadCarouselImages(imageSlides);

    let currentVisibleCards = getVisibleCards();
    let carouselItems = createCarouselItems(imageSlides, manifest.actions, currentVisibleCards);
    let pageStarts = [];
    let maxIndex = 0;
    let pageCount = 0;
    let hasPagination = false;
    let shouldLoop = false;
    let cloneCount = 0;
    let renderedItems = [];
    let dots = [];
    let activeIndex = 0;
    let renderedIndex = 0;
    let isDragging = false;
    let isAnimating = false;
    let pointerId = null;
    let touchId = null;
    let pointerDragReady = false;
    let pendingSnapIndex = null;
    let dragStartX = 0;
    let dragOffset = 0;
    let suppressClick = false;
    let stepSize = 0;
    let activeNavButton = null;

    shell.setAttribute("aria-roledescription", "carousel");
    viewport.setAttribute("tabindex", "0");
    viewport.setAttribute("aria-label", "Instagram-style preview carousel");

    function rebuildCarouselStructure() {
      const nextVisibleCards = getVisibleCards();
      const visibleCardCountChanged = nextVisibleCards !== currentVisibleCards;

      currentVisibleCards = nextVisibleCards;
      carouselItems = createCarouselItems(imageSlides, manifest.actions, currentVisibleCards);
      pageStarts = createPageStarts(carouselItems, currentVisibleCards);
      pageCount = pageStarts.length;
      maxIndex = Math.max(pageCount - 1, 0);
      hasPagination = maxIndex > 0;
      shouldLoop = pageCount > 1;
      cloneCount = shouldLoop ? Math.min(currentVisibleCards, carouselItems.length) : 0;
      renderedItems = [...carouselItems.slice(-cloneCount), ...carouselItems, ...carouselItems.slice(0, cloneCount)];

      activeIndex = visibleCardCountChanged ? 0 : Math.min(activeIndex, maxIndex);
      renderedIndex = cloneCount + (pageStarts[activeIndex] ?? 0);
      track.replaceChildren(...renderedItems.map(createCard));

      dotsRoot.replaceChildren();
      dots = Array.from({ length: pageCount }, (_, index) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "promo-carousel__dot";
        dot.setAttribute("aria-label", `Go to preview ${index + 1}`);
        dot.addEventListener("click", () => {
          if (isAnimating || index === activeIndex) {
            return;
          }

          activeIndex = index;
          renderedIndex = cloneCount + (pageStarts[activeIndex] ?? 0);
          isAnimating = true;
          syncPosition();
        });
        dotsRoot.append(dot);
        return dot;
      });

      dotsRoot.hidden = !hasPagination;
      syncControls();
    }

    function getGap() {
      const styles = window.getComputedStyle(track);
      return Number.parseFloat(styles.columnGap || styles.gap || "0") || 0;
    }

    function getStep() {
      const gap = getGap();
      const viewportStyles = window.getComputedStyle(viewport);
      const viewportPadding =
        (Number.parseFloat(viewportStyles.paddingLeft || "0") || 0) +
        (Number.parseFloat(viewportStyles.paddingRight || "0") || 0);
      const availableWidth = viewport.clientWidth - viewportPadding;
      return (availableWidth - gap * (currentVisibleCards - 1)) / currentVisibleCards + gap;
    }

    function updateMetrics() {
      stepSize = getStep();
    }

    function syncControls() {
      dots.forEach((dot, index) => {
        dot.setAttribute("aria-current", String(index === activeIndex));
      });

      prevButton.hidden = !hasPagination;
      nextButton.hidden = !hasPagination;
    }

    function syncPosition(immediate = false) {
      const rawPosition = -renderedIndex * stepSize + dragOffset;
      const position = isDragging ? rawPosition : Math.round(rawPosition);

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

    function isPagerTarget(target) {
      return target instanceof Element && Boolean(target.closest(".promo-carousel__nav, .promo-carousel__dot"));
    }

    function prepareDrag(clientX) {
      suppressClick = false;
      pointerDragReady = true;
      dragStartX = clientX;
      dragOffset = 0;
    }

    function updateDrag(clientX, capturePointerId = null) {
      dragOffset = clientX - dragStartX;

      if (!isDragging) {
        if (Math.abs(dragOffset) < 8) {
          return false;
        }

        isDragging = true;
        suppressClick = true;
        shell.dataset.dragging = "true";
        if (capturePointerId !== null) {
          viewport.setPointerCapture?.(capturePointerId);
        }
      }

      syncPosition();
      return true;
    }

    function clearNavRepeat() {
      if (activeNavButton) {
        delete activeNavButton.dataset.pressing;
        activeNavButton = null;
      }
    }

    function goToNext() {
      if (isAnimating || maxIndex <= 0) {
        return;
      }

      if (activeIndex === maxIndex) {
        if (!shouldLoop) {
          return;
        }

        activeIndex = 0;
        renderedIndex += currentVisibleCards;
        pendingSnapIndex = cloneCount + (pageStarts[0] ?? 0);
      } else {
        activeIndex += 1;
        renderedIndex = cloneCount + (pageStarts[activeIndex] ?? 0);
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

      if (activeIndex === 0) {
        if (!shouldLoop) {
          return;
        }

        activeIndex = maxIndex;
        renderedIndex -= currentVisibleCards;
        pendingSnapIndex = cloneCount + (pageStarts[activeIndex] ?? 0);
      } else {
        activeIndex -= 1;
        renderedIndex = cloneCount + (pageStarts[activeIndex] ?? 0);
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

        clearNavRepeat();
        activeNavButton = button;
        button.dataset.pressing = "true";
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
      button.addEventListener("click", () => {
        action();
      });
    }

    function finalizeDrag() {
      if (!isDragging) {
        pointerDragReady = false;
        dragOffset = 0;
        return;
      }

      const threshold = Math.max(36, stepSize * 0.16);
      suppressClick = Math.abs(dragOffset) > 8;

      isDragging = false;
      pointerId = null;
      pointerDragReady = false;
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

    function finishDrag(currentPointerId) {
      if (currentPointerId !== pointerId) {
        return;
      }

      pointerId = null;
      finalizeDrag();
    }

    function finishTouchDrag() {
      if (touchId === null) {
        return;
      }

      touchId = null;
      finalizeDrag();
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
      if (event.pointerType === "touch") {
        return;
      }

      if (event.pointerType === "mouse" && event.button !== 0) {
        return;
      }

      if (isAnimating) {
        return;
      }

      if (isPagerTarget(event.target)) {
        return;
      }

      pointerId = event.pointerId;
      prepareDrag(event.clientX);
    });

    viewport.addEventListener(
      "touchstart",
      (event) => {
        if (pointerId !== null || touchId !== null || isAnimating || event.touches.length !== 1) {
          return;
        }

        if (isPagerTarget(event.target)) {
          return;
        }

        const touch = event.changedTouches[0];
        if (!touch) {
          return;
        }

        touchId = touch.identifier;
        prepareDrag(touch.clientX);
      },
      { passive: true },
    );

    function handlePointerMove(event) {
      if (event.pointerType === "touch") {
        return;
      }

      if ((!pointerDragReady && !isDragging) || event.pointerId !== pointerId) {
        return;
      }

      const didUpdate = updateDrag(event.clientX, event.pointerId);

      if (didUpdate && event.cancelable && Math.abs(dragOffset) > 4) {
        event.preventDefault();
      }
    }

    function handlePointerRelease(event) {
      if (event.pointerType === "touch") {
        return;
      }

      finishDrag(event.pointerId);
    }

    function handleTouchMove(event) {
      if ((!pointerDragReady && !isDragging) || touchId === null) {
        return;
      }

      const touch = Array.from(event.touches).find((entry) => entry.identifier === touchId);
      if (!touch) {
        return;
      }

      const didUpdate = updateDrag(touch.clientX);

      if (didUpdate && event.cancelable && Math.abs(dragOffset) > 4) {
        event.preventDefault();
      }
    }

    function handleTouchRelease(event) {
      if (touchId === null) {
        return;
      }

      const releasedTouch = Array.from(event.changedTouches).find((entry) => entry.identifier === touchId);
      if (!releasedTouch) {
        return;
      }

      finishTouchDrag();
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerRelease);
    window.addEventListener("pointercancel", handlePointerRelease);
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchRelease, { passive: true });
    window.addEventListener("touchcancel", handleTouchRelease, { passive: true });
    viewport.addEventListener("lostpointercapture", (event) => finishDrag(event.pointerId));

    track.addEventListener("transitionend", (event) => {
      if (event.target !== track || event.propertyName !== "transform") {
        return;
      }

      if (pendingSnapIndex !== null) {
        renderedIndex = pendingSnapIndex;
        pendingSnapIndex = null;
        syncPosition(true);
      }

      isAnimating = false;
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
        const nextVisibleCards = getVisibleCards();

        if (nextVisibleCards !== currentVisibleCards) {
          rebuildCarouselStructure();
        }

        updateMetrics();
        syncPosition(true);
      });
      resizeObserver.observe(viewport);
    } else {
      window.addEventListener("resize", () => {
        const nextVisibleCards = getVisibleCards();

        if (nextVisibleCards !== currentVisibleCards) {
          rebuildCarouselStructure();
        }

        updateMetrics();
        syncPosition(true);
      });
    }

    window.addEventListener("blur", clearNavRepeat);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        clearNavRepeat();
      }
    });

    rebuildCarouselStructure();
    updateMetrics();
    syncPosition(true);
  };
})();
