import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scriptPath = path.join(__dirname, "update-site-images.ps1");

const commandCandidates =
  process.platform === "win32"
    ? [
        ["pwsh", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", scriptPath]],
        ["powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", scriptPath]],
      ]
    : [["pwsh", ["-NoProfile", "-File", scriptPath]]];

let lastError = null;

for (const [command, args] of commandCandidates) {
  const result = spawnSync(command, args, {
    cwd: path.dirname(__dirname),
    stdio: "inherit",
    shell: false,
  });

  if (!result.error && result.status === 0) {
    process.exit(0);
  }

  lastError = result.error || new Error(`${command} exited with code ${result.status ?? "unknown"}`);
}

throw lastError || new Error("Unable to run update-site-images.ps1");
