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
    // Mirrors the nginx routes so `npm run dev` talks to the backend services directly.
    // The ws route must precede the plain mdb_api route (first prefix match wins).
    proxy: {
      "/vending-machines/mdb_api/ws": {
        target: "ws://localhost:1234",
        ws: true,
        rewrite: (p) => p.replace(/^\/vending-machines\/mdb_api/, "/ota-977/MDBPay/1.0.0"),
      },
      "/vending-machines/mdb_api": {
        target: "http://localhost:1234",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/vending-machines\/mdb_api/, "/ota-977/MDBPay/1.0.0"),
      },
      "/vending-machines/interpreter/ws": { target: "ws://localhost:3001", ws: true },
      "/vending-machines/order": { target: "http://localhost:8080" },
      "/vending-machines/coffee-data": { target: "http://localhost:8080" },
      "/vending-machines/statservice": { target: "http://localhost:8081" },
    },
  },
});
