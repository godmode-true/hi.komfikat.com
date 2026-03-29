import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import ttf2woff2 from "ttf2woff2";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const fontsRoot = path.join(projectRoot, "fonts");

async function collectTtfFiles(directoryPath) {
  const entries = await fs.readdir(directoryPath, { withFileTypes: true });
  const results = [];

  for (const entry of entries) {
    const fullPath = path.join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      results.push(...(await collectTtfFiles(fullPath)));
      continue;
    }

    if (entry.isFile() && path.extname(entry.name).toLowerCase() === ".ttf") {
      results.push(fullPath);
    }
  }

  return results;
}

async function convertFont(ttfPath) {
  const woff2Path = ttfPath.replace(/\.ttf$/i, ".woff2");
  const [ttfStat, existingWoff2Stat] = await Promise.all([
    fs.stat(ttfPath),
    fs.stat(woff2Path).catch(() => null),
  ]);

  if (existingWoff2Stat && existingWoff2Stat.mtimeMs >= ttfStat.mtimeMs) {
    return { status: "skipped", ttfPath, woff2Path };
  }

  const input = await fs.readFile(ttfPath);
  const output = ttf2woff2(input);
  await fs.writeFile(woff2Path, output);

  return { status: "converted", ttfPath, woff2Path };
}

async function main() {
  const ttfFiles = await collectTtfFiles(fontsRoot).catch(() => []);

  if (ttfFiles.length === 0) {
    console.log("No TTF fonts found in ./fonts");
    return;
  }

  const results = [];
  for (const ttfPath of ttfFiles) {
    results.push(await convertFont(ttfPath));
  }

  const converted = results.filter((entry) => entry.status === "converted");
  const skipped = results.filter((entry) => entry.status === "skipped");

  converted.forEach((entry) => {
    console.log(`Converted ${path.relative(projectRoot, entry.ttfPath)} -> ${path.relative(projectRoot, entry.woff2Path)}`);
  });

  if (skipped.length > 0) {
    console.log(`Skipped ${skipped.length} font(s); existing WOFF2 is already up to date.`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
