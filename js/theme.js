(() => {
  const App = window.KomfiKatApp;

  if (!App) {
    return;
  }

  const { dom, helpers, storageKeys } = App;
  const themePresets = window.KomfiKatThemePresets || {};
  const defaultPresetName = window.KomfiKatThemeConfig?.defaultPreset || "rose-cream";
  const allowStoredPresetOverride = window.KomfiKatThemeConfig?.allowStoredPresetOverride === true;

  function updateThemeColor() {
    if (!dom.themeColorMeta) {
      return;
    }

    const pageBg = getComputedStyle(dom.root).getPropertyValue("--page-bg").trim();

    if (pageBg) {
      dom.themeColorMeta.setAttribute("content", pageBg);
    }
  }

  function getAvailableThemePresets() {
    return Object.values(themePresets).map((preset) => ({
      id: preset.id,
      label: preset.label,
    }));
  }

  function resolvePresetName(name) {
    return themePresets[name] ? name : defaultPresetName;
  }

  function getStoredPresetName() {
    if (!allowStoredPresetOverride) {
      return defaultPresetName;
    }

    const savedPreset = helpers.readStorageValue(storageKeys.themePreset, defaultPresetName);
    return resolvePresetName(savedPreset || defaultPresetName);
  }

  function applyPresetTokens(theme, presetName) {
    const resolvedTheme = theme === "dark" ? "dark" : "light";
    const resolvedPresetName = resolvePresetName(presetName);
    const preset = themePresets[resolvedPresetName];
    const tokens = preset?.[resolvedTheme];

    if (!tokens) {
      return resolvedPresetName;
    }

    Object.entries(tokens).forEach(([token, value]) => {
      dom.root.style.setProperty(token, value);
    });

    dom.root.dataset.themePreset = resolvedPresetName;
    return resolvedPresetName;
  }

  function syncThemeToggle(theme) {
    if (!dom.themeToggle) {
      return;
    }

    const isDark = theme === "dark";
    const tooltipText = isDark ? "Switch to light mode" : "Switch to dark mode";
    dom.themeToggle.setAttribute("aria-pressed", String(isDark));
    dom.themeToggle.setAttribute("aria-label", tooltipText);
    dom.themeToggle.setAttribute("data-tooltip", tooltipText);
  }

  function setTheme(theme) {
    const resolvedTheme = theme === "dark" ? "dark" : "light";
    const presetName = getStoredPresetName();

    dom.root.dataset.theme = resolvedTheme;
    helpers.writeStorageValue(storageKeys.theme, resolvedTheme);
    applyPresetTokens(resolvedTheme, presetName);
    syncThemeToggle(resolvedTheme);
    updateThemeColor();
  }

  function setThemePreset(presetName, options = {}) {
    const resolvedPresetName = resolvePresetName(presetName);
    const currentTheme = dom.root.dataset.theme === "dark" ? "dark" : "light";
    const persist = allowStoredPresetOverride && options.persist === true;

    if (persist) {
      helpers.writeStorageValue(storageKeys.themePreset, resolvedPresetName);
    } else {
      helpers.removeStorageValue(storageKeys.themePreset);
    }

    applyPresetTokens(currentTheme, resolvedPresetName);
    updateThemeColor();
  }

  App.theme = {
    setTheme,
    setThemePreset,
    getAvailablePresets: getAvailableThemePresets,
    getActivePreset: () => dom.root.dataset.themePreset || getStoredPresetName(),
  };

  App.initTheme = function initTheme() {
    if (App.flags.themeInitialized) {
      return;
    }

    App.flags.themeInitialized = true;

    const savedTheme = helpers.readStorageValue(storageKeys.theme, "light");
    const initialTheme = savedTheme === "dark" ? "dark" : "light";
    const initialPreset = getStoredPresetName();

    if (!allowStoredPresetOverride) {
      helpers.removeStorageValue(storageKeys.themePreset);
    }

    applyPresetTokens(initialTheme, initialPreset);
    dom.root.dataset.theme = initialTheme;
    syncThemeToggle(initialTheme);
    updateThemeColor();

    dom.themeToggle?.addEventListener("click", () => {
      const nextTheme = dom.root.dataset.theme === "dark" ? "light" : "dark";
      setTheme(nextTheme);
    });
  };
})();
