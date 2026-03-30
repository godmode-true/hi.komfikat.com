(() => {
  const App = window.KomfiKatApp;

  if (!App) {
    return;
  }

  const { dom, helpers, storageKeys } = App;
  const themePresets = window.KomfiKatThemePresets || {};
  const managedThemeTokenKeys = window.KomfiKatThemeTokenKeys || [];
  const htmlDefaultPresetName = dom.root.dataset.defaultPreset || dom.root.dataset.themePreset || "default-rose";
  const defaultPresetName = window.KomfiKatThemeConfig?.defaultPreset || htmlDefaultPresetName || "default-rose";
  const allowStoredPresetOverride = window.KomfiKatThemeConfig?.allowStoredPresetOverride === true;

  function updateThemeColor() {
    if (!dom.themeColorMeta) {
      return;
    }

    const browserChromeColor =
      getComputedStyle(dom.root).getPropertyValue("--browser-chrome-color").trim() ||
      getComputedStyle(dom.root).getPropertyValue("--page-bg").trim();

    if (browserChromeColor) {
      dom.themeColorMeta.setAttribute("content", browserChromeColor);
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

  function clearManagedTokenOverrides() {
    managedThemeTokenKeys.forEach((token) => {
      dom.root.style.removeProperty(token);
    });
  }

  function applyPresetTokens(theme, presetName) {
    const resolvedTheme = theme === "dark" ? "dark" : "light";
    const resolvedPresetName = resolvePresetName(presetName);
    const preset = themePresets[resolvedPresetName];
    const tokens = preset?.[resolvedTheme];

    if (!tokens) {
      return resolvedPresetName;
    }

    clearManagedTokenOverrides();
    dom.root.dataset.theme = resolvedTheme;
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

    clearManagedTokenOverrides();
    applyPresetTokens(initialTheme, initialPreset);
    syncThemeToggle(initialTheme);
    updateThemeColor();

    dom.themeToggle?.addEventListener("click", () => {
      const nextTheme = dom.root.dataset.theme === "dark" ? "light" : "dark";
      setTheme(nextTheme);
    });
  };
})();
