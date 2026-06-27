import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server:
    process.env.E2E === "1"
      ? {
          host: "127.0.0.1",
          port: Number(process.env.VITE_DEV_PORT ?? 5173),
          strictPort: true,
        }
      : undefined,
});
