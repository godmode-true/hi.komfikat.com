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
        "--sticky-bar-surface": rgba(light.surface, 0.5),
        "--chrome-bar-surface": rgba(light.surface, 0.5),
        "--sticky-bar-border": rgba(light.accentSoft, 0.42),
        "--sticky-bar-shadow": `0 12px 28px ${rgba(mixHex(light.text, light.accentSoft, 0.38), 0.11)}`,
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
        "--sticky-bar-surface": rgba(dark.surfaceSolid, 0.54),
        "--chrome-bar-surface": rgba(dark.surfaceSolid, 0.54),
        "--sticky-bar-border": rgba(dark.accentSoft, 0.3),
        "--sticky-bar-shadow": `0 12px 30px ${rgba("#000000", 0.26)}`,
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
    "default-rose-2": createThemePreset({
      id: "default-rose-2",
      label: "Default Rose 2",
      light: {
        pageBg: "#fdeef6",
        surface: "#fff9fc",
        browserChromeColor: "#f6cce2",
        selectionBg: "#ffd6ec",
        text: "#68374c",
        textMuted: "#a36880",
        accent: "#f06b9a",
        accentSoft: "#fab6dc",
        shellSurface:
          "linear-gradient(180deg, rgba(255, 248, 252, 0.94) 0%, rgba(255, 248, 252, 0) 20%), linear-gradient(180deg, #fcf4f9 0%, #f5eaf3 100%)",
        scrollbarTrack: "#f4e0ed",
        scrollbarThumb: "#f080c0",
        scrollbarThumbHover: "#e88fba",
        caret: "#dc6a9e",
      },
      dark: {
        pageBg: "#261922",
        browserChromeColor: "#4c3642",
        selectionBg: "#5e4a58",
        surface: "#4e404a",
        surfaceSolid: "#44363e",
        text: "#f7eaf0",
        textMuted: "#e4c0d3",
        panelText: "#f7eaf0",
        panelTextMuted: "#e4c0d3",
        accent: "#ffb0dc",
        accentSoft: "#be8a9e",
        shellSurface: "linear-gradient(180deg, #584650 0%, #4c3e48 100%)",
        scrollbarTrack: "#3a2a34",
        scrollbarThumb: "#ce8aa8",
        scrollbarThumbHover: "#dc9ab8",
        caret: "#ffc2eb",
      },
    }),
    "default-green": createThemePreset({
      id: "default-green",
      label: "Default Green",
      light: {
        pageBg: "#f7faf8",
        surface: "#f2f7f4",
        browserChromeColor: "#e5efe9",
        selectionBg: "#dcebe2",
        text: "#3d4a42",
        textMuted: "#6d7a72",
        accent: "#a3c9b4",
        accentSoft: "#d0e8dc",
        shellSurface:
          "linear-gradient(180deg, rgba(247, 250, 248, 0.8) 0%, rgba(247, 250, 248, 0) 20%), linear-gradient(180deg, #eef6f2 0%, #e8f0ec 100%)",
        scrollbarTrack: "#e2ebe6",
        scrollbarThumb: "#b8d0c4",
        scrollbarThumbHover: "#a8c4b8",
        caret: "#88a898",
      },
      dark: {
        pageBg: "#1e2420",
        browserChromeColor: "#3a4440",
        selectionBg: "#485448",
        surface: "#3a423e",
        surfaceSolid: "#343a38",
        text: "#e8f0ec",
        textMuted: "#b8c4bc",
        panelText: "#e8f0ec",
        panelTextMuted: "#b8c4bc",
        accent: "#b8d4c4",
        accentSoft: "#5a7068",
        shellSurface: "linear-gradient(180deg, #444e48 0%, #3e4642 100%)",
        scrollbarTrack: "#2c322e",
        scrollbarThumb: "#6a8078",
        scrollbarThumbHover: "#7a9086",
        caret: "#c0d8cc",
      },
    }),
    "default-green-2": createThemePreset({
      id: "default-green-2",
      label: "Default Green 2",
      light: {
        pageBg: "#ecf6f0",
        surface: "#f7fcfa",
        browserChromeColor: "#ddeee4",
        selectionBg: "#d4e8dc",
        text: "#3a4a42",
        textMuted: "#6a7a72",
        accent: "#9dccb8",
        accentSoft: "#c8eadc",
        accentUiStart: "#b8dcc8",
        accentUiMid: "#9dccb8",
        accentUiEnd: "#88b8a4",
        accentUiSolid: "#a8d4c0",
        shellSurface:
          "linear-gradient(180deg, rgba(240, 250, 245, 0.9) 0%, rgba(240, 250, 245, 0) 22%), linear-gradient(180deg, #f0f9f4 0%, #e8f4ec 100%)",
        scrollbarTrack: "#d8ece2",
        scrollbarThumb: "#a8d0c0",
        scrollbarThumbHover: "#98c4b4",
        caret: "#78a890",
      },
      dark: {
        pageBg: "#1a221e",
        browserChromeColor: "#384840",
        selectionBg: "#455650",
        surface: "#38463e",
        surfaceSolid: "#303c36",
        text: "#e8f4ee",
        textMuted: "#a8c4b8",
        panelText: "#e8f4ee",
        panelTextMuted: "#a8c4b8",
        accent: "#b0dcc8",
        accentSoft: "#5a7868",
        accentUiStart: "#c0e8d4",
        accentUiMid: "#b0dcc8",
        accentUiEnd: "#98c8b4",
        accentUiSolid: "#b8e0d0",
        shellSurface: "linear-gradient(180deg, #405048 0%, #384840 100%)",
        scrollbarTrack: "#28302c",
        scrollbarThumb: "#648878",
        scrollbarThumbHover: "#749688",
        caret: "#c8e8dc",
      },
    }),
    "default-yellow": createThemePreset({
      id: "default-yellow",
      label: "Default Yellow",
      light: {
        pageBg: "#fffef9",
        surface: "#fffbf5",
        browserChromeColor: "#f8f2e4",
        selectionBg: "#f5edd8",
        text: "#5a5040",
        textMuted: "#8a8070",
        accent: "#e8d4a8",
        accentSoft: "#f5ead0",
        shellSurface:
          "linear-gradient(180deg, rgba(255, 254, 249, 0.8) 0%, rgba(255, 254, 249, 0) 20%), linear-gradient(180deg, #faf6ec 0%, #f5f0e4 100%)",
        scrollbarTrack: "#f2ead8",
        scrollbarThumb: "#dcc8a0",
        scrollbarThumbHover: "#d0bc94",
        caret: "#c4a878",
      },
      dark: {
        pageBg: "#222018",
        browserChromeColor: "#464238",
        selectionBg: "#545048",
        surface: "#484438",
        surfaceSolid: "#403c34",
        text: "#faf6e8",
        textMuted: "#d8d0b8",
        panelText: "#faf6e8",
        panelTextMuted: "#d8d0b8",
        accent: "#e8d8a8",
        accentSoft: "#908860",
        shellSurface: "linear-gradient(180deg, #524c40 0%, #484438 100%)",
        scrollbarTrack: "#343028",
        scrollbarThumb: "#988860",
        scrollbarThumbHover: "#a89870",
        caret: "#f0e0b0",
      },
    }),
    "default-yellow-2": createThemePreset({
      id: "default-yellow-2",
      label: "Default Yellow 2",
      light: {
        pageBg: "#fff8ec",
        surface: "#fffdf8",
        browserChromeColor: "#f8ead0",
        selectionBg: "#f5e4c8",
        text: "#5a5040",
        textMuted: "#8a7860",
        accent: "#edd8a0",
        accentSoft: "#f8ecd0",
        accentUiStart: "#f0e0b0",
        accentUiMid: "#edd8a0",
        accentUiEnd: "#e5d090",
        accentUiSolid: "#f0dc98",
        shellSurface:
          "linear-gradient(180deg, rgba(255, 252, 245, 0.9) 0%, rgba(255, 252, 245, 0) 22%), linear-gradient(180deg, #fffaf0 0%, #f8f2e4 100%)",
        scrollbarTrack: "#f0e4c8",
        scrollbarThumb: "#e0d0a0",
        scrollbarThumbHover: "#d8c890",
        caret: "#c4a870",
      },
      dark: {
        pageBg: "#221c10",
        browserChromeColor: "#484030",
        selectionBg: "#585040",
        surface: "#4a4438",
        surfaceSolid: "#403c30",
        text: "#fff8e8",
        textMuted: "#d8c8a0",
        panelText: "#fff8e8",
        panelTextMuted: "#d8c8a0",
        accent: "#f0d898",
        accentSoft: "#908058",
        accentUiStart: "#f8e0a8",
        accentUiMid: "#f0d898",
        accentUiEnd: "#e8d080",
        accentUiSolid: "#f0dc98",
        shellSurface: "linear-gradient(180deg, #524c40 0%, #484438 100%)",
        scrollbarTrack: "#383028",
        scrollbarThumb: "#a09068",
        scrollbarThumbHover: "#b0a078",
        caret: "#f8e8b8",
      },
    }),
    "default-beige": createThemePreset({
      id: "default-beige",
      label: "Default Beige",
      light: {
        pageBg: "#faf8f4",
        surface: "#f6f2ea",
        browserChromeColor: "#eee8dc",
        selectionBg: "#e8e2d8",
        text: "#504840",
        textMuted: "#7a7268",
        accent: "#cfc4b4",
        accentSoft: "#e8e0d4",
        shellSurface:
          "linear-gradient(180deg, rgba(250, 248, 244, 0.8) 0%, rgba(250, 248, 244, 0) 20%), linear-gradient(180deg, #f2ebe4 0%, #ece6dc 100%)",
        scrollbarTrack: "#e8e2d8",
        scrollbarThumb: "#c8c0b0",
        scrollbarThumbHover: "#bcb4a4",
        caret: "#a89888",
      },
      dark: {
        pageBg: "#1f1c18",
        browserChromeColor: "#403c38",
        selectionBg: "#4e4840",
        surface: "#444038",
        surfaceSolid: "#3c3832",
        text: "#f2eae0",
        textMuted: "#c8c0b4",
        panelText: "#f2eae0",
        panelTextMuted: "#c8c0b4",
        accent: "#d4c8b8",
        accentSoft: "#706860",
        shellSurface: "linear-gradient(180deg, #484440 0%, #403c36 100%)",
        scrollbarTrack: "#302c28",
        scrollbarThumb: "#807468",
        scrollbarThumbHover: "#908478",
        caret: "#e0d4c8",
      },
    }),
    "default-beige-2": createThemePreset({
      id: "default-beige-2",
      label: "Default Beige 2",
      light: {
        pageBg: "#f2ebe2",
        surface: "#faf6f0",
        browserChromeColor: "#e4dcd0",
        selectionBg: "#dcd4c8",
        text: "#484038",
        textMuted: "#786e62",
        accent: "#c8b8a8",
        accentSoft: "#e8dfd4",
        accentUiStart: "#d4c8b8",
        accentUiMid: "#c8b8a8",
        accentUiEnd: "#b8a898",
        accentUiSolid: "#d0c4b4",
        shellSurface:
          "linear-gradient(180deg, rgba(252, 248, 242, 0.9) 0%, rgba(252, 248, 242, 0) 22%), linear-gradient(180deg, #f6f0e8 0%, #efe8dc 100%)",
        scrollbarTrack: "#e0d8cc",
        scrollbarThumb: "#c8bca8",
        scrollbarThumbHover: "#bcb09c",
        caret: "#988878",
      },
      dark: {
        pageBg: "#201c14",
        browserChromeColor: "#403830",
        selectionBg: "#504840",
        surface: "#464038",
        surfaceSolid: "#3c3630",
        text: "#f4ece0",
        textMuted: "#c8bca8",
        panelText: "#f4ece0",
        panelTextMuted: "#c8bca8",
        accent: "#dcc8b0",
        accentSoft: "#786858",
        accentUiStart: "#e4d4c0",
        accentUiMid: "#dcc8b0",
        accentUiEnd: "#d0b8a0",
        accentUiSolid: "#e0d0b8",
        shellSurface: "linear-gradient(180deg, #4c4438 0%, #443c34 100%)",
        scrollbarTrack: "#302c24",
        scrollbarThumb: "#887868",
        scrollbarThumbHover: "#988878",
        caret: "#e8d8c0",
      },
    }),
  };

  window.KomfiKatThemeConfig = {
    // Pairs: default-* (airy pastel) / default-*-2 (a touch more tint; all accents stay soft pastel).
    // After changing defaultPreset, run: npm run sync:theme-preset (updates index.html data-default-preset).
    defaultPreset: "default-rose-2",
    allowStoredPresetOverride: false,
  };

  window.KomfiKatThemeTokenKeys = Array.from(
    new Set(Object.values(presets).flatMap((preset) => [...Object.keys(preset.light), ...Object.keys(preset.dark)])),
  );
  window.KomfiKatThemePresets = presets;
  ensureThemePresetStyles(presets);
})();
