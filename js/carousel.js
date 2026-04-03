/**
 * Promo carousel: manifest → DOM, Instagram-style track (clone loop, drag, dots),
 * shop CTA buttons with optional external-link redirect toast (shared with link cards).
 */
(() => {
  const App = window.KomfiKatApp;

  if (!App) {
    return;
  }

  const { dom, helpers } = App;

  /** Video source switch; keep aligned with CSS / manifest `sizes`. */
  const MQ_MOBILE_VIDEO = "(max-width: 30rem)";
  const defaultManifest = {
    ctaTitle: "Hobby Girl",
    ctaSubtitle: "Cute & Cozy Coloring Book",
    actions: [
      {
        label: "Buy on Etsy",
        mobileLabel: "Buy Hobby Girl on Etsy",
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
        mobileLabel: "Buy Hobby Girl on Amazon",
        subtitle: "Hobby Girl Paperback Version",
        icon: "img/icons/amazon.svg",
        href: "https://www.amazon.com/dp/B0GVF789ZJ",
        className: "promo-carousel__shop-button--amazon",
      },
      {
        label: "View on Website",
        subtitle: "Coming soon",
        icon: "img/icons/favicon.png",
        href: "https://komfikat.com/",
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
          .map((slide, index) => {
            const isVideo = slide.type === "video";
            const mobileSrc =
              typeof slide.mobileSrc === "string" && slide.mobileSrc.trim() ? slide.mobileSrc.trim() : "";
            const poster = typeof slide.poster === "string" && slide.poster.trim() ? slide.poster.trim() : "";
            return {
              type: isVideo ? "video" : "image",
              src: slide.src.trim(),
              mobileSrc,
              poster,
              srcset: typeof slide.srcset === "string" && slide.srcset.trim() ? slide.srcset.trim() : "",
              sizes: typeof slide.sizes === "string" && slide.sizes.trim() ? slide.sizes.trim() : "",
              width: Number.isFinite(slide.width) ? slide.width : 1152,
              height: Number.isFinite(slide.height) ? slide.height : 1152,
              alt:
                typeof slide.alt === "string" && slide.alt.trim()
                  ? slide.alt.trim()
                  : isVideo
                    ? `Instagram carousel video ${index + 1}`
                    : `Instagram carousel image ${index + 1}`,
            };
          })
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

  function createMediaSlides(slideConfig) {
    return slideConfig.files.map((slide, index) => {
      if (slide.type === "video") {
        return {
          type: "video",
          src: slide.src,
          mobileSrc: slide.mobileSrc,
          poster: slide.poster,
          width: slide.width,
          height: slide.height,
          alt: slide.alt,
          preload: index === 0,
          priority: index === 0,
        };
      }

      return {
        type: "image",
        image: slide.src,
        srcset: slide.srcset,
        sizes: slide.sizes,
        width: slide.width,
        height: slide.height,
        alt: slide.alt,
        preload: index === 0,
        priority: index === 0,
      };
    });
  }

  function preloadCarouselMedia(mediaSlides) {
    const first = mediaSlides.find((slide) => slide.preload);
    if (!first) {
      return;
    }

    if (first.type === "video") {
      if (!first.poster || document.head.querySelector(`link[rel="preload"][href="${first.poster}"]`)) {
        return;
      }

      const preload = document.createElement("link");
      preload.rel = "preload";
      preload.as = "image";
      preload.href = first.poster;
      document.head.append(preload);
      return;
    }

    if (!first.image || document.head.querySelector(`link[rel="preload"][href="${first.image}"]`)) {
      return;
    }

    const preload = document.createElement("link");
    preload.rel = "preload";
    preload.as = "image";
    preload.href = first.image;
    if (first.srcset) {
      preload.setAttribute("imagesrcset", first.srcset);
    }
    if (first.sizes) {
      preload.setAttribute("imagesizes", first.sizes);
    }
    document.head.append(preload);
  }

  function getVisibleCards() {
    return helpers.matchesCompactLayout() ? 1 : 2;
  }

  function getCarouselCtaCoverImage(mediaSlides) {
    const first = mediaSlides[0];
    if (!first) {
      return "img/carousel/1-1152.webp";
    }
    if (first.type === "video") {
      return first.poster || "img/carousel/1-1152.webp";
    }
    return first.image;
  }

  function createCarouselItems(mediaSlides, ctaTitle, ctaSubtitle, actions, visibleCardsCount) {
    const ctaItem = {
      type: "cta",
      title: ctaTitle,
      subtitle: ctaSubtitle,
      coverImage: getCarouselCtaCoverImage(mediaSlides),
      coverImageAlt: mediaSlides[0]?.alt || ctaTitle,
      actions,
    };

    if (visibleCardsCount === 1) {
      return [ctaItem, ...mediaSlides];
    }

    if (mediaSlides.length === 0) {
      return [ctaItem];
    }

    // Desktop starts with the first image + CTA. Mobile starts with the first image and keeps CTA last.
    // With only two images, repeat the first one at the tail so the second desktop state can still be image-only.
    if (mediaSlides.length === 2) {
      return [mediaSlides[0], ctaItem, mediaSlides[1], mediaSlides[0]];
    }

    return [mediaSlides[0], ctaItem, ...mediaSlides.slice(1)];
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
  /** Default delay before opening external URL; promo-code branch uses same value today. */
  const PROMO_REDIRECT_DELAY_MS = 5000;
  let activePromoRedirectUi = null;
  let activePromoRedirectAction = null;
  let promoRedirectFitFrame = 0;
  let promoRedirectResizeWired = false;

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

      if (host.includes("instagram")) {
        return "Instagram";
      }

      if (host.includes("tiktok")) {
        return "TikTok";
      }

      if (host.includes("youtube") || host.includes("youtu.be")) {
        return "YouTube";
      }

      if (host.includes("pinterest")) {
        return "Pinterest";
      }

      if (host.includes("threads.net") || host.includes("threads.com")) {
        return "Threads";
      }

      if (host === "wa.me" || host.includes("whatsapp")) {
        return "WhatsApp";
      }

      if (host.includes("komfikat")) {
        return "Komfi Kat";
      }
    } catch {}

    return "";
  }

  function getRedirectAriaLabel(config = {}, countdownSeconds = 5) {
    const redirectLabel = inferRedirectLabel(config);
    const redirectLine = redirectLabel
      ? `Redirecting to ${redirectLabel} in ${countdownSeconds} seconds.`
      : `Redirecting in ${countdownSeconds} seconds.`;

    if (isNonEmptyString(config.promoCode)) {
      return `Save 10% with code ${config.promoCode}. ${redirectLine}`;
    }

    return redirectLine;
  }

  /** Visible second line for link-card redirect (share dialog): "to … in…" — seconds only in the badge. */
  function getRedirectVisibleSubline(redirectLabel) {
    if (redirectLabel) {
      return `to ${redirectLabel} in…`;
    }
    return `in…`;
  }

  function getPromoRedirectDelayMs() {
    return PROMO_REDIRECT_DELAY_MS;
  }

  function getPromoRedirectCountdownSeconds() {
    return Math.ceil(getPromoRedirectDelayMs() / 1000);
  }

  function clearPromoRedirectTimers() {
    window.clearTimeout(promoRedirectTimeout);
    window.clearInterval(promoRedirectInterval);
    promoRedirectTimeout = 0;
    promoRedirectInterval = 0;
  }

  function updateLinkCardRedirectTextSplit(ui) {
    const root = ui?.root;
    if (!(root instanceof HTMLElement) || !root.classList.contains("promo-redirect-local-wrap--link-card")) {
      return;
    }

    if (root.closest(".share-dialog")) {
      root.removeAttribute("data-redirect-text-split");
      return;
    }

    const redirectBody = ui.redirectBody;
    const redirectText = ui.redirectText;
    const redirectTextPrefix = ui.redirectTextPrefix;
    const redirectTextLead = ui.redirectTextLead;
    const redirectSubline = ui.redirectSubline;
    const redirectCountdownBadge = ui.redirectCountdownBadge;

    if (
      !(redirectBody instanceof HTMLElement) ||
      !(redirectText instanceof HTMLElement) ||
      !(redirectTextPrefix instanceof HTMLElement) ||
      !(redirectTextLead instanceof HTMLElement) ||
      !(redirectSubline instanceof HTMLElement) ||
      !(redirectCountdownBadge instanceof HTMLElement)
    ) {
      root.removeAttribute("data-redirect-text-split");
      return;
    }

    const bodyWidth = redirectBody.clientWidth;
    if (bodyWidth <= 0) {
      return;
    }

    const textStyles = window.getComputedStyle(redirectText);
    const prefixStyles = window.getComputedStyle(redirectTextPrefix);

    const measureHost = document.createElement("span");
    measureHost.setAttribute("aria-hidden", "true");
    measureHost.style.cssText =
      "position:absolute;left:0;top:0;visibility:hidden;pointer-events:none;display:inline-flex;flex-direction:row;align-items:center;white-space:nowrap;box-sizing:border-box;";
    measureHost.style.gap = textStyles.gap;
    measureHost.style.font = textStyles.font;
    measureHost.style.fontSize = textStyles.fontSize;
    measureHost.style.fontFamily = textStyles.fontFamily;
    measureHost.style.fontWeight = textStyles.fontWeight;
    measureHost.style.fontStyle = textStyles.fontStyle;
    measureHost.style.letterSpacing = textStyles.letterSpacing;
    measureHost.style.lineHeight = textStyles.lineHeight;

    const measurePrefix = document.createElement("span");
    measurePrefix.style.cssText =
      "display:inline-flex;flex-direction:row;align-items:baseline;white-space:nowrap;box-sizing:border-box;";
    measurePrefix.style.gap = prefixStyles.gap;
    measurePrefix.append(redirectTextLead.cloneNode(true), redirectSubline.cloneNode(true));
    measureHost.append(measurePrefix, redirectCountdownBadge.cloneNode(true));

    document.documentElement.append(measureHost);
    const neededWidth = Math.ceil(measureHost.getBoundingClientRect().width);
    measureHost.remove();

    if (neededWidth > bodyWidth + 2) {
      root.setAttribute("data-redirect-text-split", "");
    } else {
      root.removeAttribute("data-redirect-text-split");
    }
  }

  function fitPromoRedirectOverlay(ui = activePromoRedirectUi) {
    if (
      !(ui?.overlay instanceof HTMLElement) ||
      !(ui.content instanceof HTMLElement) ||
      !(ui.redirectBody instanceof HTMLElement) ||
      !(ui.redirectActions instanceof HTMLElement)
    ) {
      return;
    }

    ui.overlay.style.removeProperty("--promo-redirect-content-scale");

    const overlayWidth = ui.overlay.clientWidth;
    if (overlayWidth <= 0) {
      return;
    }

    const isLinkCardRedirect = ui.root instanceof HTMLElement && ui.root.classList.contains("promo-redirect-local-wrap--link-card");
    /* Share dialog: fluid CSS (clamp + wrap) instead of scaling the whole row. */
    if (isLinkCardRedirect && ui.root.closest?.(".share-dialog")) {
      ui.root.removeAttribute("data-redirect-text-split");
      ui.overlay.style.removeProperty("--promo-redirect-inline-gap");
      return;
    }

    if (isLinkCardRedirect) {
      updateLinkCardRedirectTextSplit(ui);
    }

    const overlayStyles = window.getComputedStyle(ui.overlay);
    const paddingInline =
      (Number.parseFloat(overlayStyles.paddingLeft || "0") || 0) +
      (Number.parseFloat(overlayStyles.paddingRight || "0") || 0);
    const configuredGap = Number.parseFloat(overlayStyles.getPropertyValue("--promo-redirect-inline-gap") || "0") || 0;
    const availableWidth = Math.max(0, overlayWidth - paddingInline);
    const bodyWidth = Math.ceil(ui.redirectBody.scrollWidth);
    const actionsWidth = Math.ceil(ui.redirectActions.scrollWidth);
    const isCompactLinkCardRedirect = isLinkCardRedirect && helpers.matchesCompactLayout();
    const leadWidth = isLinkCardRedirect ? Math.ceil(ui.redirectLead?.getBoundingClientRect().width || 0) : 0;
    const openWidth = isLinkCardRedirect
      ? Math.ceil(Math.max(ui.openNow?.getBoundingClientRect().width || 0, ui.openNowMobile?.getBoundingClientRect().width || 0))
      : 0;
    const cancelWidth = isLinkCardRedirect
      ? Math.ceil(Math.max(ui.cancel?.getBoundingClientRect().width || 0, ui.cancelDesktop?.getBoundingClientRect().width || 0))
      : 0;
    const outerRailWidth = isLinkCardRedirect
      ? isCompactLinkCardRedirect
        ? Math.max(openWidth, cancelWidth, leadWidth)
        : Math.max(actionsWidth, leadWidth)
      : 0;
    const baseContentWidth = isLinkCardRedirect ? bodyWidth + outerRailWidth * 2 : bodyWidth + actionsWidth + leadWidth;

    if (availableWidth <= 0 || baseContentWidth <= 0) {
      return;
    }

    if (isLinkCardRedirect) {
      if (isCompactLinkCardRedirect) {
        const nextGap = configuredGap;
        ui.overlay.style.setProperty("--promo-redirect-inline-gap", `${nextGap.toFixed(3)}px`);
        const nextScale = Math.max(0.64, Math.min(1, availableWidth / (baseContentWidth + (nextGap * 2))));
        ui.overlay.style.setProperty("--promo-redirect-content-scale", nextScale.toFixed(4));
        return;
      }

      const measuredActionsGap =
        ui.openNow instanceof HTMLElement && ui.cancel instanceof HTMLElement
          ? Math.max(0, ui.cancel.getBoundingClientRect().left - ui.openNow.getBoundingClientRect().right)
          : 0;
      const actionsStyles = window.getComputedStyle(ui.redirectActions);
      const configuredActionsGap =
        Number.parseFloat(actionsStyles.columnGap || "0") ||
        Number.parseFloat(actionsStyles.gap || "0") ||
        0;
      const actionsGap = Math.max(measuredActionsGap, configuredActionsGap, configuredGap);
      const nextGap = actionsGap;
      const nextScale = Math.max(0.64, Math.min(1, availableWidth / (baseContentWidth + (nextGap * 2))));

      ui.overlay.style.setProperty("--promo-redirect-inline-gap", `${nextGap.toFixed(3)}px`);
      ui.overlay.style.setProperty("--promo-redirect-content-scale", nextScale.toFixed(4));
      return;
    }

    const expandedGap = Math.max(configuredGap, (availableWidth - baseContentWidth) / 3);
    let nextGap = expandedGap;
    let nextScale = 1;
    const widthWithExpandedGap = baseContentWidth + nextGap * 3;

    if (widthWithExpandedGap > availableWidth) {
      nextGap = configuredGap;
      nextScale = Math.max(0.64, Math.min(1, availableWidth / (baseContentWidth + nextGap * 3)));
    }

    ui.overlay.style.setProperty("--promo-redirect-inline-gap", `${nextGap.toFixed(3)}px`);
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
    const controls = [ui?.redirectCode, ui?.openNow, ui?.openNowMobile, ui?.cancel, ui?.cancelDesktop].filter(
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

    const countdownSeconds = getPromoRedirectCountdownSeconds();

    window.clearTimeout(ui.copyFeedbackTimeout);
    ui.copyFeedbackTimeout = 0;
    ui.overlay?.style.removeProperty("--promo-redirect-content-scale");
    ui.overlay?.style.removeProperty("--promo-redirect-inline-gap");
    ui.overlay?.style.removeProperty("--promo-redirect-single-inline-width");

    delete ui.root.dataset.promoRedirectActive;
    ui.root.removeAttribute("data-redirect-text-split");

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
      ui.redirectCountdown.textContent = String(countdownSeconds);
      ui.redirectCountdown.dataset.value = String(countdownSeconds);
    }

    if (ui.redirectSubline instanceof HTMLElement) {
      const label = inferRedirectLabel(action || {});
      ui.redirectSubline.textContent = getRedirectVisibleSubline(label);
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

  function hidePromoRedirectToast() {
    clearPromoRedirectTimers();
    promoRedirectHref = "";
    promoRedirectCode = "";
    promoRedirectDeadline = 0;

    if (activePromoRedirectUi) {
      resetPromoRedirectUi(activePromoRedirectUi, activePromoRedirectAction);
    }

    setActivePromoRedirectUi(null, null);
    helpers.scheduleIdleTopBarTooltipRestore();
  }

  App.dismissPromoRedirectToast = hidePromoRedirectToast;
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

    const delayMs = getPromoRedirectDelayMs();
    const countdownSeconds = Math.ceil(delayMs / 1000);

    clearPromoRedirectTimers();
    promoRedirectHref = href;
    promoRedirectCode = promoCode;
    promoRedirectDeadline = window.performance.now() + delayMs;
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
        ui.redirectCountdown.textContent = String(countdownSeconds);
        ui.redirectCountdown.dataset.value = String(countdownSeconds);
      }
      if (ui.redirectSubline instanceof HTMLElement) {
        const label = inferRedirectLabel(action || {});
        ui.redirectSubline.textContent = getRedirectVisibleSubline(label);
      }
      ui.control.setAttribute("aria-label", getRedirectAriaLabel(action || { href, promoCode }, countdownSeconds));
      schedulePromoRedirectOverlayFit(ui);
    }

    updatePromoRedirectCountdown();

    promoRedirectInterval = window.setInterval(updatePromoRedirectCountdown, 50);
    promoRedirectTimeout = window.setTimeout(() => {
      const targetHref = promoRedirectHref;
      hidePromoRedirectToast();
      openPromoRedirectTarget(targetHref);
    }, delayMs);
  }

  function createPromoRedirectOverlay(action, control, root) {
    const overlay = document.createElement("span");
    const isLinkCardRedirectHost =
      root instanceof HTMLElement && root.classList.contains("promo-redirect-local-wrap--link-card");
    overlay.className = "promo-redirect-local-overlay";
    overlay.setAttribute("aria-hidden", "true");
    overlay.setAttribute("role", "status");
    overlay.setAttribute("aria-live", "polite");

    const content = document.createElement("span");
    content.className = "promo-redirect-local-overlay__content";
    let redirectLead = null;

    if (isLinkCardRedirectHost) {
      redirectLead = document.createElement("span");
      redirectLead.className = "promo-redirect-toast__lead";
    }

    const redirectBody = document.createElement("span");
    redirectBody.className = "promo-redirect-toast__body";

    const hasPromoCode = isNonEmptyString(action?.promoCode);
    const countdownSeconds = getPromoRedirectCountdownSeconds();
    const redirectLabel = inferRedirectLabel(action);
    let redirectCode = null;
    let redirectEyebrow = null;

    if (hasPromoCode) {
      redirectEyebrow = document.createElement("span");
      redirectEyebrow.className = "promo-redirect-toast__eyebrow";
      const redirectEyebrowText = document.createElement("span");
      redirectEyebrowText.className = "promo-redirect-toast__eyebrow-text";
      redirectEyebrowText.textContent = "Save 10% with code";

      redirectCode = document.createElement("button");
      redirectCode.type = "button";
      redirectCode.className = "promo-redirect-toast__code";
      redirectCode.setAttribute("aria-label", `Copy promo code ${action.promoCode}`);
      const redirectCodeLabel = document.createElement("span");
      redirectCodeLabel.className = "promo-redirect-toast__code-label";
      redirectCodeLabel.textContent = action.promoCode;
      redirectCode.append(redirectCodeLabel);
      redirectEyebrow.append(redirectEyebrowText, redirectCode);
      redirectBody.append(redirectEyebrow);
    }

    const redirectText = document.createElement("span");
    redirectText.className = "promo-redirect-toast__text";

    const redirectTextPrefix = document.createElement("span");
    redirectTextPrefix.className = "promo-redirect-toast__text-prefix";

    const redirectTextLead = document.createElement("span");
    redirectTextLead.className = "promo-redirect-toast__text-line promo-redirect-toast__text-line--lead";
    redirectTextLead.textContent = "Redirecting";

    /** @type {HTMLElement | null} */
    let redirectSubline = null;

    if (isLinkCardRedirectHost) {
      redirectSubline = document.createElement("span");
      redirectSubline.className = "promo-redirect-toast__text-line promo-redirect-toast__text-line--sub";
      redirectSubline.textContent = getRedirectVisibleSubline(redirectLabel);
      redirectTextPrefix.classList.add("promo-redirect-toast__text-prefix--stacked");
      redirectTextPrefix.append(redirectTextLead, redirectSubline);
    } else {
      const redirectTextTail = document.createElement("span");
      redirectTextTail.className = "promo-redirect-toast__text-line promo-redirect-toast__text-line--tail";
      redirectTextTail.textContent = redirectLabel ? ` to ${redirectLabel}` : "";
      redirectTextPrefix.append(redirectTextLead, redirectTextTail);
    }
    redirectText.append(redirectTextPrefix);

    const redirectCountdownBadge = document.createElement("span");
    redirectCountdownBadge.className = "promo-redirect-toast__countdown-badge";

    const redirectCountdown = document.createElement("span");
    redirectCountdown.className = "promo-redirect-toast__countdown";
    redirectCountdown.textContent = String(countdownSeconds);

    const redirectCountdownSuffix = document.createElement("span");
    redirectCountdownSuffix.className = "promo-redirect-toast__countdown-suffix";
    redirectCountdownSuffix.textContent = "sec";

    redirectCountdownBadge.append(redirectCountdown, redirectCountdownSuffix);
    redirectText.append(redirectCountdownBadge);

    redirectBody.append(redirectText);

    const redirectActions = document.createElement("span");
    redirectActions.className = "promo-redirect-toast__actions";
    const openIconMarkup =
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="M7 17L17 7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M9 7H17V15" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    const cancelIconMarkup =
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="M7.4 7.4L16.6 16.6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M16.6 7.4L7.4 16.6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';

    const openNow = document.createElement("button");
    openNow.type = "button";
    openNow.className = "promo-redirect-toast__action promo-redirect-toast__action--open-now";
    openNow.setAttribute("aria-label", redirectLabel ? `Open ${redirectLabel} now` : "Open link now");
    openNow.innerHTML = openIconMarkup;
    let openNowMobile = null;
    let cancelDesktop = null;

    if (isLinkCardRedirectHost && redirectLead instanceof HTMLElement) {
      cancelDesktop = document.createElement("button");
      cancelDesktop.type = "button";
      cancelDesktop.className =
        "promo-redirect-toast__action promo-redirect-toast__action--cancel promo-redirect-toast__action--cancel-desktop";
      cancelDesktop.setAttribute("aria-label", redirectLabel ? `Cancel ${redirectLabel} redirect` : "Cancel redirect");
      cancelDesktop.innerHTML = cancelIconMarkup;
      redirectLead.append(cancelDesktop);

      openNowMobile = document.createElement("button");
      openNowMobile.type = "button";
      openNowMobile.className =
        "promo-redirect-toast__action promo-redirect-toast__action--open-now promo-redirect-toast__action--open-now-mobile";
      openNowMobile.setAttribute("aria-label", redirectLabel ? `Open ${redirectLabel} now` : "Open link now");
      openNowMobile.innerHTML = openIconMarkup;
      redirectLead.append(openNowMobile);
    }

    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "promo-redirect-toast__action promo-redirect-toast__action--cancel";
    cancel.setAttribute("aria-label", redirectLabel ? `Cancel ${redirectLabel} redirect` : "Cancel redirect");
    cancel.innerHTML = cancelIconMarkup;

    redirectActions.append(openNow, cancel);

    if (redirectLead instanceof HTMLElement) {
      content.append(redirectLead, redirectBody, redirectActions);
    } else {
      content.append(redirectBody, redirectActions);
    }
    overlay.append(content);

    const promoUi = {
      root,
      control,
      overlay,
      content,
      redirectLead,
      redirectBody,
      redirectActions,
      redirectCode,
      redirectCountdown,
      redirectSubline,
      redirectText,
      redirectTextPrefix,
      redirectTextLead,
      redirectCountdownBadge,
      openNow,
      openNowMobile,
      cancelDesktop,
      cancel,
      copyFeedbackTimeout: 0,
    };

    setPromoRedirectOverlayInteractiveState(promoUi, false);

    if (redirectCode instanceof HTMLButtonElement) {
      redirectCode.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopPropagation();

        const didCopy = await helpers.copyText(action.promoCode);
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

    const handleOpenNowClick = (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (activePromoRedirectUi !== promoUi || !promoRedirectHref) {
        return;
      }

      const targetHref = promoRedirectHref;
      hidePromoRedirectToast();
      openPromoRedirectTarget(targetHref);
    };

    openNow.addEventListener("click", handleOpenNowClick);

    if (openNowMobile instanceof HTMLButtonElement) {
      openNowMobile.addEventListener("click", handleOpenNowClick);
    }

    const handleCancelClick = (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (activePromoRedirectUi !== promoUi) {
        return;
      }

      hidePromoRedirectToast();
    };

    cancel.addEventListener("click", handleCancelClick);

    if (cancelDesktop instanceof HTMLButtonElement) {
      cancelDesktop.addEventListener("click", handleCancelClick);
    }

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
    const useMobileLabel = helpers.matchesCompactLayout();
    title.textContent = (useMobileLabel ? action.mobileLabel : "") || action.label;

    const subtitle = document.createElement("span");
    subtitle.className = "promo-carousel__shop-button-subtitle";
    subtitle.textContent = action.subtitle || "";

    copy.append(title, subtitle);
    content.append(badge, copy);

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

  function enhanceLinkSectionRedirects() {
    document.querySelectorAll(".link-section .link-card[href][target=\"_blank\"], .share-dialog .link-card[href][target=\"_blank\"]").forEach((link) => {
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

  function togglePromoCarouselVideo(video) {
    if (!(video instanceof HTMLVideoElement)) {
      return;
    }

    if (video.paused) {
      delete video.dataset.carouselUserPaused;
      video.play().catch(() => {});
    } else {
      video.dataset.carouselUserPaused = "true";
      video.pause();
    }
  }

  /** Long-press pauses until release (then resumes); short tap toggles. Blocks native save/context UI. */
  function wireCarouselVideoInteractions(video, card) {
    video.disablePictureInPicture = true;
    video.setAttribute("disablePictureInPicture", "");
    video.setAttribute("controlsList", "nodownload noplaybackrate noremoteplayback");
    video.setAttribute("disableRemotePlayback", "");

    const blockNativeChrome = (event) => {
      event.preventDefault();
    };
    video.addEventListener("contextmenu", blockNativeChrome);
    card.addEventListener("contextmenu", blockNativeChrome);

    let longPressTimer = 0;
    let longPressPauseFired = false;
    let suppressClick = false;
    const LONG_PRESS_MS = 420;

    const clearLongPressTimer = () => {
      if (longPressTimer) {
        window.clearTimeout(longPressTimer);
        longPressTimer = 0;
      }
    };

    const resumeAfterLongPressHold = () => {
      if (!longPressPauseFired) {
        return;
      }
      longPressPauseFired = false;
      delete video.dataset.carouselUserPaused;
      video.play().catch(() => {});
    };

    video.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "mouse" && event.button !== 0) {
        return;
      }
      clearLongPressTimer();
      longPressPauseFired = false;
      suppressClick = false;
      longPressTimer = window.setTimeout(() => {
        longPressTimer = 0;
        longPressPauseFired = true;
        suppressClick = true;
        video.dataset.carouselUserPaused = "true";
        video.pause();
      }, LONG_PRESS_MS);
    });

    const onPointerEnd = () => {
      clearLongPressTimer();
      resumeAfterLongPressHold();
    };

    video.addEventListener("pointerup", onPointerEnd);
    video.addEventListener("pointercancel", onPointerEnd);
    video.addEventListener("lostpointercapture", onPointerEnd);

    video.addEventListener("click", (event) => {
      event.stopPropagation();
      if (suppressClick) {
        suppressClick = false;
        event.preventDefault();
        return;
      }
      togglePromoCarouselVideo(video);
    });
  }

  function createCarouselCtaCard(item) {
    const card = document.createElement("article");
    card.className = "promo-carousel__card promo-carousel__card--cta";
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

  function createCarouselVideoCard(item, index) {
    const card = document.createElement("article");
    card.className = "promo-carousel__card promo-carousel__card--video";
    card.setAttribute("aria-label", item.alt || `Carousel preview ${index + 1}`);
    card.dataset.imageState = "loading";

    const video = document.createElement("video");
    video.className = "promo-carousel__video";
    video.width = item.width || 1152;
    video.height = item.height || 1152;
    video.muted = true;
    video.defaultMuted = true;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.preload = item.preload ? "auto" : "metadata";
    video.draggable = false;

    if (item.poster) {
      video.poster = item.poster;
    }

    const mobileSrc = item.mobileSrc && item.mobileSrc !== item.src ? item.mobileSrc : "";
    if (mobileSrc) {
      const mobileSource = document.createElement("source");
      mobileSource.media = MQ_MOBILE_VIDEO;
      mobileSource.src = mobileSrc;
      mobileSource.type = "video/mp4";
      video.append(mobileSource);
    }

    const desktopSource = document.createElement("source");
    desktopSource.src = item.src;
    desktopSource.type = "video/mp4";
    video.append(desktopSource);

    let videoRevealed = false;

    const revealVideo = () => {
      if (videoRevealed) {
        return;
      }

      videoRevealed = true;
      card.dataset.imageState = "ready";
      video.classList.add("promo-carousel__video--ready");
    };

    video.addEventListener("loadeddata", revealVideo, { once: true });
    video.addEventListener(
      "error",
      () => {
        card.dataset.imageState = "ready";
        video.classList.add("promo-carousel__video--ready");
      },
      { once: true },
    );

    if (video.readyState >= 2) {
      revealVideo();
    }

    card.append(video);
    wireCarouselVideoInteractions(video, card);
    return card;
  }

  function createCarouselImageCard(item, index) {
    const card = document.createElement("article");
    card.className = "promo-carousel__card promo-carousel__card--image";
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

  function createCard(item, index) {
    if (item.type === "cta") {
      return createCarouselCtaCard(item);
    }
    if (item.type === "video") {
      return createCarouselVideoCard(item, index);
    }
    return createCarouselImageCard(item, index);
  }

  function syncShopButtonAlignment(root) {
    if (!(root instanceof Element)) {
      return;
    }

    const isCompactViewport = helpers.matchesCompactLayout();
    const measureShopButtonContentWidth = (content) => {
      if (!(content instanceof HTMLElement)) {
        return 0;
      }

      const badge = content.querySelector(".promo-carousel__shop-button-badge");
      const copy = content.querySelector(".promo-carousel__shop-button-copy");
      const styles = window.getComputedStyle(content);
      const columnGap =
        Number.parseFloat(styles.columnGap || "0") ||
        Number.parseFloat(styles.gap || "0") ||
        0;
      const badgeWidth = badge instanceof HTMLElement ? Math.ceil(badge.getBoundingClientRect().width) : 0;
      const copyWidth = copy instanceof HTMLElement ? Math.ceil(copy.scrollWidth) : 0;

      return Math.ceil(badgeWidth + columnGap + copyWidth);
    };

    root.querySelectorAll(".promo-carousel__cta-actions").forEach((actions) => {
      if (!(actions instanceof HTMLElement)) {
        return;
      }

      const buttonContents = Array.from(actions.querySelectorAll(".promo-carousel__shop-button-content")).filter(
        (content) => content instanceof HTMLElement,
      );

      actions.style.removeProperty("--promo-shop-content-width");
      actions.style.removeProperty("--promo-shop-fit-scale");

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

      if (!Number.isFinite(availableWidth) || availableWidth <= 0) {
        return;
      }

      actions.style.setProperty("--promo-shop-fit-scale", "1");

      const minScale = 0.58;
      let widestScaledWidth = buttonContents.reduce((maxWidth, content) => {
        return Math.max(maxWidth, measureShopButtonContentWidth(content));
      }, 0);
      let nextScale = 1;

      if (widestScaledWidth > availableWidth) {
        for (let iteration = 0; iteration < 4; iteration += 1) {
          const correctionRatio = availableWidth / widestScaledWidth;
          const candidateScale = Math.max(minScale, Math.min(nextScale, nextScale * correctionRatio));

          if (Math.abs(candidateScale - nextScale) < 0.005) {
            nextScale = candidateScale;
            break;
          }

          nextScale = candidateScale;
          actions.style.setProperty("--promo-shop-fit-scale", nextScale.toFixed(4));
          widestScaledWidth = buttonContents.reduce((maxWidth, content) => {
            return Math.max(maxWidth, measureShopButtonContentWidth(content));
          }, 0);

          if (widestScaledWidth <= availableWidth || nextScale <= minScale) {
            break;
          }
        }
      }

      actions.style.setProperty("--promo-shop-fit-scale", nextScale.toFixed(4));
      widestScaledWidth = buttonContents.reduce((maxWidth, content) => {
        return Math.max(maxWidth, measureShopButtonContentWidth(content));
      }, 0);

      const alignedWidth = Math.min(availableWidth, Math.max(0, widestScaledWidth));

      if (alignedWidth <= 0) {
        return;
      }

      actions.style.setProperty("--promo-shop-content-width", `${alignedWidth}px`);

      if (activePromoRedirectUi?.root instanceof HTMLElement && actions.contains(activePromoRedirectUi.root)) {
        schedulePromoRedirectOverlayFit(activePromoRedirectUi);
      }
    });
  }

  App.initCarousel = function initCarousel() {
    if (App.flags.carouselInitialized) {
      return;
    }

    App.flags.carouselInitialized = true;
    enhanceLinkSectionRedirects();

    if (!promoRedirectResizeWired) {
      promoRedirectResizeWired = true;
      window.addEventListener(
        "resize",
        () => {
          if (activePromoRedirectUi) {
            schedulePromoRedirectOverlayFit(activePromoRedirectUi);
          }
        },
        { passive: true },
      );
    }

    const shell = dom.promoCarousel;
    const promoSection = shell?.closest(".promo-carousel");
    const viewport = dom.promoCarouselViewport;
    const track = dom.promoCarouselTrack;
    const dotsRoot = dom.promoCarouselDots;
    const prevButton = dom.promoCarouselPrev;
    const nextButton = dom.promoCarouselNext;

    if (!shell || !viewport || !track || !dotsRoot || !prevButton || !nextButton) {
      return;
    }

    const manifest = getCarouselManifest();
    const mediaSlides = createMediaSlides(manifest.slides);
    preloadCarouselMedia(mediaSlides);

    let currentVisibleCards = getVisibleCards();
    let carouselItems = createCarouselItems(
      mediaSlides,
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

    function syncCarouselSectionBottomSpace() {
      if (!(promoSection instanceof HTMLElement)) {
        return;
      }

      const pager = shell.querySelector(".promo-carousel__pager");

      if (!(pager instanceof HTMLElement)) {
        promoSection.style.setProperty("--promo-carousel-bottom-space", "0px");
        return;
      }

      const shellRect = shell.getBoundingClientRect();
      const pagerRect = pager.getBoundingClientRect();
      const protrusion = Math.max(0, pagerRect.bottom - shellRect.bottom);

      promoSection.style.setProperty("--promo-carousel-bottom-space", `${Math.ceil(protrusion)}px`);
    }

    function syncCarouselLayoutAfterViewportChange() {
      const nextVisibleCards = getVisibleCards();

      if (nextVisibleCards !== currentVisibleCards) {
        rebuildCarouselStructure();
      }

      syncShopButtonAlignment(track);
      updateMetrics();
      syncPosition(true);
      syncCarouselSectionBottomSpace();

      if (activePromoRedirectUi) {
        schedulePromoRedirectOverlayFit(activePromoRedirectUi);
      }
    }

    function rebuildCarouselStructure() {
      if (activePromoRedirectUi) {
        hidePromoRedirectToast();
      }

      const nextVisibleCards = getVisibleCards();
      const visibleCardCountChanged = nextVisibleCards !== currentVisibleCards;

      currentVisibleCards = nextVisibleCards;
      carouselItems = createCarouselItems(
        mediaSlides,
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
      syncCarouselSectionBottomSpace();

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

          pauseCarouselVideos();
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
      syncCarouselSectionBottomSpace();
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

        const isActiveCard = index >= renderedIndex && index < renderedIndex + currentVisibleCards;
        card.dataset.cardState = isActiveCard ? "active" : "rest";

        const video = card.querySelector("video.promo-carousel__video");
        if (video instanceof HTMLVideoElement) {
          if (isActiveCard) {
            if (video.dataset.carouselUserPaused === "true") {
              video.pause();
            } else {
              video.play().catch(() => {});
            }
          } else {
            video.pause();
            delete video.dataset.carouselUserPaused;
          }
        }
      });

      dots.forEach((dot, index) => {
        dot.setAttribute("aria-current", String(index === activeIndex));
      });

      const navHidden = !hasPagination;
      prevButton.dataset.hidden = String(navHidden);
      nextButton.dataset.hidden = String(navHidden);
      prevButton.setAttribute("aria-hidden", String(navHidden));
      nextButton.setAttribute("aria-hidden", String(navHidden));
      prevButton.tabIndex = navHidden ? -1 : 0;
      nextButton.tabIndex = navHidden ? -1 : 0;
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
      syncCarouselSectionBottomSpace();
    }

    function pauseCarouselVideos({ resetTime = false } = {}) {
      track.querySelectorAll("video.promo-carousel__video").forEach((video) => {
        if (!(video instanceof HTMLVideoElement)) {
          return;
        }

        try {
          video.pause();
          if (resetTime) {
            video.currentTime = 0;
          }
        } catch (_) {}
      });
    }

    function recoverFromInterruptedAnimation() {
      if (!isAnimating) {
        return;
      }

      isAnimating = false;
      pendingSnapIndex = null;
      dragOffset = 0;
      pointerId = null;
      touchId = null;
      pointerDragReady = false;
      gestureAxis = "";
      delete shell.dataset.dragging;
      syncPosition(true);
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

      pauseCarouselVideos();

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

      pauseCarouselVideos();

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
        pauseCarouselVideos();
        goToPrevious();
        return;
      }

      if (dragOffset < -threshold) {
        pauseCarouselVideos();
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
      syncCarouselSectionBottomSpace();
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
        syncCarouselLayoutAfterViewportChange();
      });
      resizeObserver.observe(viewport);
    } else {
      window.addEventListener("resize", () => {
        syncCarouselLayoutAfterViewportChange();
      });
    }

    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        syncShopButtonAlignment(track);
        updateMetrics();
        syncPosition(true);
        syncCarouselSectionBottomSpace();
        if (activePromoRedirectUi) {
          schedulePromoRedirectOverlayFit(activePromoRedirectUi);
        }
      });
    }

    window.addEventListener("blur", clearNavRepeat);
    window.addEventListener("komfi:themeswitchend", recoverFromInterruptedAnimation);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        clearNavRepeat();
        track.querySelectorAll("video.promo-carousel__video").forEach((node) => {
          if (node instanceof HTMLVideoElement) {
            node.pause();
          }
        });
      } else {
        syncControls();
      }
    });

    rebuildCarouselStructure();
    syncShopButtonAlignment(track);
    updateMetrics();
    syncPosition(true);
    syncCarouselSectionBottomSpace();
  };
})();
