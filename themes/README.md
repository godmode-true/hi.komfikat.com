# Theme Presets

Theme presets live in [theme-presets.js](/c:/Users/vladi/Desktop/github-projects/hi.komfikat.com/themes/theme-presets.js).

Each preset drives both `light` and `dark` mode from one source and is applied by [theme.js](/c:/Users/vladi/Desktop/github-projects/hi.komfikat.com/js/theme.js).

By default, the active theme for all users comes from `defaultPreset` in [theme-presets.js](/c:/Users/vladi/Desktop/github-projects/hi.komfikat.com/themes/theme-presets.js). Browser-side preset persistence is disabled unless you explicitly turn it on.

## Covered by presets

- Page background
- Primary and secondary text
- `selection` colors
- Scrollbar track / thumb / hover
- Base button and icon surfaces
- Light and dark hover surfaces
- Borders and card outlines
- Carousel shell and CTA cards
- Link cards
- Share rail buttons
- Tooltip / hint backgrounds
- Story rings, including viewed state
- Story viewer modal surface, CTA, media frame, progress track and brand chip
- Logo frame colors and logo filter

## Current presets

Rose: `default-rose`, `default-rose-2` (both pastel; Rose 2 is a softer blush tint).

Green: `default-green`, `default-green-2`.

Yellow: `default-yellow`, `default-yellow-2`.

Beige: `default-beige`, `default-beige-2`.

## How to switch presets

Temporary preview in the current browser session:

```js
window.KomfiKatApp.theme.setThemePreset("default-green-2");
```

This does not override the site-wide default permanently.

Available presets:

```js
window.KomfiKatApp.theme.getAvailablePresets();
```

## Adding a new preset

Add a new `createThemePreset({...})` entry in [theme-presets.js](/c:/Users/vladi/Desktop/github-projects/hi.komfikat.com/themes/theme-presets.js).

To make that preset the default for everyone, also update:

```js
window.KomfiKatThemeConfig = {
  defaultPreset: "your-preset-id",
  allowStoredPresetOverride: false,
};
```

You mainly set:

- `light.pageBg`
- `light.surface`
- `light.text`
- `light.textMuted`
- `light.accent`
- `light.accentSoft`
- `dark.pageBg`
- `dark.surface`
- `dark.surfaceSolid`
- `dark.text`
- `dark.textMuted`
- `dark.accent`
- `dark.accentSoft`

The rest of the theme is derived automatically from those tones.
