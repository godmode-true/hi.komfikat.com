(() => {
  function clampChannel(value) {
    return Math.max(0, Math.min(255, Math.round(value)));
  }

  function hexToRgb(hex) {
    const value = hex.replace("#", "").trim();
    const normalized =
      value.length === 3
        ? value
            .split("")
            .map((part) => part + part)
            .join("")
        : value;

    return {
      r: Number.parseInt(normalized.slice(0, 2), 16),
      g: Number.parseInt(normalized.slice(2, 4), 16),
      b: Number.parseInt(normalized.slice(4, 6), 16),
    };
  }

  function rgbToHex({ r, g, b }) {
    return `#${[r, g, b].map((channel) => clampChannel(channel).toString(16).padStart(2, "0")).join("")}`;
  }

  function mixHex(first, second, amount = 0.5) {
    const a = hexToRgb(first);
    const b = hexToRgb(second);
    const ratio = Math.max(0, Math.min(1, amount));

    return rgbToHex({
      r: a.r + (b.r - a.r) * ratio,
      g: a.g + (b.g - a.g) * ratio,
      b: a.b + (b.b - a.b) * ratio,
    });
  }

  function rgba(hex, alpha) {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function verticalGradient(start, end) {
    return `linear-gradient(180deg, ${start} 0%, ${end} 100%)`;
  }

  function shellGradient(topGlow, start, end) {
    return `linear-gradient(180deg, ${topGlow} 0%, rgba(255, 255, 255, 0) 20%), ${verticalGradient(start, end)}`;
  }

  function createThemePreset({ id, label, light, dark, brand = {} }) {
    const lightAccentUiStart = light.accentUiStart || mixHex(light.accent, "#ffffff", 0.16);
    const lightAccentUiMid = light.accentUiMid || light.accent;
    const lightAccentUiEnd = light.accentUiEnd || mixHex(light.accent, light.accentSoft, 0.42);
    const lightAccentUiSolid = light.accentUiSolid || lightAccentUiMid;
    const darkAccentUiStart = dark.accentUiStart || mixHex(dark.accent, "#ffffff", 0.1);
    const darkAccentUiMid = dark.accentUiMid || dark.accent;
    const darkAccentUiEnd = dark.accentUiEnd || mixHex(dark.accent, dark.accentSoft, 0.42);
    const darkAccentUiSolid = dark.accentUiSolid || darkAccentUiMid;
    const lightSurfaceHoverSolid = mixHex(light.surface, light.accentSoft, 0.34);
    const lightSurfaceHover = verticalGradient(
      mixHex(light.surface, "#ffffff", 0.12),
      mixHex(light.surface, light.accentSoft, 0.42),
    );
    const darkSurfaceHoverSolid = mixHex(dark.surfaceSolid, dark.accent, 0.12);
    const darkSurfaceHover = verticalGradient(
      mixHex(dark.surface, dark.accentSoft, 0.16),
      mixHex(dark.surfaceSolid, dark.accent, 0.1),
    );
    const lightStorySurface = `radial-gradient(circle at top left, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0) 38%), ${verticalGradient(
      rgba(light.surface, 0.98),
      rgba(mixHex(light.surface, light.accentSoft, 0.36), 0.98),
    )}`;
    const darkStorySurface = `radial-gradient(circle at top left, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0) 34%), ${verticalGradient(
      rgba(dark.surface, 0.98),
      rgba(dark.surfaceSolid, 0.98),
    )}`;
    const lightStoryCta = verticalGradient(
      mixHex(light.surface, "#ffffff", 0.08),
      mixHex(light.surface, light.accentSoft, 0.22),
    );
    const darkStoryCta = verticalGradient(
      mixHex(dark.surface, dark.accentSoft, 0.14),
      mixHex(dark.surfaceSolid, dark.accent, 0.08),
    );

    return {
      id,
      label,
      light: {
        "--page-bg": light.pageBg,
        "--selection-bg": light.selectionBg || mixHex(light.pageBg, light.accentSoft, 0.7),
        "--selection-text": light.text,
        "--surface-panel": light.surface,
        "--surface-panel-muted": rgba(light.surface, 0.96),
        "--surface-panel-hover": lightSurfaceHover,
        "--surface-panel-hover-solid": lightSurfaceHoverSolid,
        "--surface-panel-dark": verticalGradient(dark.surface, dark.surfaceSolid),
        "--surface-panel-dark-hover": darkSurfaceHover,
        "--surface-panel-dark-solid": dark.surfaceSolid,
        "--surface-panel-dark-solid-hover": darkSurfaceHoverSolid,
        "--browser-chrome-color": light.browserChromeColor || mixHex(light.surface, light.accentSoft, 0.34),
        "--hint-surface": rgba(light.surface, 0.96),
        "--hint-surface-dark": rgba(dark.hintSurface || dark.surfaceSolid, 0.96),
        "--button-bg": light.surface,
        "--button-bg-hover": lightSurfaceHoverSolid,
        "--button-text": light.text,
        "--panel-text": light.text,
        "--panel-subtext": light.textMuted,
        "--top-control-bg-hover": lightSurfaceHoverSolid,
        "--top-control-shadow-hover": "none",
        "--profile-logo-bg": brand.logoBgLight || mixHex(light.surface, light.accentSoft, 0.34),
        "--profile-logo-bg-hover": brand.logoBgLightHover || mixHex(light.surface, light.accentSoft, 0.48),
        "--profile-logo-ring": brand.logoRingLight || mixHex(light.accentSoft, light.accent, 0.24),
        "--profile-logo-ring-hover": brand.logoRingLightHover || mixHex(light.accentSoft, light.accent, 0.38),
        "--profile-logo-image-filter": brand.logoFilterLight || "hue-rotate(-13deg) saturate(0.9) brightness(1.015)",
        "--profile-logo-image-filter-hover":
          brand.logoFilterLightHover || "hue-rotate(-15deg) saturate(0.92) brightness(1.02)",
        "--accent-ui-start": lightAccentUiStart,
        "--accent-ui-mid": lightAccentUiMid,
        "--accent-ui-end": lightAccentUiEnd,
        "--accent-ui-solid": lightAccentUiSolid,
        "--accent-ui-soft": rgba(lightAccentUiSolid, 0.34),
        "--accent-ui-outline": rgba(lightAccentUiSolid, 0.48),
        "--accent-ui-active-outline": rgba(mixHex(lightAccentUiStart, "#ffffff", 0.22), 0.42),
        "--accent-ui-shadow": rgba(lightAccentUiSolid, 0.22),
        "--accent-ui-shadow-strong": rgba(lightAccentUiMid, 0.18),
        "--profile-story-ring-start": light.ringStart || lightAccentUiStart,
        "--profile-story-ring-end": light.ringEnd || lightAccentUiEnd,
        "--profile-text": light.text,
        "--profile-subtext": light.textMuted,
        "--surface-border-soft": rgba(light.accentSoft, 0.52),
        "--surface-border-strong": rgba(light.accent, 0.4),
        "--promo-card-border": mixHex(light.accentSoft, "#ffffff", 0.18),
        "--promo-shell-surface":
          light.shellSurface ||
          shellGradient(
            rgba(light.surface, 0.72),
            mixHex(light.surface, light.accentSoft, 0.26),
            mixHex(light.surface, light.accentSoft, 0.44),
          ),
        "--social-link-bg": light.surface,
        "--scrollbar-track": light.scrollbarTrack || mixHex(light.pageBg, light.accentSoft, 0.5),
        "--scrollbar-thumb": light.scrollbarThumb || mixHex(light.accentSoft, light.accent, 0.36),
        "--scrollbar-thumb-hover": light.scrollbarThumbHover || mixHex(light.accentSoft, light.accent, 0.52),
        "--caret-color": light.caret || light.accent,
        "--story-viewed-ring-start": light.viewedRingStart || mixHex(light.accentSoft, light.surface, 0.35),
        "--story-viewed-ring-end": light.viewedRingEnd || mixHex(light.accentSoft, light.accent, 0.18),
        "--story-viewed-ring-shadow": light.viewedRingShadow || rgba(light.accent, 0.14),
        "--story-viewer-surface": light.storyViewerSurface || lightStorySurface,
        "--story-viewer-shadow":
          light.storyViewerShadow ||
          `0 28px 60px ${rgba(mixHex(light.text, light.accent, 0.3), 0.16)}, inset 0 1px 0 rgba(255, 255, 255, 0.82)`,
        "--story-viewer-progress-track":
          light.storyViewerProgressTrack || rgba(mixHex(light.textMuted, light.accentSoft, 0.45), 0.18),
        "--story-viewer-brand-mark-bg": light.storyViewerBrandMarkBg || rgba(light.surface, 0.9),
        "--story-viewer-title": light.storyViewerTitle || rgba(light.text, 0.88),
        "--story-viewer-media-bg": light.storyViewerMediaBg || mixHex(light.surface, light.accentSoft, 0.3),
        "--story-viewer-copy-shadow": light.storyViewerCopyShadow || rgba(light.surface, 0.6),
        "--story-viewer-cta-bg": light.storyViewerCtaBg || lightStoryCta,
        "--story-viewer-cta-hover": light.storyViewerCtaHover || lightSurfaceHover,
      },
      dark: {
        "--page-bg": dark.pageBg,
        "--selection-bg": dark.selectionBg || mixHex(dark.pageBg, dark.accent, 0.4),
        "--selection-text": dark.text,
        "--surface-panel": light.surface,
        "--surface-panel-muted": rgba(light.surface, 0.96),
        "--surface-panel-hover": lightSurfaceHover,
        "--surface-panel-hover-solid": lightSurfaceHoverSolid,
        "--surface-panel-dark": verticalGradient(dark.surface, dark.surfaceSolid),
        "--surface-panel-dark-hover": darkSurfaceHover,
        "--surface-panel-dark-solid": dark.surfaceSolid,
        "--surface-panel-dark-solid-hover": darkSurfaceHoverSolid,
        "--browser-chrome-color": dark.browserChromeColor || mixHex(dark.surfaceSolid, dark.accentSoft, 0.2),
        "--hint-surface": rgba(light.surface, 0.96),
        "--hint-surface-dark": rgba(dark.hintSurface || dark.surfaceSolid, 0.96),
        "--button-bg": dark.surfaceSolid,
        "--button-bg-hover": darkSurfaceHoverSolid,
        "--button-text": dark.text,
        "--panel-text": dark.panelText || dark.text,
        "--panel-subtext": dark.panelTextMuted || dark.textMuted,
        "--top-control-bg-hover": darkSurfaceHoverSolid,
        "--top-control-shadow-hover": "none",
        "--profile-logo-bg": brand.logoBgDark || mixHex(dark.surfaceSolid, dark.accentSoft, 0.18),
        "--profile-logo-bg-hover": brand.logoBgDarkHover || mixHex(dark.surfaceSolid, dark.accentSoft, 0.28),
        "--profile-logo-ring": brand.logoRingDark || mixHex(dark.accentSoft, dark.accent, 0.18),
        "--profile-logo-ring-hover": brand.logoRingDarkHover || mixHex(dark.accentSoft, dark.accent, 0.34),
        "--profile-logo-image-filter": brand.logoFilterDark || "hue-rotate(-11deg) saturate(0.9) brightness(1.02)",
        "--profile-logo-image-filter-hover":
          brand.logoFilterDarkHover || "hue-rotate(-13deg) saturate(0.92) brightness(1.025)",
        "--accent-ui-start": darkAccentUiStart,
        "--accent-ui-mid": darkAccentUiMid,
        "--accent-ui-end": darkAccentUiEnd,
        "--accent-ui-solid": darkAccentUiSolid,
        "--accent-ui-soft": rgba(darkAccentUiSolid, 0.34),
        "--accent-ui-outline": rgba(darkAccentUiSolid, 0.48),
        "--accent-ui-active-outline": rgba(mixHex(darkAccentUiStart, "#ffffff", 0.18), 0.26),
        "--accent-ui-shadow": rgba(darkAccentUiSolid, 0.24),
        "--accent-ui-shadow-strong": rgba(darkAccentUiMid, 0.3),
        "--profile-story-ring-start": dark.ringStart || darkAccentUiStart,
        "--profile-story-ring-end": dark.ringEnd || darkAccentUiEnd,
        "--profile-text": dark.text,
        "--profile-subtext": dark.textMuted,
        "--surface-border-soft": rgba(dark.accentSoft, 0.34),
        "--surface-border-strong": rgba(dark.accent, 0.46),
        "--promo-card-border": mixHex(dark.accentSoft, dark.accent, 0.34),
        "--promo-shell-surface":
          dark.shellSurface ||
          verticalGradient(mixHex(dark.surface, dark.accentSoft, 0.12), mixHex(dark.surfaceSolid, dark.accent, 0.08)),
        "--social-link-bg": dark.surfaceSolid,
        "--scrollbar-track": dark.scrollbarTrack || mixHex(dark.pageBg, dark.surfaceSolid, 0.38),
        "--scrollbar-thumb": dark.scrollbarThumb || mixHex(dark.accentSoft, dark.surfaceSolid, 0.45),
        "--scrollbar-thumb-hover": dark.scrollbarThumbHover || mixHex(dark.accentSoft, dark.accent, 0.32),
        "--caret-color": dark.caret || dark.accentSoft,
        "--story-viewed-ring-start": dark.viewedRingStart || mixHex(dark.accentSoft, dark.surfaceSolid, 0.3),
        "--story-viewed-ring-end": dark.viewedRingEnd || mixHex(dark.accentSoft, dark.accent, 0.2),
        "--story-viewed-ring-shadow": dark.viewedRingShadow || rgba("#000000", 0.18),
        "--story-viewer-surface": dark.storyViewerSurface || darkStorySurface,
        "--story-viewer-shadow":
          dark.storyViewerShadow || `0 28px 60px ${rgba("#000000", 0.42)}, inset 0 1px 0 rgba(255, 255, 255, 0.08)`,
        "--story-viewer-progress-track":
          dark.storyViewerProgressTrack || rgba(mixHex(dark.textMuted, dark.surfaceSolid, 0.35), 0.22),
        "--story-viewer-brand-mark-bg": dark.storyViewerBrandMarkBg || rgba(dark.surface, 0.92),
        "--story-viewer-title": dark.storyViewerTitle || rgba(dark.text, 0.86),
        "--story-viewer-media-bg": dark.storyViewerMediaBg || mixHex(dark.surface, dark.surfaceSolid, 0.55),
        "--story-viewer-copy-shadow": dark.storyViewerCopyShadow || rgba(dark.pageBg, 0.3),
        "--story-viewer-cta-bg": dark.storyViewerCtaBg || darkStoryCta,
        "--story-viewer-cta-hover": dark.storyViewerCtaHover || darkSurfaceHover,
      },
    };
  }

  function serializeThemeTokens(tokens) {
    return Object.entries(tokens)
      .map(([token, value]) => `  ${token}: ${value};`)
      .join("\n");
  }

  function ensureThemePresetStyles(presets) {
    const styleId = "komfi-theme-presets";
    const existingStyle = document.getElementById(styleId);
    const rules = Object.values(presets)
      .flatMap((preset) => {
        return [
          `:root[data-theme="light"][data-theme-preset="${preset.id}"] {\n${serializeThemeTokens(preset.light)}\n}`,
          `:root[data-theme="dark"][data-theme-preset="${preset.id}"] {\n${serializeThemeTokens(preset.dark)}\n}`,
        ];
      })
      .join("\n\n");

    if (existingStyle) {
      existingStyle.textContent = rules;
      return;
    }

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = rules;
    document.head.append(style);
  }

  const presets = {
    "default-rose": createThemePreset({
      id: "default-rose",
      label: "Default Rose",
      light: {
        pageBg: "#fffcfe",
        surface: "#fff8fb",
        browserChromeColor: "#fde7ef",
        selectionBg: "#f6eaf0",
        text: "#5f3442",
        textMuted: "#8a5a69",
        accent: "#ff8fa7",
        accentSoft: "#f7bcc8",
        shellSurface:
          "linear-gradient(180deg, rgba(255, 250, 251, 0.72) 0%, rgba(255, 250, 251, 0) 20%), linear-gradient(180deg, #faf4f5 0%, #f7eff1 100%)",
        scrollbarTrack: "#f7edf1",
        scrollbarThumb: "#d9b8c4",
        scrollbarThumbHover: "#cba0af",
        caret: "#c98d67",
      },
      dark: {
        pageBg: "#241e1a",
        browserChromeColor: "#4a3b40",
        selectionBg: "#6d4651",
        surface: "#4d4043",
        surfaceSolid: "#45373b",
        text: "#f7e7eb",
        textMuted: "#dfbcc6",
        panelText: "#f7e7eb",
        panelTextMuted: "#dfbcc6",
        accent: "#f7a4b6",
        accentSoft: "#e3b8c7",
        shellSurface: "linear-gradient(180deg, #55484a 0%, #4e4244 100%)",
        scrollbarTrack: "#33282d",
        scrollbarThumb: "#8a6874",
        scrollbarThumbHover: "#9c7683",
        caret: "#f2b085",
      },
    }),
    "burgundy-blush": createThemePreset({
      id: "burgundy-blush",
      label: "Burgundy Blush",
      light: {
        pageBg: "#fffafc",
        surface: "#fff6fa",
        text: "#562b3e",
        textMuted: "#7e5061",
        accent: "#b14d69",
        accentSoft: "#efc2cf",
        caret: "#b06b7d",
      },
      dark: {
        pageBg: "#21181d",
        surface: "#4a343d",
        surfaceSolid: "#402d35",
        text: "#f8e8ee",
        textMuted: "#ddb9c5",
        panelText: "#f8e8ee",
        panelTextMuted: "#ddb9c5",
        accent: "#e08ca4",
        accentSoft: "#c8a1ae",
        caret: "#d396a9",
      },
    }),
    "mocha-petal": createThemePreset({
      id: "mocha-petal",
      label: "Mocha Petal",
      light: {
        pageBg: "#f8f0ea",
        surface: "#f2e3db",
        text: "#5a4036",
        textMuted: "#7f645b",
        accent: "#bc7a86",
        accentSoft: "#dcc0c3",
        shellSurface:
          "linear-gradient(180deg, rgba(248, 240, 234, 0.74) 0%, rgba(248, 240, 234, 0) 20%), linear-gradient(180deg, #f1e4dd 0%, #e8d6cf 100%)",
        scrollbarTrack: "#ead9d2",
        scrollbarThumb: "#caa8a9",
        scrollbarThumbHover: "#b88f95",
        caret: "#c08a77",
      },
      dark: {
        pageBg: "#1f1816",
        surface: "#493933",
        surfaceSolid: "#40312c",
        text: "#f4e7e1",
        textMuted: "#d5beb6",
        panelText: "#f4e7e1",
        panelTextMuted: "#d5beb6",
        accent: "#d39aa3",
        accentSoft: "#b89fa2",
        shellSurface: "linear-gradient(180deg, #50403a 0%, #463731 100%)",
        scrollbarTrack: "#2c2320",
        scrollbarThumb: "#7c6767",
        scrollbarThumbHover: "#917777",
        caret: "#d39b88",
      },
    }),
    "holiday-spruce": createThemePreset({
      id: "holiday-spruce",
      label: "Holiday Spruce",
      light: {
        pageBg: "#f8f3ee",
        surface: "#f4ebe3",
        selectionBg: "#eed7d9",
        text: "#4f3a34",
        textMuted: "#78625a",
        accent: "#b84f5c",
        accentSoft: "#d6b3b6",
        accentUiStart: "#6fae7f",
        accentUiMid: "#d96673",
        accentUiEnd: "#bc505d",
        accentUiSolid: "#c95b67",
        shellSurface:
          "linear-gradient(180deg, rgba(248, 243, 238, 0.74) 0%, rgba(248, 243, 238, 0) 20%), linear-gradient(180deg, #efe4dc 0%, #e6d6cf 100%)",
        scrollbarTrack: "#e8ddd6",
        scrollbarThumb: "#b99399",
        scrollbarThumbHover: "#a77c84",
        caret: "#b36b63",
      },
      dark: {
        pageBg: "#171b18",
        selectionBg: "#5b3138",
        surface: "#314139",
        surfaceSolid: "#28352e",
        text: "#f5ece6",
        textMuted: "#d7c4bc",
        panelText: "#f5ece6",
        panelTextMuted: "#d7c4bc",
        accent: "#d98692",
        accentSoft: "#9eb3a4",
        accentUiStart: "#87c398",
        accentUiMid: "#ea9aa4",
        accentUiEnd: "#d57d89",
        accentUiSolid: "#e497a1",
        shellSurface: "linear-gradient(180deg, #394940 0%, #2f3d35 100%)",
        scrollbarTrack: "#232b26",
        scrollbarThumb: "#6f8278",
        scrollbarThumbHover: "#83958b",
        caret: "#d49c8d",
      },
    }),
  };

  window.KomfiKatThemeConfig = {
    defaultPreset: "default-rose",
    allowStoredPresetOverride: false,
  };

  window.KomfiKatThemeTokenKeys = Array.from(
    new Set(Object.values(presets).flatMap((preset) => [...Object.keys(preset.light), ...Object.keys(preset.dark)])),
  );
  window.KomfiKatThemePresets = presets;
  ensureThemePresetStyles(presets);
})();
