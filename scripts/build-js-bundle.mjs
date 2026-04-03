import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { transform } from "esbuild";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

/** Order matters: theme bootstrap → main → theme → share → manifests → feature modules */
const bundleParts = [
  "js/theme-bootstrap.js",
  "js/main.js",
  "js/theme.js",
  "js/share.js",
  "js/stories-manifest.js",
  "js/stories.js",
  "js/carousel-manifest.js",
  "js/carousel.js",
];

async function main() {
  const combined = (
    await Promise.all(
      bundleParts.map(async (rel) => {
        const abs = path.join(projectRoot, rel);
        return fs.readFile(abs, "utf8");
      }),
    )
  ).join("\n");

  const result = await transform(combined, {
    loader: "js",
    minify: true,
    charset: "utf8",
    legalComments: "none",
    target: ["chrome109", "safari16.4", "firefox115"],
  });

  const outPath = path.join(projectRoot, "js", "site.bundle.js");
  await fs.writeFile(outPath, result.code, "utf8");

  const bytes = Buffer.byteLength(result.code);
  console.log(`js/site.bundle.js  ${(bytes / 1024).toFixed(1)} KB (minified)`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
