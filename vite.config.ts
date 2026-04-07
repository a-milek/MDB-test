import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // <-- allows access from other devices
    port: 5173, // optional, default is 5173
    proxy: {
      "/open-session": { target: "http://127.0.0.1:3000", changeOrigin: true },
      "/close-session": { target: "http://127.0.0.1:3000", changeOrigin: true },
      "/vendRequest": { target: "http://127.0.0.1:3000", changeOrigin: true },
      "/vendSuccess": { target: "http://127.0.0.1:3000", changeOrigin: true },
      "/getStatus": { target: "http://127.0.0.1:3000", changeOrigin: true },
      "/inventory": { target: "http://127.0.0.1:3000", changeOrigin: true },
    },
  },
});
