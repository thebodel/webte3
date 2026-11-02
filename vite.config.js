import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "https://wt1zadanie.iolab.sk",
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
