import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { transform } from "esbuild";
import { minify as minifyHtml } from "html-minifier-terser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const distRoot = path.join(projectRoot, "dist");

const rootFilesToCopy = ["favicon.ico"];
const directoriesToCopy = ["fonts", "img"];
const jsFiles = [
  "js/main.js",
  "js/theme.js",
  "js/share.js",
  "js/stories-manifest.js",
  "js/stories.js",
  "js/carousel-manifest.js",
  "js/carousel.js",
  "themes/theme-presets.js",
];
const cssFiles = ["css/style.css"];

async function ensureDir(targetPath) {
  await fs.mkdir(targetPath, { recursive: true });
}

async function copyRecursive(sourcePath, targetPath) {
  const entry = await fs.stat(sourcePath);

  if (entry.isDirectory()) {
    await ensureDir(targetPath);
    const children = await fs.readdir(sourcePath);

    await Promise.all(
      children.map((childName) =>
        copyRecursive(path.join(sourcePath, childName), path.join(targetPath, childName)),
      ),
    );

    return;
  }

  await ensureDir(path.dirname(targetPath));
  await fs.copyFile(sourcePath, targetPath);
}

async function writeFileInDist(relativePath, contents) {
  const targetPath = path.join(distRoot, relativePath);
  await ensureDir(path.dirname(targetPath));
  await fs.writeFile(targetPath, contents);
}

async function minifyJavaScript(relativePath) {
  const sourcePath = path.join(projectRoot, relativePath);
  const source = await fs.readFile(sourcePath, "utf8");
  const result = await transform(source, {
    loader: "js",
    minify: true,
    charset: "utf8",
    legalComments: "none",
    target: ["chrome109", "safari16.4", "firefox115"],
  });

  await writeFileInDist(relativePath, result.code);
  return {
    file: relativePath,
    before: Buffer.byteLength(source),
    after: Buffer.byteLength(result.code),
  };
}

async function minifyCss(relativePath) {
  const sourcePath = path.join(projectRoot, relativePath);
  const source = await fs.readFile(sourcePath, "utf8");
  const result = await transform(source, {
    loader: "css",
    minify: true,
    charset: "utf8",
    legalComments: "none",
    target: ["chrome109", "safari16.4", "firefox115"],
  });

  await writeFileInDist(relativePath, result.code);
  return {
    file: relativePath,
    before: Buffer.byteLength(source),
    after: Buffer.byteLength(result.code),
  };
}

async function minifyIndexHtml() {
  const relativePath = "index.html";
  const sourcePath = path.join(projectRoot, relativePath);
  const source = await fs.readFile(sourcePath, "utf8");
  const result = await minifyHtml(source, {
    collapseBooleanAttributes: true,
    collapseWhitespace: true,
    conservativeCollapse: true,
    decodeEntities: true,
    keepClosingSlash: true,
    removeComments: true,
    removeAttributeQuotes: false,
    removeEmptyAttributes: false,
    minifyCSS: false,
    minifyJS: false,
  });

  await writeFileInDist(relativePath, `${result}\n`);
  return {
    file: relativePath,
    before: Buffer.byteLength(source),
    after: Buffer.byteLength(result),
  };
}

function formatSize(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  return `${(bytes / 1024).toFixed(1)} KB`;
}

function formatReduction(before, after) {
  if (!before) {
    return "0%";
  }

  return `${(((before - after) / before) * 100).toFixed(1)}%`;
}

async function main() {
  await fs.rm(distRoot, { recursive: true, force: true });
  await ensureDir(distRoot);
  await fs.writeFile(path.join(distRoot, ".nojekyll"), "");

  await Promise.all(
    rootFilesToCopy.map((relativePath) =>
      copyRecursive(path.join(projectRoot, relativePath), path.join(distRoot, relativePath)),
    ),
  );

  await Promise.all(
    directoriesToCopy.map((relativePath) =>
      copyRecursive(path.join(projectRoot, relativePath), path.join(distRoot, relativePath)),
    ),
  );

  const htmlStats = await minifyIndexHtml();
  const cssStats = await Promise.all(cssFiles.map(minifyCss));
  const jsStats = await Promise.all(jsFiles.map(minifyJavaScript));
  const stats = [htmlStats, ...cssStats, ...jsStats];

  console.log("Production build completed in ./dist");
  console.log("");

  stats.forEach((entry) => {
    console.log(
      `${entry.file}: ${formatSize(entry.before)} -> ${formatSize(entry.after)} (${formatReduction(entry.before, entry.after)})`,
    );
  });

  console.log("");
  console.log("Deploy the contents of ./dist to production.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
