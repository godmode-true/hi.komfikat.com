const root = document.documentElement;
const themeToggle = document.querySelector("[data-theme-toggle]");
const themeColorMeta = document.querySelector('meta[name="theme-color"]');
const storageKey = "komfi-theme";

function updateThemeColor() {
  if (!themeColorMeta) {
    return;
  }

  const pageBg = getComputedStyle(root).getPropertyValue("--page-bg").trim();
  if (pageBg) {
    themeColorMeta.setAttribute("content", pageBg);
  }
}

function setTheme(theme) {
  root.dataset.theme = theme;
  try {
    localStorage.setItem(storageKey, theme);
  } catch {}

  if (themeToggle) {
    const isDark = theme === "dark";
    const tooltipText = isDark ? "Switch to light mode" : "Switch to dark mode";
    themeToggle.setAttribute("aria-pressed", String(isDark));
    themeToggle.setAttribute("aria-label", tooltipText);
    themeToggle.setAttribute("data-tooltip", tooltipText);
  }

  updateThemeColor();
}

if (themeToggle) {
  let savedTheme = "light";
  try {
    savedTheme = localStorage.getItem(storageKey) || "light";
  } catch {}
  setTheme(savedTheme === "dark" ? "dark" : "light");

  themeToggle.addEventListener("click", () => {
    const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  });
} else {
  updateThemeColor();
}
