(() => {
  const App = window.KomfiKatApp;

  if (!App) {
    return;
  }

  const { dom, helpers } = App;
  const shareMessages = {
    defaultHint: "Tell your friends about Komfi Kat",
    linkCopiedHint: "Link copied!",
    textCopiedHint: "Text copied!",
  };

  let shareTooltipTimeout = 0;
  let shareRailHintTimeout = 0;
  let shareFeedbackCleanupTimeout = 0;
  let shareHintSuppressed = false;
  let shareCopyFeedbackActive = false;

  function shouldUseNativeShare() {
    return typeof navigator.share === "function";
  }

  function shouldUseDesktopShareRail() {
    return helpers.isDesktopPointerDevice();
  }

  function shouldUseBottomMobileToast() {
    return window.matchMedia("(max-width: 48rem)").matches || !shouldUseDesktopShareRail();
  }

  function getSharePayload() {
    const url = dom.canonicalLink?.href || window.location.href;
    const title = document.title;
    const text = dom.metaDescription?.content || "Cozy hand-drawn coloring books by Komfi Kat.";

    return {
      url,
      title,
      text,
      message: `Take a cozy peek at Komfi Kat. ${text} ${url}`,
    };
  }

  function isShareMenuOpen() {
    return dom.shareMenu?.dataset.shareMenuOpen === "true";
  }

  function isPromoRedirectVisible() {
    return dom.shareMenu?.dataset.promoRedirectVisible === "true";
  }

  function setShareRailHint(text = shareMessages.defaultHint) {
    if (!dom.shareRailHint || !dom.shareMenu) {
      return;
    }

    if (isPromoRedirectVisible()) {
      return;
    }

    helpers.dismissStickyMenuPrompts?.("share");
    window.clearTimeout(shareFeedbackCleanupTimeout);

    const isCopiedFeedback = typeof text === "string" && /\bcopied!$/i.test(text.trim());

    if (isCopiedFeedback) {
      helpers.setShareHintContent({ text, success: true });
    } else if (text.endsWith("👉")) {
      helpers.setShareHintContent({ text: text.slice(0, -2).trim(), icon: "👉" });
    } else {
      helpers.setShareHintContent({ text });
    }

    dom.shareMenu.dataset.shareHintVisible = "true";
  }

  function resetShareRailHint() {
    if (dom.shareMenu) {
      delete dom.shareMenu.dataset.shareHintVisible;
      delete dom.shareMenu.dataset.shareFeedbackVisible;

      if (dom.shareMenu.dataset.shareFeedbackMode) {
        window.clearTimeout(shareFeedbackCleanupTimeout);
        shareFeedbackCleanupTimeout = window.setTimeout(() => {
          delete dom.shareMenu.dataset.shareFeedbackMode;
        }, 220);
      }
    }

    window.clearTimeout(shareRailHintTimeout);
  }

  function resetShareButtonState() {
    if (!dom.shareButton) {
      return;
    }

    dom.shareButton.setAttribute("data-tooltip", "Share with a friend");
    dom.shareButton.setAttribute("aria-label", "Share");
    helpers.hideTopBarTooltip("share-button");
  }

  function clearShareTransientState() {
    if (!dom.shareMenu) {
      return;
    }

    shareCopyFeedbackActive = false;
    shareHintSuppressed = false;
    window.clearTimeout(shareTooltipTimeout);
    window.clearTimeout(shareFeedbackCleanupTimeout);
    delete dom.shareMenu.dataset.shareTooltipSuppressed;
    delete dom.shareMenu.dataset.shareHintVisible;
    delete dom.shareMenu.dataset.shareFeedbackVisible;
    delete dom.shareMenu.dataset.shareFeedbackMode;
    helpers.hideTopBarTooltip("share-feedback");
    resetShareButtonState();
  }

  function closeShareMenu() {
    if (!dom.shareMenu || !dom.shareButton) {
      return;
    }

    resetShareRailHint();
    delete dom.shareMenu.dataset.shareMenuOpen;
    dom.shareButton.setAttribute("aria-expanded", "false");
    helpers.scheduleIdleTopBarTooltipRestore?.();
  }

  function hideShareStickyUi() {
    clearShareTransientState();
    closeShareMenu();
  }

  function elementContainsPoint(element, clientX, clientY) {
    if (!element) {
      return false;
    }

    const rect = element.getBoundingClientRect();
    return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
  }

  function isPointerInsideExpandedShareZone(clientX, clientY) {
    if (!dom.shareButton) {
      return false;
    }

    if (elementContainsPoint(dom.shareButton, clientX, clientY)) {
      return true;
    }

    if (isShareMenuOpen() && elementContainsPoint(dom.shareRail, clientX, clientY)) {
      return true;
    }

    if (
      (dom.shareMenu?.dataset.shareHintVisible === "true" || dom.shareMenu?.dataset.shareFeedbackVisible === "true") &&
      elementContainsPoint(dom.shareRailHint, clientX, clientY)
    ) {
      return true;
    }

    return elementContainsPoint(dom.shareHoverBridge, clientX, clientY);
  }

  function openShareMenu() {
    if (!dom.shareMenu || !dom.shareButton) {
      return;
    }

    if (isPromoRedirectVisible()) {
      closeShareMenu();
      return;
    }

    clearShareTransientState();
    dom.shareMenu.dataset.shareMenuOpen = "true";
    dom.shareButton.setAttribute("aria-expanded", "true");

    if (dom.shareButton.matches(":hover, :focus-visible, :focus")) {
      setShareRailHint(shareMessages.defaultHint);
    }
  }

  function toggleShareMenu() {
    if (!dom.shareMenu) {
      return;
    }

    if (isShareMenuOpen()) {
      shareHintSuppressed = true;
      dom.shareMenu.dataset.shareTooltipSuppressed = "true";
      closeShareMenu();
      return;
    }

    shareHintSuppressed = false;
    openShareMenu();
  }

  function showShareCopiedState(message = shareMessages.linkCopiedHint) {
    if (!dom.shareButton || !dom.shareMenu) {
      return;
    }

    if (shouldUseBottomMobileToast()) {
      shareCopyFeedbackActive = false;
      closeShareMenu();
      delete dom.shareMenu.dataset.shareTooltipSuppressed;
      resetShareButtonState();
      return;
    }

    shareCopyFeedbackActive = true;
    closeShareMenu();
    delete dom.shareMenu.dataset.shareTooltipSuppressed;
    window.clearTimeout(shareTooltipTimeout);
    dom.shareButton.setAttribute("aria-label", message);
    helpers.showTopBarTooltip(message, "share-feedback", "center", { trigger: "click" });
    shareTooltipTimeout = window.setTimeout(() => {
      shareCopyFeedbackActive = false;
      resetShareRailHint();
      resetShareButtonState();
      helpers.hideTopBarTooltip("share-feedback");
    }, 2600);
  }

  App.showShareCopiedState = showShareCopiedState;
  App.hideShareStickyUi = hideShareStickyUi;

  function bindShareOptionEvents(shareOption) {
    const optionHint = shareOption.dataset.shareHint || shareMessages.defaultHint;

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

      if (shareCopyFeedbackActive) {
        return;
      }

      const nextTarget = event.relatedTarget;

      if (nextTarget && dom.shareRail?.contains(nextTarget)) {
        return;
      }

      if (
        nextTarget &&
        ((dom.shareButton && dom.shareButton.contains(nextTarget)) ||
          (dom.shareHoverBridge && dom.shareHoverBridge.contains(nextTarget)))
      ) {
        if (dom.shareButton && dom.shareButton.matches(":hover, :focus-visible, :focus")) {
          setShareRailHint();
        } else {
          resetShareRailHint();
        }
        return;
      }

      if (nextTarget && dom.shareMenu?.contains(nextTarget)) {
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

      if (shareCopyFeedbackActive) {
        return;
      }

      const nextTarget = event.relatedTarget;

      if (nextTarget && dom.shareRail?.contains(nextTarget)) {
        return;
      }

      if (
        nextTarget &&
        ((dom.shareButton && dom.shareButton.contains(nextTarget)) ||
          (dom.shareHoverBridge && dom.shareHoverBridge.contains(nextTarget)))
      ) {
        if (dom.shareButton && dom.shareButton.matches(":hover, :focus-visible, :focus")) {
          setShareRailHint();
        } else {
          resetShareRailHint();
        }
        return;
      }

      if (nextTarget && dom.shareMenu?.contains(nextTarget)) {
        return;
      }

      resetShareRailHint();
    });

    shareOption.addEventListener("click", async () => {
      const sharePayload = getSharePayload();
      const option = shareOption.dataset.shareOption;

      if (option === "copy") {
        const didCopy = await helpers.copyText(sharePayload.url);

        if (didCopy) {
          showShareCopiedState();
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
      }
    });
  }

  App.initShare = function initShare() {
    if (App.flags.shareInitialized) {
      return;
    }

    App.flags.shareInitialized = true;

    if (dom.shareButton) {
      dom.shareButton.addEventListener("click", async (event) => {
        if (isPromoRedirectVisible()) {
          event.preventDefault();
          closeShareMenu();
          return;
        }

        if (shouldUseDesktopShareRail()) {
          event.preventDefault();
          toggleShareMenu();
          return;
        }

        const sharePayload = getSharePayload();

        if (shouldUseNativeShare()) {
          try {
            const fullPayload = {
              title: sharePayload.title,
              text: sharePayload.text,
              url: sharePayload.url,
            };

            if (typeof navigator.canShare !== "function" || navigator.canShare(fullPayload)) {
              await navigator.share(fullPayload);
              return;
            }

            await navigator.share({ url: sharePayload.url });
            return;
          } catch (error) {
            if (error?.name === "AbortError") {
              return;
            }
          }
        }

        const didCopy = await helpers.copyText(sharePayload.url);

        if (didCopy) {
          showShareCopiedState();
        }
      });
    }

    if (dom.shareOptions.length) {
      dom.shareOptions.forEach(bindShareOptionEvents);
    }

    if (dom.shareMenu && dom.shareRail) {
      if (dom.shareButton) {
        dom.shareButton.addEventListener("mouseenter", () => {
          if (isPromoRedirectVisible()) {
            closeShareMenu();
            return;
          }

          if (!shouldUseDesktopShareRail()) {
            return;
          }

          if (!isShareMenuOpen()) {
            helpers.showTopBarTooltip(dom.shareButton.dataset.tooltip || "Share with a friend", "share-button");
            return;
          }

          if (!shareHintSuppressed) {
            setShareRailHint();
          }
        });

        dom.shareButton.addEventListener("focus", () => {
          if (isPromoRedirectVisible()) {
            closeShareMenu();
            return;
          }

          if (!shouldUseDesktopShareRail()) {
            return;
          }

          if (!isShareMenuOpen()) {
            helpers.showTopBarTooltip(dom.shareButton.dataset.tooltip || "Share with a friend", "share-button");
            return;
          }

          if (!shareHintSuppressed) {
            setShareRailHint();
          }
        });

        dom.shareButton.addEventListener("mouseleave", () => {
          shareHintSuppressed = false;
          delete dom.shareMenu.dataset.shareTooltipSuppressed;
          helpers.hideTopBarTooltip("share-button");
          if (shouldUseDesktopShareRail() && isShareMenuOpen() && !shareCopyFeedbackActive) {
            resetShareRailHint();
          }
        });

        dom.shareButton.addEventListener("blur", () => {
          shareHintSuppressed = false;
          delete dom.shareMenu.dataset.shareTooltipSuppressed;
          helpers.hideTopBarTooltip("share-button");
          if (shouldUseDesktopShareRail() && isShareMenuOpen() && !shareCopyFeedbackActive) {
            resetShareRailHint();
          }
        });
      }

      dom.shareMenu.addEventListener("mouseenter", () => {
        if (!shouldUseDesktopShareRail()) {
          return;
        }

        if (isPromoRedirectVisible()) {
          closeShareMenu();
          return;
        }

        openShareMenu();
      });

      dom.shareMenu.addEventListener("mouseleave", () => {
        if (shouldUseDesktopShareRail()) {
          if (shareCopyFeedbackActive) {
            return;
          }

          closeShareMenu();
        }
      });

      dom.shareMenu.addEventListener("focusin", () => {
        if (!shouldUseDesktopShareRail()) {
          return;
        }

        if (isPromoRedirectVisible()) {
          closeShareMenu();
          return;
        }

        openShareMenu();
      });

      dom.shareMenu.addEventListener("focusout", (event) => {
        if (!shouldUseDesktopShareRail() || dom.shareMenu.contains(event.relatedTarget)) {
          return;
        }

        closeShareMenu();
      });

      document.addEventListener("pointerdown", (event) => {
        if (!isShareMenuOpen() || dom.shareMenu.contains(event.target)) {
          return;
        }

        closeShareMenu();
      });

      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && isShareMenuOpen()) {
          closeShareMenu();
        }
      });

      document.addEventListener("pointermove", (event) => {
        if (event.pointerType && event.pointerType !== "mouse") {
          return;
        }

        if (
          !shouldUseDesktopShareRail() ||
          !isShareMenuOpen() ||
          shareCopyFeedbackActive ||
          isPromoRedirectVisible() ||
          isPointerInsideExpandedShareZone(event.clientX, event.clientY)
        ) {
          return;
        }

        closeShareMenu();
      });

      window.addEventListener("resize", () => {
        if (!shouldUseDesktopShareRail()) {
          closeShareMenu();
        }
      });
    }

    if (dom.themeToggle) {
      dom.themeToggle.addEventListener("mouseenter", () => {
        if (shouldUseDesktopShareRail()) {
          closeShareMenu();
        }
      });

      dom.themeToggle.addEventListener("focusin", () => {
        if (shouldUseDesktopShareRail()) {
          closeShareMenu();
        }
      });
    }
  };
})();
