(() => {
  const App = window.KomfiKatApp;

  if (!App) {
    return;
  }

  const { dom } = App;
  const defaultManifest = {
    ctaTitle: "Hobby Girl",
    ctaSubtitle: "Cute & Cozy Coloring Book",
    actions: [
      {
        label: "Buy on Etsy",
        subtitle: "Hobby Girl Digital Version",
        icon: "img/icons/etsy.svg",
        href: "https://komfikatcoloring.etsy.com/listing/4472798201",
        className: "promo-carousel__shop-button--etsy",
        promoCode: "COZY10",
        promoLabel: "PROMO CODE",
        promoHint: "Tap to copy",
        promoCopiedLabel: "Copied!",
        promoCopiedHint: "Ready to paste",
      },
      {
        label: "Buy on Amazon",
        subtitle: "Hobby Girl Paperback Version",
        icon: "img/icons/amazon.svg",
        href: "https://www.amazon.com/dp/B0GVF789ZJ",
        className: "promo-carousel__shop-button--amazon",
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
            srcset: typeof slide.srcset === "string" && slide.srcset.trim() ? slide.srcset.trim() : "",
            sizes: typeof slide.sizes === "string" && slide.sizes.trim() ? slide.sizes.trim() : "",
            width: Number.isFinite(slide.width) ? slide.width : 1152,
            height: Number.isFinite(slide.height) ? slide.height : 1152,
            alt:
              typeof slide.alt === "string" && slide.alt.trim()
                ? slide.alt.trim()
                : `Instagram carousel image ${index + 1}`,
          }))
      : defaultManifest.slides.files;

    return {
      ctaTitle:
        typeof manifest.ctaTitle === "string" && manifest.ctaTitle.trim() ? manifest.ctaTitle.trim() : defaultManifest.ctaTitle,
      ctaSubtitle:
        typeof manifest.ctaSubtitle === "string" && manifest.ctaSubtitle.trim()
          ? manifest.ctaSubtitle.trim()
          : defaultManifest.ctaSubtitle,
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
      srcset: slide.srcset,
      sizes: slide.sizes,
      width: slide.width,
      height: slide.height,
      alt: slide.alt,
      preload: index === 0,
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
        if (slide.srcset) {
          preload.setAttribute("imagesrcset", slide.srcset);
        }
        if (slide.sizes) {
          preload.setAttribute("imagesizes", slide.sizes);
        }
        document.head.append(preload);
      });
  }

  function getVisibleCards() {
    return window.matchMedia("(max-width: 48rem)").matches ? 1 : 2;
  }

  function createCarouselItems(imageSlides, ctaTitle, ctaSubtitle, actions, visibleCardsCount) {
    const ctaItem = {
      type: "cta",
      title: ctaTitle,
      subtitle: ctaSubtitle,
      coverImage: "img/carousel/1.png",
      coverImageAlt: imageSlides[0]?.alt || ctaTitle,
      actions,
    };

    if (visibleCardsCount === 1) {
      return [ctaItem, ...imageSlides];
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

  function getInitialActiveIndexForViewport(visibleCardsCount, items) {
    if (visibleCardsCount === 1 && items.length > 1 && items[0]?.type === "cta") {
      return 1;
    }

    return 0;
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

  function createBrandIconElement(action, className) {
    const icon = document.createElement("img");
    icon.className = className;
    icon.src = action.icon;
    icon.alt = "";
    icon.width = action.className?.includes("--website") ? 200 : 24;
    icon.height = action.className?.includes("--website") ? 200 : 24;
    icon.decoding = "async";
    icon.draggable = false;
    return icon;
  }

  let promoRedirectTimeout = 0;
  let promoRedirectInterval = 0;
  let promoRedirectDeadline = 0;
  let promoRedirectHref = "";
  let promoRedirectCode = "";
  const PROMO_REDIRECT_DELAY_MS = 5000;
  let activePromoRedirectUi = null;
  let activePromoRedirectAction = null;
  let promoRedirectFitFrame = 0;

  function isNonEmptyString(value) {
    return typeof value === "string" && value.trim().length > 0;
  }

  function isExternalNavigationHref(href) {
    if (!isNonEmptyString(href)) {
      return false;
    }

    try {
      const url = new URL(href, window.location.href);
      return url.origin !== window.location.origin;
    } catch {
      return /^https?:\/\//i.test(href);
    }
  }

  function inferRedirectLabel({ redirectLabel = "", label = "", href = "" } = {}) {
    if (isNonEmptyString(redirectLabel)) {
      return redirectLabel.trim();
    }

    if (isNonEmptyString(label)) {
      const normalizedLabel = label.trim();
      const buyOnMatch = normalizedLabel.match(/(?:buy|shop|view|open)\s+on\s+(.+)$/i);
      const shopMatch = normalizedLabel.match(/^(.+?)\s+shop$/i);

      if (buyOnMatch?.[1]) {
        return buyOnMatch[1].trim();
      }

      if (shopMatch?.[1]) {
        return shopMatch[1].trim();
      }
    }

    try {
      const host = new URL(href, window.location.href).hostname.replace(/^www\./i, "");

      if (host.includes("etsy")) {
        return "Etsy";
      }

      if (host.includes("amazon")) {
        return "Amazon";
      }

      if (host.includes("komfikat")) {
        return "Komfi Kat";
      }
    } catch {}

    return "";
  }

  function getRedirectTextPrefix(config = {}) {
    const redirectLabel = inferRedirectLabel(config);
    return redirectLabel ? `Redirecting to ${redirectLabel} in ` : "Redirecting in ";
  }

  function getRedirectAriaLabel(config = {}, countdownSeconds = 5) {
    const redirectLine = `${getRedirectTextPrefix(config)}${countdownSeconds} seconds.`;

    if (isNonEmptyString(config.promoCode)) {
      return `Save 10% with code ${config.promoCode}. ${redirectLine}`;
    }

    return redirectLine;
  }

  function clearPromoRedirectTimers() {
    window.clearTimeout(promoRedirectTimeout);
    window.clearInterval(promoRedirectInterval);
    promoRedirectTimeout = 0;
    promoRedirectInterval = 0;
  }

  function fitPromoRedirectOverlay(ui = activePromoRedirectUi) {
    if (!(ui?.overlay instanceof HTMLElement) || !(ui.content instanceof HTMLElement)) {
      return;
    }

    ui.overlay.style.removeProperty("--promo-redirect-content-scale");

    const overlayWidth = ui.overlay.clientWidth;
    if (overlayWidth <= 0) {
      return;
    }

    const overlayStyles = window.getComputedStyle(ui.overlay);
    const paddingInline =
      (Number.parseFloat(overlayStyles.paddingLeft || "0") || 0) +
      (Number.parseFloat(overlayStyles.paddingRight || "0") || 0);
    const fitGutter =
      (Number.parseFloat(overlayStyles.getPropertyValue("--promo-redirect-fit-gutter-inline") || "0") || 0) * 2;
    const availableWidth = Math.max(0, overlayWidth - paddingInline - fitGutter);
    const contentWidth = Math.ceil(ui.content.scrollWidth);

    if (availableWidth <= 0 || contentWidth <= 0) {
      return;
    }

    const nextScale = Math.max(0.64, Math.min(1, availableWidth / contentWidth));
    ui.overlay.style.setProperty("--promo-redirect-content-scale", nextScale.toFixed(4));
  }

  function schedulePromoRedirectOverlayFit(ui = activePromoRedirectUi) {
    window.cancelAnimationFrame(promoRedirectFitFrame);
    promoRedirectFitFrame = window.requestAnimationFrame(() => {
      promoRedirectFitFrame = 0;
      fitPromoRedirectOverlay(ui);
    });
  }

  function setPromoRedirectCodeText(codeElement, text) {
    if (!(codeElement instanceof HTMLElement)) {
      return;
    }

    const label = codeElement.querySelector(".promo-redirect-toast__code-label");

    if (label instanceof HTMLElement) {
      label.textContent = text;
      return;
    }

    codeElement.textContent = text;
  }

  function setPromoRedirectOverlayInteractiveState(ui, isInteractive) {
    const controls = [ui?.redirectCode, ui?.openNow, ui?.cancel].filter(
      (control) => control instanceof HTMLElement,
    );

    controls.forEach((control) => {
      if (!(control instanceof HTMLElement)) {
        return;
      }

      if (isInteractive) {
        if (control.dataset.restoreTabindex !== undefined) {
          const restoreValue = control.dataset.restoreTabindex;

          if (restoreValue) {
            control.setAttribute("tabindex", restoreValue);
          } else {
            control.removeAttribute("tabindex");
          }

          delete control.dataset.restoreTabindex;
        }

        return;
      }

      if (control.dataset.restoreTabindex === undefined) {
        control.dataset.restoreTabindex = control.getAttribute("tabindex") || "";
      }

      control.setAttribute("tabindex", "-1");
    });
  }

  function openPromoRedirectTarget(href) {
    if (!href) {
      return;
    }

    const link = document.createElement("a");
    link.href = href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.style.display = "none";
    document.body.append(link);
    link.click();
    link.remove();
  }

  function resetPromoRedirectUi(ui = activePromoRedirectUi, action = activePromoRedirectAction) {
    if (!ui?.root) {
      return;
    }

    window.clearTimeout(ui.copyFeedbackTimeout);
    ui.copyFeedbackTimeout = 0;
    ui.overlay?.style.removeProperty("--promo-redirect-content-scale");

    delete ui.root.dataset.promoRedirectActive;

    if (ui.overlay instanceof HTMLElement) {
      ui.overlay.setAttribute("aria-hidden", "true");
    }

    setPromoRedirectOverlayInteractiveState(ui, false);

    if (ui.redirectCode instanceof HTMLElement) {
      setPromoRedirectCodeText(ui.redirectCode, action?.promoCode || promoRedirectCode || "");
      delete ui.redirectCode.dataset.copied;
      if (action?.promoCode) {
        ui.redirectCode.setAttribute("aria-label", `Copy promo code ${action.promoCode}`);
      }
    }

    if (ui.redirectCountdown instanceof HTMLElement) {
      ui.redirectCountdown.textContent = "5";
      ui.redirectCountdown.dataset.value = "5";
    }

    if (ui.control instanceof HTMLElement) {
      const fallbackLabel = isNonEmptyString(action?.ariaLabel) ? action.ariaLabel.trim() : action?.label;

      if (isNonEmptyString(fallbackLabel)) {
        ui.control.setAttribute("aria-label", fallbackLabel);
      }
    }
  }

  function setActivePromoRedirectUi(ui, action) {
    if (activePromoRedirectUi && activePromoRedirectUi !== ui) {
      resetPromoRedirectUi(activePromoRedirectUi, activePromoRedirectAction);
    }

    activePromoRedirectUi = ui || null;
    activePromoRedirectAction = action || null;
  }

  App.isPromoRedirectVisible = function isPromoRedirectVisible() {
    return Boolean(activePromoRedirectUi);
  };

  function dismissPromoRedirectToast() {
    hidePromoRedirectToast();
  }

  function hidePromoRedirectToast() {
    clearPromoRedirectTimers();
    promoRedirectHref = "";
    promoRedirectCode = "";
    promoRedirectDeadline = 0;

    if (activePromoRedirectUi) {
      resetPromoRedirectUi(activePromoRedirectUi, activePromoRedirectAction);
    }

    setActivePromoRedirectUi(null, null);
    App.helpers.scheduleIdleTopBarTooltipRestore?.();
  }

  App.dismissPromoRedirectToast = dismissPromoRedirectToast;
  App.hidePromoRedirectToast = hidePromoRedirectToast;

  function updatePromoRedirectCountdown() {
    if (!activePromoRedirectUi?.redirectCountdown) {
      return;
    }

    const remaining = Math.max(0, promoRedirectDeadline - window.performance.now());
    const remainingSeconds = remaining / 1000;
    const nextValue = Math.ceil(remainingSeconds).toString();
    activePromoRedirectUi.redirectCountdown.textContent = nextValue;
    activePromoRedirectUi.redirectCountdown.dataset.value = nextValue;
  }

  function schedulePromoRedirect(href, promoCode = "", ui = null, action = null) {
    if (!href) {
      return;
    }

    clearPromoRedirectTimers();
    promoRedirectHref = href;
    promoRedirectCode = promoCode;
    promoRedirectDeadline = window.performance.now() + PROMO_REDIRECT_DELAY_MS;
    setActivePromoRedirectUi(ui, action);

    if (ui?.root) {
      ui.root.dataset.promoRedirectActive = "true";
      ui.overlay?.setAttribute("aria-hidden", "false");
      setPromoRedirectOverlayInteractiveState(ui, true);
      if (ui.redirectCode instanceof HTMLElement && promoCode) {
        setPromoRedirectCodeText(ui.redirectCode, promoCode);
        delete ui.redirectCode.dataset.copied;
        ui.redirectCode.setAttribute("aria-label", `Copy promo code ${promoCode}`);
      }
      if (ui.redirectCountdown instanceof HTMLElement) {
        ui.redirectCountdown.textContent = "5";
        ui.redirectCountdown.dataset.value = "5";
      }
      ui.control.setAttribute("aria-label", getRedirectAriaLabel(action || { href, promoCode }, 5));
      schedulePromoRedirectOverlayFit(ui);
    }

    updatePromoRedirectCountdown();

    promoRedirectInterval = window.setInterval(updatePromoRedirectCountdown, 50);
    promoRedirectTimeout = window.setTimeout(() => {
      const targetHref = promoRedirectHref;
      hidePromoRedirectToast();
      openPromoRedirectTarget(targetHref);
    }, PROMO_REDIRECT_DELAY_MS);
  }

  function createPromoRedirectOverlay(action, control, root) {
    const overlay = document.createElement("span");
    overlay.className = "promo-redirect-local-overlay promo-carousel__shop-button-redirect";
    overlay.setAttribute("aria-hidden", "true");
    overlay.setAttribute("role", "status");
    overlay.setAttribute("aria-live", "polite");

    const content = document.createElement("span");
    content.className = "promo-redirect-local-overlay__content";

    const redirectBody = document.createElement("span");
    redirectBody.className = "promo-redirect-toast__body";

    const hasPromoCode = isNonEmptyString(action?.promoCode);
    const redirectLabel = inferRedirectLabel(action);
    let redirectCode = null;

    if (hasPromoCode) {
      const redirectEyebrow = document.createElement("span");
      redirectEyebrow.className = "promo-redirect-toast__eyebrow";
      redirectEyebrow.append("SAVE 10% WITH CODE ");

      redirectCode = document.createElement("button");
      redirectCode.type = "button";
      redirectCode.className = "promo-redirect-toast__code";
      redirectCode.setAttribute("aria-label", `Copy promo code ${action.promoCode}`);
      const redirectCodeLabel = document.createElement("span");
      redirectCodeLabel.className = "promo-redirect-toast__code-label";
      redirectCodeLabel.textContent = action.promoCode;
      redirectCode.append(redirectCodeLabel);
      redirectEyebrow.append(redirectCode);
      redirectBody.append(redirectEyebrow);
    }

    const redirectText = document.createElement("span");
    redirectText.className = "promo-redirect-toast__text";
    redirectText.append(getRedirectTextPrefix(action));

    const redirectCountdown = document.createElement("span");
    redirectCountdown.className = "promo-redirect-toast__countdown";
    redirectCountdown.textContent = "5";
    redirectText.append(redirectCountdown);

    redirectBody.append(redirectText);

    const redirectActions = document.createElement("span");
    redirectActions.className = "promo-redirect-toast__actions";

    const openNow = document.createElement("button");
    openNow.type = "button";
    openNow.className = "promo-redirect-toast__action promo-redirect-toast__action--open-now";
    openNow.setAttribute("aria-label", redirectLabel ? `Open ${redirectLabel} now` : "Open link now");
    openNow.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="M7 17L17 7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M9 7H17V15" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "promo-redirect-toast__action promo-redirect-toast__action--cancel";
    cancel.setAttribute("aria-label", redirectLabel ? `Cancel ${redirectLabel} redirect` : "Cancel redirect");
    cancel.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="M7.4 7.4L16.6 16.6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M16.6 7.4L7.4 16.6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';

    redirectActions.append(openNow, cancel);
    content.append(redirectBody, redirectActions);
    overlay.append(content);

    const promoUi = {
      root,
      control,
      overlay,
      content,
      redirectCode,
      redirectCountdown,
      openNow,
      cancel,
      copyFeedbackTimeout: 0,
    };

    setPromoRedirectOverlayInteractiveState(promoUi, false);

    if (redirectCode instanceof HTMLButtonElement) {
      redirectCode.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopPropagation();

        const didCopy = await App.helpers.copyText(action.promoCode);
        if (!didCopy) {
          return;
        }

        window.clearTimeout(promoUi.copyFeedbackTimeout);
        redirectCode.dataset.copied = "true";
        setPromoRedirectCodeText(redirectCode, "COPIED");
        redirectCode.setAttribute("aria-label", `Promo code ${action.promoCode} copied`);
        schedulePromoRedirectOverlayFit(promoUi);
        promoUi.copyFeedbackTimeout = window.setTimeout(() => {
          setPromoRedirectCodeText(redirectCode, action.promoCode);
          delete redirectCode.dataset.copied;
          redirectCode.setAttribute("aria-label", `Copy promo code ${action.promoCode}`);
          promoUi.copyFeedbackTimeout = 0;
          schedulePromoRedirectOverlayFit(promoUi);
        }, 1400);
      });
    }

    openNow.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (activePromoRedirectUi !== promoUi || !promoRedirectHref) {
        return;
      }

      const targetHref = promoRedirectHref;
      hidePromoRedirectToast();
      openPromoRedirectTarget(targetHref);
    });

    cancel.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (activePromoRedirectUi !== promoUi) {
        return;
      }

      hidePromoRedirectToast();
    });

    overlay.addEventListener("dragstart", (event) => event.preventDefault());

    return promoUi;
  }

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !activePromoRedirectUi) {
      return;
    }

    event.preventDefault();
    hidePromoRedirectToast();
  });

  function createShopButton(action) {
    const className = `promo-carousel__shop-button ${action.className}`.trim();
    const content = document.createElement("span");
    content.className = "promo-carousel__shop-button-content";

    const badge = document.createElement("span");
    badge.className = "promo-carousel__shop-button-badge";
    badge.setAttribute("aria-hidden", "true");
    badge.append(createBrandIconElement(action, "promo-carousel__shop-button-icon"));

    const copy = document.createElement("span");
    copy.className = "promo-carousel__shop-button-copy";

    const title = document.createElement("span");
    title.className = "promo-carousel__shop-button-title";
    title.textContent = action.label;

    const subtitle = document.createElement("span");
    subtitle.className = "promo-carousel__shop-button-subtitle";
    subtitle.textContent = action.subtitle || "";

    copy.append(title, subtitle);
    content.append(badge, copy);

    const buildWrap = (control) => {
      if (action.disabled || !isExternalNavigationHref(action.href)) {
        return control;
      }

      const wrap = document.createElement("span");
      wrap.className = "promo-redirect-local-wrap promo-carousel__shop-button-wrap";
      control.dataset.promoRedirectControl = "true";
      const promoUi = createPromoRedirectOverlay(action, control, wrap);
      wrap.append(control, promoUi.overlay);

      control.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        schedulePromoRedirect(action.href, action.promoCode, promoUi, action);
      });

      return wrap;
    };

    if (action.disabled) {
      const button = document.createElement("button");
      button.className = className;
      button.type = "button";
      button.setAttribute("aria-disabled", "true");
      button.addEventListener("dragstart", (event) => event.preventDefault());
      button.append(content);
      return buildWrap(button);
    }

    const link = document.createElement("a");
    link.className = className;
    link.href = action.href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.draggable = false;
    link.addEventListener("dragstart", (event) => event.preventDefault());
    link.append(content);
    return buildWrap(link);
  }

  function enhanceLinkSectionRedirects() {
    document.querySelectorAll(".link-section .link-card[href][target=\"_blank\"]").forEach((link) => {
      if (!(link instanceof HTMLAnchorElement) || link.closest(".promo-redirect-local-wrap")) {
        return;
      }

      const href = link.getAttribute("href") || link.href;
      if (!isExternalNavigationHref(href)) {
        return;
      }

      const wrap = document.createElement("span");
      wrap.className = "promo-redirect-local-wrap promo-redirect-local-wrap--link-card";
      const action = {
        href,
        ariaLabel: link.getAttribute("aria-label") || "",
        label: link.querySelector(".link-card__title")?.textContent?.trim() || link.textContent?.trim() || "External link",
        redirectLabel: link.dataset.localRedirectTarget || "",
        promoCode: link.dataset.localRedirectPromoCode || "",
      };

      link.dataset.promoRedirectControl = "true";
      link.draggable = false;
      link.addEventListener("dragstart", (event) => event.preventDefault());

      link.parentNode?.insertBefore(wrap, link);
      wrap.append(link);

      const promoUi = createPromoRedirectOverlay(action, link, wrap);
      wrap.append(promoUi.overlay);

      link.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        schedulePromoRedirect(href, action.promoCode, promoUi, action);
      });
    });
  }

  function createCard(item, index) {
    const card = document.createElement("article");
    card.className = `promo-carousel__card promo-carousel__card--${item.type}`;

    if (item.type === "cta") {
      card.setAttribute("aria-label", item.title);

      const panel = document.createElement("div");
      panel.className = "promo-carousel__cta-panel";

      const header = document.createElement("div");
      header.className = "promo-carousel__cta-header";

      if (item.coverImage) {
        const cover = document.createElement("img");
        cover.className = "promo-carousel__cta-cover";
        cover.src = item.coverImage;
        cover.alt = item.coverImageAlt || "";
        cover.width = 240;
        cover.height = 240;
        cover.decoding = "async";
        cover.draggable = false;
        header.append(cover);
      }

      const copy = document.createElement("div");
      copy.className = "promo-carousel__cta-copy";

      const title = document.createElement("h3");
      title.className = "promo-carousel__cta-title";
      title.textContent = item.title;

      const subtitle = document.createElement("p");
      subtitle.className = "promo-carousel__cta-subtitle";
      subtitle.textContent = item.subtitle || "";

      copy.append(title, subtitle);
      header.append(copy);

      const actions = document.createElement("div");
      actions.className = "promo-carousel__cta-actions";
      actions.style.setProperty("--promo-cta-action-count", String(item.actions.length || 0));
      item.actions.forEach((action) => actions.append(createShopButton(action)));

      panel.append(header, actions);
      card.append(panel);
      return card;
    }

    card.setAttribute("aria-label", item.alt || `Carousel preview ${index + 1}`);
    card.dataset.imageState = "loading";

    const image = document.createElement("img");
    image.className = "promo-carousel__image";
    image.alt = item.alt || "";
    image.width = item.width || 1152;
    image.height = item.height || 1152;
    image.loading = item.preload ? "eager" : "lazy";
    image.decoding = "async";
    image.fetchPriority = item.priority ? "high" : "auto";
    image.draggable = false;

    let imageRevealed = false;

    const revealImage = () => {
      if (imageRevealed) {
        return;
      }

      imageRevealed = true;

      const commitReveal = () => {
        card.dataset.imageState = "ready";
        image.classList.add("promo-carousel__image--ready");
      };

      if (typeof image.decode === "function") {
        image.decode().catch(() => {}).finally(() => {
          window.requestAnimationFrame(commitReveal);
        });
        return;
      }

      window.requestAnimationFrame(commitReveal);
    };

    image.addEventListener("load", revealImage, { once: true });
    image.addEventListener(
      "error",
      () => {
        card.dataset.imageState = "ready";
        image.classList.add("promo-carousel__image--ready");
      },
      { once: true },
    );

    if (item.srcset) {
      image.srcset = item.srcset;
    }
    if (item.sizes) {
      image.sizes = item.sizes;
    }
    image.src = item.image;

    if (image.complete && image.naturalWidth > 0) {
      revealImage();
    }

    card.append(image);

    return card;
  }

  function syncShopButtonAlignment(root) {
    if (!(root instanceof Element)) {
      return;
    }

    const isCompactViewport = window.matchMedia("(max-width: 48rem)").matches;

    root.querySelectorAll(".promo-carousel__cta-actions").forEach((actions) => {
      if (!(actions instanceof HTMLElement)) {
        return;
      }

      const buttonContents = Array.from(actions.querySelectorAll(".promo-carousel__shop-button-content")).filter(
        (content) => content instanceof HTMLElement,
      );

      buttonContents.forEach((content) => {
        content.style.removeProperty("width");
      });

      actions.style.removeProperty("--promo-shop-content-width");

      if (!isCompactViewport || buttonContents.length === 0) {
        return;
      }

      const referenceButton = actions.querySelector(".promo-carousel__shop-button");
      let availableWidth = Number.POSITIVE_INFINITY;

      if (referenceButton instanceof HTMLElement) {
        const buttonStyles = window.getComputedStyle(referenceButton);
        const paddingInline =
          (Number.parseFloat(buttonStyles.paddingLeft || "0") || 0) +
          (Number.parseFloat(buttonStyles.paddingRight || "0") || 0);
        availableWidth = Math.max(0, Math.floor(referenceButton.clientWidth - paddingInline));
      }

      const widestContentWidth = buttonContents.reduce((maxWidth, content) => {
        return Math.max(maxWidth, Math.ceil(content.scrollWidth));
      }, 0);

      const alignedWidth = Math.max(0, Math.min(widestContentWidth, availableWidth));

      if (alignedWidth <= 0) {
        return;
      }

      actions.style.setProperty("--promo-shop-content-width", `${alignedWidth}px`);
      buttonContents.forEach((content) => {
        content.style.width = `${alignedWidth}px`;
      });
    });
  }

  App.initCarousel = function initCarousel() {
    if (App.flags.carouselInitialized) {
      return;
    }

    App.flags.carouselInitialized = true;
    enhanceLinkSectionRedirects();

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
    let carouselItems = createCarouselItems(
      imageSlides,
      manifest.ctaTitle,
      manifest.ctaSubtitle,
      manifest.actions,
      currentVisibleCards,
    );
    let pageStarts = [];
    let maxIndex = 0;
    let pageCount = 0;
    let hasPagination = false;
    let shouldLoop = false;
    let cloneCount = 0;
    let renderedItems = [];
    let dots = [];
    let activeIndex = getInitialActiveIndexForViewport(currentVisibleCards, carouselItems);
    let renderedIndex = 0;
    let isDragging = false;
    let isAnimating = false;
    let pointerId = null;
    let touchId = null;
    let pointerDragReady = false;
    let pendingSnapIndex = null;
    let dragStartX = 0;
    let dragStartY = 0;
    let dragOffset = 0;
    let dragInputMode = "";
    let gestureAxis = "";
    let suppressClick = false;
    let stepSize = 0;
    let activeNavButton = null;
    let lastTapNavigateAt = 0;

    shell.setAttribute("aria-roledescription", "carousel");
    viewport.setAttribute("tabindex", "0");
    viewport.setAttribute("aria-label", "Instagram-style preview carousel");

    function rebuildCarouselStructure() {
      if (activePromoRedirectUi) {
        hidePromoRedirectToast();
      }

      const nextVisibleCards = getVisibleCards();
      const visibleCardCountChanged = nextVisibleCards !== currentVisibleCards;

      currentVisibleCards = nextVisibleCards;
      carouselItems = createCarouselItems(
        imageSlides,
        manifest.ctaTitle,
        manifest.ctaSubtitle,
        manifest.actions,
        currentVisibleCards,
      );
      pageStarts = createPageStarts(carouselItems, currentVisibleCards);
      pageCount = pageStarts.length;
      maxIndex = Math.max(pageCount - 1, 0);
      hasPagination = maxIndex > 0;
      shouldLoop = pageCount > 1;
      cloneCount = shouldLoop ? carouselItems.length : 0;
      renderedItems = [...carouselItems.slice(-cloneCount), ...carouselItems, ...carouselItems.slice(0, cloneCount)];

      activeIndex = visibleCardCountChanged
        ? getInitialActiveIndexForViewport(currentVisibleCards, carouselItems)
        : Math.min(activeIndex, maxIndex);
      renderedIndex = cloneCount + (pageStarts[activeIndex] ?? 0);
      track.replaceChildren(...renderedItems.map(createCard));
      syncShopButtonAlignment(track);

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
      const firstCard = track.querySelector(".promo-carousel__card");

      if (firstCard instanceof HTMLElement) {
        const rawWidth =
          Number.parseFloat(window.getComputedStyle(firstCard).width || "0") ||
          firstCard.offsetWidth ||
          firstCard.clientWidth;
        return rawWidth + gap;
      }

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
      shell.dataset.activeSlideType = carouselItems[pageStarts[activeIndex] ?? activeIndex]?.type || "image";

      Array.from(track.children).forEach((card, index) => {
        if (!(card instanceof HTMLElement)) {
          return;
        }

        card.dataset.cardState = index >= renderedIndex && index < renderedIndex + currentVisibleCards ? "active" : "rest";
      });

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

    function isInteractiveTarget(target) {
      return (
        target instanceof Element &&
        Boolean(target.closest("a, button, input, textarea, select, label, summary, [role=\"button\"]"))
      );
    }

    function prepareDrag(clientX, clientY = 0, inputMode = "") {
      suppressClick = false;
      pointerDragReady = true;
      dragStartX = clientX;
      dragStartY = clientY;
      dragOffset = 0;
      dragInputMode = inputMode;
      gestureAxis = "";
    }

    function updateDrag(clientX, capturePointerId = null) {
      const nextOffset = clientX - dragStartX;
      if (stepSize > 0 && dragInputMode !== "mouse") {
        dragOffset = Math.max(-stepSize, Math.min(stepSize, nextOffset));
      } else if (stepSize > 0) {
        const minOffset = -Math.max(0, (renderedItems.length - currentVisibleCards - renderedIndex) * stepSize);
        const maxOffset = Math.max(0, renderedIndex * stepSize);
        dragOffset = Math.max(minOffset, Math.min(maxOffset, nextOffset));
      } else {
        dragOffset = nextOffset;
      }

      if (!isDragging) {
        if (Math.abs(dragOffset) < 8) {
          return false;
        }

        if (activePromoRedirectUi) {
          hidePromoRedirectToast();
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
      if (isAnimating) {
        return;
      }

      if (maxIndex <= 0) {
        return;
      }

      if (activeIndex >= maxIndex) {
        if (!shouldLoop) {
          return;
        }

        activeIndex = 0;
        renderedIndex += currentVisibleCards;
        pendingSnapIndex = cloneCount + (pageStarts[activeIndex] ?? 0);
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
      if (isAnimating) {
        return;
      }

      if (maxIndex <= 0) {
        return;
      }

      if (activeIndex <= 0) {
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
        dragInputMode = "";
        gestureAxis = "";
        return;
      }

      const threshold = Math.max(32, stepSize * 0.22);
      suppressClick = Math.abs(dragOffset) > 8;

      isDragging = false;
      pointerId = null;
      pointerDragReady = false;
      gestureAxis = "";
      delete shell.dataset.dragging;

      if (dragInputMode === "mouse" && currentVisibleCards > 1 && stepSize > 0) {
        const projectedRenderedIndex = renderedIndex - dragOffset / stepSize;
        let nearest = {
          activeIndex,
          renderedIndex,
          distance: Number.POSITIVE_INFINITY,
        };

        pageStarts.forEach((pageStart, index) => {
          const baseRenderedIndex = cloneCount + pageStart;
          const candidates = shouldLoop
            ? [baseRenderedIndex - carouselItems.length, baseRenderedIndex, baseRenderedIndex + carouselItems.length]
            : [baseRenderedIndex];

          candidates.forEach((candidateRenderedIndex) => {
            const distance = Math.abs(candidateRenderedIndex - projectedRenderedIndex);

            if (distance < nearest.distance) {
              nearest = {
                activeIndex: index,
                renderedIndex: candidateRenderedIndex,
                distance,
              };
            }
          });
        });

        activeIndex = nearest.activeIndex;
        renderedIndex = nearest.renderedIndex;
        dragOffset = 0;
        dragInputMode = "";

        const baseRenderedIndex = cloneCount + (pageStarts[activeIndex] ?? 0);
        pendingSnapIndex = nearest.renderedIndex === baseRenderedIndex ? null : baseRenderedIndex;
        isAnimating = true;
        syncPosition();
        return;
      }

      dragInputMode = "";

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
      prepareDrag(event.clientX, event.clientY, "mouse");
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
        prepareDrag(touch.clientX, touch.clientY, "touch");
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

      const deltaX = touch.clientX - dragStartX;
      const deltaY = touch.clientY - dragStartY;
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      if (!gestureAxis) {
        if (Math.max(absDeltaX, absDeltaY) < 6) {
          return;
        }

        gestureAxis = absDeltaX >= absDeltaY ? "x" : "y";

        if (gestureAxis === "y") {
          touchId = null;
          pointerDragReady = false;
          dragOffset = 0;
          return;
        }
      }

      if (gestureAxis !== "x") {
        return;
      }

      const didUpdate = updateDrag(touch.clientX);

      if ((didUpdate || absDeltaX > 4) && event.cancelable) {
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

    shell.addEventListener("click", (event) => {
      if (currentVisibleCards !== 1 || isAnimating || event.defaultPrevented) {
        return;
      }

      if (
        isPagerTarget(event.target) ||
        isInteractiveTarget(event.target)
      ) {
        return;
      }

      const now = performance.now();
      if (now - lastTapNavigateAt < 200) {
        return;
      }
      lastTapNavigateAt = now;

      const rect = shell.getBoundingClientRect();
      const midpoint = rect.left + rect.width / 2;

      if (event.clientX < midpoint) {
        goToPrevious();
        return;
      }

      goToNext();
    });

    if (typeof ResizeObserver === "function") {
      const resizeObserver = new ResizeObserver(() => {
        const nextVisibleCards = getVisibleCards();

        if (nextVisibleCards !== currentVisibleCards) {
          rebuildCarouselStructure();
        }

        syncShopButtonAlignment(track);
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

        syncShopButtonAlignment(track);
        updateMetrics();
        syncPosition(true);
      });
    }

    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        syncShopButtonAlignment(track);
        updateMetrics();
        syncPosition(true);
      });
    }

    window.addEventListener("blur", clearNavRepeat);
    window.addEventListener("resize", () => {
      if (activePromoRedirectUi) {
        schedulePromoRedirectOverlayFit(activePromoRedirectUi);
      }
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        clearNavRepeat();
      }
    });

    rebuildCarouselStructure();
    syncShopButtonAlignment(track);
    updateMetrics();
    syncPosition(true);
  };
})();
