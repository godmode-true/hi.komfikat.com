(() => {
  const App = window.KomfiKatApp;

  if (!App) {
    return;
  }

  const { dom, helpers } = App;
  const shareMessages = {
    defaultHint: "Share with your friend 👉",
    copiedHint: "Link copied!",
  };

  let shareTooltipTimeout = 0;
  let shareRailHintTimeout = 0;
  let shareHintSuppressed = false;

  function shouldUseNativeShare() {
    if (typeof navigator.share !== "function") {
      return false;
    }

    return helpers.isTouchLikeDevice();
  }

  function shouldUseDesktopShareRail() {
    return helpers.isDesktopPointerDevice();
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

  function setShareRailHint(text = shareMessages.defaultHint) {
    if (!dom.shareRailHint || !dom.shareMenu) {
      return;
    }

    if (text === shareMessages.copiedHint) {
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
    }

    window.clearTimeout(shareRailHintTimeout);
  }

  function resetShareButtonState() {
    if (!dom.shareButton) {
      return;
    }

    dom.shareButton.dataset.shareState = "";
    dom.shareButton.setAttribute("data-tooltip", "Share with a friend");
    dom.shareButton.setAttribute("aria-label", "Share");
  }

  function closeShareMenu() {
    if (!dom.shareMenu || !dom.shareButton) {
      return;
    }

    resetShareRailHint();
    delete dom.shareMenu.dataset.shareMenuOpen;
    dom.shareButton.setAttribute("aria-expanded", "false");
  }

  function openShareMenu() {
    if (!dom.shareMenu || !dom.shareButton) {
      return;
    }

    window.clearTimeout(shareTooltipTimeout);
    resetShareButtonState();
    delete dom.shareMenu.dataset.shareTooltipSuppressed;
    delete dom.shareMenu.dataset.shareHintVisible;
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

  function showShareCopyButtonState() {
    if (!dom.shareCopyButton || !shouldUseDesktopShareRail()) {
      return;
    }

    window.clearTimeout(shareRailHintTimeout);
    setShareRailHint(shareMessages.copiedHint);
    shareRailHintTimeout = window.setTimeout(() => {
      if (!isShareMenuOpen()) {
        return;
      }

      resetShareRailHint();
    }, 1800);
  }

  function showShareCopiedState() {
    if (!dom.shareButton) {
      return;
    }

    closeShareMenu();
    window.clearTimeout(shareTooltipTimeout);
    dom.shareButton.dataset.shareState = "copied";
    dom.shareButton.setAttribute("data-tooltip", shareMessages.copiedHint);
    dom.shareButton.setAttribute("aria-label", shareMessages.copiedHint);
    shareTooltipTimeout = window.setTimeout(() => {
      resetShareButtonState();
    }, 1800);
  }

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
          if (shouldUseDesktopShareRail() && isShareMenuOpen() && !shareHintSuppressed) {
            setShareRailHint();
          }
        });

        dom.shareButton.addEventListener("focus", () => {
          if (shouldUseDesktopShareRail() && isShareMenuOpen() && !shareHintSuppressed) {
            setShareRailHint();
          }
        });

        dom.shareButton.addEventListener("mouseleave", () => {
          shareHintSuppressed = false;
          delete dom.shareMenu.dataset.shareTooltipSuppressed;
          if (shouldUseDesktopShareRail() && isShareMenuOpen()) {
            resetShareRailHint();
          }
        });

        dom.shareButton.addEventListener("blur", () => {
          shareHintSuppressed = false;
          delete dom.shareMenu.dataset.shareTooltipSuppressed;
          if (shouldUseDesktopShareRail() && isShareMenuOpen()) {
            resetShareRailHint();
          }
        });
      }

      dom.shareMenu.addEventListener("mouseenter", () => {
        if (shouldUseDesktopShareRail()) {
          openShareMenu();
        }
      });

      dom.shareMenu.addEventListener("mouseleave", () => {
        if (shouldUseDesktopShareRail()) {
          closeShareMenu();
        }
      });

      dom.shareMenu.addEventListener("focusin", () => {
        if (shouldUseDesktopShareRail()) {
          openShareMenu();
        }
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
