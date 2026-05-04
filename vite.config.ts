import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/vending-machines/",
  plugins: [react()],
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
