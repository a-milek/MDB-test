import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { execSync } from "node:child_process";

function git(cmd: string): string {
  try {
    return execSync(`git ${cmd}`, { encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
}

// Writes dist/build-info.txt with the branch and last commit the build came from
function buildInfo(): Plugin {
  return {
    name: "build-info",
    apply: "build",
    generateBundle() {
      const dirty = git("status --porcelain") !== "" ? " (uncommitted changes)" : "";
      this.emitFile({
        type: "asset",
        fileName: "build-info.txt",
        source: [
          `branch: ${git("rev-parse --abbrev-ref HEAD")}`,
          `commit: ${git("rev-parse HEAD")}${dirty}`,
          `message: ${git("log -1 --pretty=%s")}`,
          `date: ${git("log -1 --pretty=%cI")}`,
          `built: ${new Date().toISOString()}`,
          "",
        ].join("\n"),
      });
    },
  };
}

export default defineConfig({
  base: "/vending-machines/",
  plugins: [react(), buildInfo()],
  server: {
    host: true, // <-- allows access from other devices
    port: 5173, // optional, default is 5173
    proxy: {
      "/sessionOpen": { target: "http://127.0.0.1:3000", changeOrigin: true },
      "/sessionClose": { target: "http://127.0.0.1:3000", changeOrigin: true },
      "/vendRequest": { target: "http://127.0.0.1:3000", changeOrigin: true },
      "/vendSuccess": { target: "http://127.0.0.1:3000", changeOrigin: true },
      "/getStatus": { target: "http://127.0.0.1:3000", changeOrigin: true },
    },
  },
});
