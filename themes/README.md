# Theme Presets

Theme presets live in [theme-presets.js](/c:/Users/vladi/Desktop/github-projects/hi.komfikat.com/themes/theme-presets.js).

Each preset drives both `light` and `dark` mode from one source and is applied by [theme.js](/c:/Users/vladi/Desktop/github-projects/hi.komfikat.com/js/theme.js).

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

- `rose-cream`
- `burgundy-blush`
- `mocha-petal`

## How to switch presets

From the browser console or future tooling:

```js
window.KomfiKatApp.theme.setThemePreset("burgundy-blush");
```

Available presets:

```js
window.KomfiKatApp.theme.getAvailablePresets();
```

## Adding a new preset

Add a new `createThemePreset({...})` entry in [theme-presets.js](/c:/Users/vladi/Desktop/github-projects/hi.komfikat.com/themes/theme-presets.js).

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
