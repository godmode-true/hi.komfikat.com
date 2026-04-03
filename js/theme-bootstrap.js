/**
 * Runs after `themes/theme-presets.js` (sync) and at the start of `site.bundle.js` (defer).
 * Sets `data-theme` / `data-theme-preset` + meta theme-color before feature modules execute.
 */
(() => {
  try {
    const root = document.documentElement;
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    const savedTheme = localStorage.getItem("komfi-theme");
    const initialTheme = savedTheme === "dark" ? "dark" : "light";
    const defaultPreset =
      window.KomfiKatThemeConfig?.defaultPreset || root.dataset.defaultPreset || "default-rose-2";
    const preset = window.KomfiKatThemePresets?.[defaultPreset];
    const initialThemeTokens = preset?.[initialTheme];
    const initialThemeColor =
      initialThemeTokens?.["--browser-chrome-color"] || (initialTheme === "dark" ? "#4a3b40" : "#fde7ef");
    root.dataset.theme = initialTheme;
    root.dataset.themePreset = defaultPreset;
    if (themeColorMeta) {
      themeColorMeta.setAttribute("content", initialThemeColor);
    }
  } catch {}
})();
