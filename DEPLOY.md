# Deploy Notes

## GitHub Pages from `dist`

This project is set up to publish the production build from [dist](/c:/Users/vladi/Desktop/github-projects/hi.komfikat.com/dist) with GitHub Actions.

### One-time GitHub setup

1. Push the repository to the `main` branch.
2. Open the GitHub repository.
3. Go to `Settings -> Pages`.
4. In `Source`, choose `GitHub Actions`.

After that, the workflow in [.github/workflows/deploy-pages.yml](/c:/Users/vladi/Desktop/github-projects/hi.komfikat.com/.github/workflows/deploy-pages.yml) will handle deployment automatically.

The production workflow now also runs the image pipeline automatically before build:
- it generates/refreshes `webp` files
- it updates the carousel manifest
- it keeps production from accidentally shipping raw oversized `png/jpg` files

The build now also runs the font pipeline automatically before build:
- it scans [fonts](/c:/Users/vladi/Desktop/github-projects/hi.komfikat.com/fonts) for `*.ttf`
- it converts them to matching `*.woff2`
- it lets production keep using compressed web fonts without manual conversion

That means for deployment you can just:
- add images to the source folders in the repo
- push to `main`
- let GitHub Actions build `dist` and publish it

### What happens on deploy

On every push to `main`, GitHub Actions will:

1. Install dependencies with `npm ci`
2. Run `npm run build`
3. Generate the production build in [dist](/c:/Users/vladi/Desktop/github-projects/hi.komfikat.com/dist)
4. Publish the contents of `dist` to GitHub Pages

### Local production build

If you want to build locally before pushing:

```powershell
npm run build
```

`npm run build` now also runs the font and image pipelines automatically before building `dist`.

or run [build-production.cmd](/c:/Users/vladi/Desktop/github-projects/hi.komfikat.com/scripts/build-production.cmd).

## Default theme preset

Change the site-wide default theme in [theme-presets.js](/c:/Users/vladi/Desktop/github-projects/hi.komfikat.com/themes/theme-presets.js):

```js
window.KomfiKatThemeConfig = {
  defaultPreset: "default-rose",
  allowStoredPresetOverride: false,
};
```

Then run:

```powershell
npm run sync:theme-preset
```

or just:

```powershell
npm run build
```

The build will sync the HTML fallback preset automatically.
