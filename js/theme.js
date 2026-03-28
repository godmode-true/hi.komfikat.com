(() => {
  const App = window.KomfiKatApp;

  if (!App) {
    return;
  }

  const { dom, helpers, storageKeys } = App;

  function updateThemeColor() {
    if (!dom.themeColorMeta) {
      return;
    }

    const pageBg = getComputedStyle(dom.root).getPropertyValue("--page-bg").trim();

    if (pageBg) {
      dom.themeColorMeta.setAttribute("content", pageBg);
    }
  }

  function setTheme(theme) {
    dom.root.dataset.theme = theme;
    helpers.writeStorageValue(storageKeys.theme, theme);

    if (dom.themeToggle) {
      const isDark = theme === "dark";
      const tooltipText = isDark ? "Switch to light mode" : "Switch to dark mode";
      dom.themeToggle.setAttribute("aria-pressed", String(isDark));
      dom.themeToggle.setAttribute("aria-label", tooltipText);
      dom.themeToggle.setAttribute("data-tooltip", tooltipText);
    }

    updateThemeColor();
  }

  App.initTheme = function initTheme() {
    if (App.flags.themeInitialized) {
      return;
    }

    App.flags.themeInitialized = true;

    if (dom.themeToggle) {
      const savedTheme = helpers.readStorageValue(storageKeys.theme, "light");
      setTheme(savedTheme === "dark" ? "dark" : "light");

      dom.themeToggle.addEventListener("click", () => {
        const nextTheme = dom.root.dataset.theme === "dark" ? "light" : "dark";
        setTheme(nextTheme);
      });
      return;
    }

    updateThemeColor();
  };
})();
