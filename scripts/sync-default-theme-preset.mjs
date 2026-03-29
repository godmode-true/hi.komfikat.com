import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const themePresetsPath = path.join(projectRoot, "themes", "theme-presets.js");
const indexHtmlPath = path.join(projectRoot, "index.html");

async function main() {
  const themePresetsSource = await fs.readFile(themePresetsPath, "utf8");
  const indexHtmlSource = await fs.readFile(indexHtmlPath, "utf8");

  const defaultPresetMatch = themePresetsSource.match(/defaultPreset:\s*"([^"]+)"/);

  if (!defaultPresetMatch) {
    throw new Error("Could not find defaultPreset in themes/theme-presets.js");
  }

  const defaultPreset = defaultPresetMatch[1];
  const nextIndexHtml = indexHtmlSource.replace(
    /<html\s+lang="en"(?:\s+data-default-preset="[^"]*")?>/,
    `<html lang="en" data-default-preset="${defaultPreset}">`,
  );

  if (nextIndexHtml !== indexHtmlSource) {
    await fs.writeFile(indexHtmlPath, nextIndexHtml);
    console.log(`Synced index.html fallback preset to "${defaultPreset}"`);
    return;
  }

  console.log(`index.html fallback preset already matches "${defaultPreset}"`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

