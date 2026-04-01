/**
 * Share entry point: native Web Share API fallback, desktop `<dialog>`, copy-to-clipboard feedback.
 */
(() => {
  const App = window.KomfiKatApp;

  if (!App) {
    return;
  }

  const { dom, helpers } = App;
  const shareCopyFeedbackDurationMs = 1100;

  let shareCopyFeedbackTimeout = 0;
  let restoreShareButtonFocusOnClose = false;

  function shouldUseNativeShare() {
    return typeof navigator.share === "function";
  }

  function canUseDesktopShareDialog() {
    return helpers.isDesktopPointerDevice() && !!dom.shareDialog && typeof dom.shareDialog.showModal === "function";
  }

  function getSharePayload() {
    const url = dom.canonicalLink?.href || window.location.href;
    const title = document.title;
    const text = dom.metaDescription?.content || "Cozy hand-drawn coloring books by Komfi Kat.";
    const ogTitle = document.querySelector('meta[property="og:title"]')?.content || title;
    const ogDescription = document.querySelector('meta[property="og:description"]')?.content || text;
    const ogImageUrl =
      document.querySelector('meta[property="og:image"]')?.content ||
      new URL("img/logo.webp", url).href;

    return {
      url,
      title,
      text,
      shareTitle: ogTitle,
      shareDescription: ogDescription,
      imageUrl: ogImageUrl,
      message: `Take a cozy peek at Komfi Kat. ${text} ${url}`,
    };
  }

  function isShareMenuOpen() {
    return dom.shareMenu?.dataset.shareMenuOpen === "true";
  }

  function isPromoRedirectVisible() {
    return App.isPromoRedirectVisible?.() === true;
  }

  function syncShareMenuState(isOpen) {
    if (!dom.shareMenu || !dom.shareButton) {
      return;
    }

    if (isOpen) {
      dom.shareMenu.dataset.shareMenuOpen = "true";
    } else {
      delete dom.shareMenu.dataset.shareMenuOpen;
    }

    dom.shareButton.setAttribute("aria-expanded", String(isOpen));
  }

  function resetShareButtonState() {
    if (!dom.shareButton) {
      return;
    }

    dom.shareButton.setAttribute("aria-label", "Share");
  }

  function hideShareCopyFeedback() {
    window.clearTimeout(shareCopyFeedbackTimeout);
    shareCopyFeedbackTimeout = 0;

    if (dom.shareCopyFeedbackWrap) {
      delete dom.shareCopyFeedbackWrap.dataset.promoRedirectActive;
    }

    if (dom.shareCopyFeedbackOverlay) {
      dom.shareCopyFeedbackOverlay.setAttribute("aria-hidden", "true");
    }
  }

  function clearShareTransientState() {
    hideShareCopyFeedback();
    App.dismissPromoRedirectToast?.();
    resetShareButtonState();
  }

  function syncDesktopShareLinks() {
    const sharePayload = getSharePayload();

    dom.shareOptions.forEach((shareOption) => {
      if (!(shareOption instanceof HTMLAnchorElement)) {
        return;
      }

      const option = shareOption.dataset.shareOption;

      if (option === "whatsapp") {
        shareOption.href = `https://wa.me/?text=${encodeURIComponent(sharePayload.message)}`;
        return;
      }

      if (option === "messenger") {
        shareOption.href =
          `https://www.facebook.com/dialog/send?display=popup&app_id=1217981644879628&link=${encodeURIComponent(sharePayload.url)}` +
          `&redirect_uri=${encodeURIComponent(sharePayload.url)}`;
        return;
      }

      if (option === "imessage") {
        shareOption.href = `sms:&body=${encodeURIComponent(sharePayload.message)}`;
        return;
      }

      if (option === "facebook") {
        shareOption.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(sharePayload.url)}`;
        return;
      }

      if (option === "x") {
        shareOption.href =
          `https://twitter.com/intent/tweet?url=${encodeURIComponent(sharePayload.url)}` +
          `&text=${encodeURIComponent(`Take a cozy peek at Komfi Kat. ${sharePayload.shareDescription}`)}`;
        return;
      }

      if (option === "reddit") {
        shareOption.href =
          `https://www.reddit.com/submit?url=${encodeURIComponent(sharePayload.url)}` +
          `&title=${encodeURIComponent(sharePayload.shareTitle)}`;
        return;
      }

      if (option === "pinterest") {
        shareOption.href =
          `https://www.pinterest.com/pin/create/button/?url=${encodeURIComponent(sharePayload.url)}` +
          `&media=${encodeURIComponent(sharePayload.imageUrl)}` +
          `&description=${encodeURIComponent(sharePayload.shareTitle)}`;
      }
    });
  }

  function applyShareDialogOpenState() {
    syncShareMenuState(true);
    document.body.classList.add("share-dialog-is-open");
  }

  function applyShareDialogClosedState({ restoreFocus = false } = {}) {
    syncShareMenuState(false);
    document.body.classList.remove("share-dialog-is-open");
    helpers.scheduleIdleTopBarTooltipRestore();

    if (restoreFocus && dom.shareButton instanceof HTMLElement) {
      dom.shareButton.focus({ preventScroll: true });
    }
  }

  function openShareMenu() {
    if (!canUseDesktopShareDialog()) {
      return;
    }

    if (isPromoRedirectVisible()) {
      closeShareMenu({ restoreFocus: false });
      return;
    }

    clearShareTransientState();
    syncDesktopShareLinks();
    restoreShareButtonFocusOnClose = false;

    if (!dom.shareDialog?.open) {
      dom.shareDialog.showModal();
    }

    applyShareDialogOpenState();

    window.requestAnimationFrame(() => {
      const firstOption = dom.shareOptions[0];

      if (firstOption instanceof HTMLElement) {
        firstOption.focus({ preventScroll: true });
      }
    });
  }

  function closeShareMenu(options = {}) {
    const restoreFocus = options.restoreFocus !== false;
    restoreShareButtonFocusOnClose = restoreFocus;

    if (dom.shareDialog?.open) {
      dom.shareDialog.close();
      return;
    }

    applyShareDialogClosedState({ restoreFocus });
  }

  function hideShareStickyUi() {
    clearShareTransientState();
    closeShareMenu({ restoreFocus: false });
  }

  function showShareCopiedState() {
    if (!dom.shareCopyFeedbackWrap || !dom.shareCopyFeedbackOverlay) {
      closeShareMenu({ restoreFocus: false });
      return;
    }

    hideShareCopyFeedback();
    dom.shareCopyFeedbackWrap.dataset.promoRedirectActive = "true";
    dom.shareCopyFeedbackOverlay.setAttribute("aria-hidden", "false");

    shareCopyFeedbackTimeout = window.setTimeout(() => {
      hideShareCopyFeedback();
      closeShareMenu({ restoreFocus: false });
    }, shareCopyFeedbackDurationMs);
  }

  App.showShareCopiedState = showShareCopiedState;
  App.hideShareStickyUi = hideShareStickyUi;

  function bindShareOptionEvents(shareOption) {
    if (shareOption.dataset.shareOption !== "copy") {
      return;
    }

    shareOption.addEventListener("click", async () => {
      const sharePayload = getSharePayload();
      const didCopy = await helpers.copyText(sharePayload.url);

      if (didCopy) {
        showShareCopiedState();
      }
    });
  }

  App.initShare = function initShare() {
    if (App.flags.shareInitialized) {
      return;
    }

    App.flags.shareInitialized = true;
    syncDesktopShareLinks();

    if (dom.shareButton) {
      dom.shareButton.addEventListener("click", async (event) => {
        if (isPromoRedirectVisible()) {
          event.preventDefault();
          closeShareMenu({ restoreFocus: false });
          return;
        }

        if (canUseDesktopShareDialog()) {
          event.preventDefault();

          if (isShareMenuOpen()) {
            closeShareMenu();
          } else {
            openShareMenu();
          }
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

        await helpers.copyText(sharePayload.url);
      });
    }

    if (dom.shareOptions.length) {
      dom.shareOptions.forEach(bindShareOptionEvents);
    }

    if (dom.shareDialogCloseButtons.length) {
      dom.shareDialogCloseButtons.forEach((button) => {
        button.addEventListener("click", () => {
          closeShareMenu();
        });
      });
    }

    if (dom.shareDialog) {
      dom.shareDialog.addEventListener("cancel", (event) => {
        event.preventDefault();
        closeShareMenu();
      });

      dom.shareDialog.addEventListener("close", () => {
        const restoreFocus = restoreShareButtonFocusOnClose;
        restoreShareButtonFocusOnClose = false;
        applyShareDialogClosedState({ restoreFocus });
      });
    }

    window.addEventListener("resize", () => {
      if (!canUseDesktopShareDialog()) {
        closeShareMenu({ restoreFocus: false });
      }
    });

    const closeShareMenuIfDesktopDialog = () => {
      if (canUseDesktopShareDialog()) {
        closeShareMenu({ restoreFocus: false });
      }
    };

    dom.themeToggle?.addEventListener("mouseenter", closeShareMenuIfDesktopDialog);
    dom.themeToggle?.addEventListener("focusin", closeShareMenuIfDesktopDialog);
  };
})();
