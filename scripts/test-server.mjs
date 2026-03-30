import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const port = Number.parseInt(process.argv[2] || process.env.PORT || "4173", 10);

const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".jpg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".txt", "text/plain; charset=utf-8"],
  [".webp", "image/webp"],
  [".woff2", "font/woff2"],
]);

function getSafePath(urlPathname) {
  const normalizedPath = decodeURIComponent(urlPathname.split("?")[0]).replace(/^\/+/, "");
  const requestedPath = normalizedPath || "index.html";
  const filePath = path.resolve(rootDir, requestedPath);

  if (!filePath.startsWith(rootDir)) {
    return null;
  }

  return filePath;
}

const server = http.createServer(async (request, response) => {
  const requestPath = request.url || "/";
  const filePath = getSafePath(requestPath);

  if (!filePath) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  let finalPath = filePath;

  try {
    const stats = await fs.stat(finalPath);

    if (stats.isDirectory()) {
      finalPath = path.join(finalPath, "index.html");
    }
  } catch {
    if (path.extname(finalPath) === "") {
      finalPath = path.join(finalPath, "index.html");
    }
  }

  try {
    const data = await fs.readFile(finalPath);
    const extension = path.extname(finalPath).toLowerCase();
    const contentType = contentTypes.get(extension) || "application/octet-stream";

    response.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": "no-store",
    });
    response.end(data);
  } catch {
    response.writeHead(404);
    response.end("Not Found");
  }
});

server.listen(port, "127.0.0.1", () => {
  process.stdout.write(`Test server listening on http://127.0.0.1:${port}\n`);
});

function shutdown() {
  server.close(() => {
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
