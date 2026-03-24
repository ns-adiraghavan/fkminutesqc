import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import type { Plugin } from "vite";

// Plugin: serve /data/*.json.gz files with correct headers and bypass SPA fallback
function serveGzipData(): Plugin {
  return {
    name: "serve-gzip-data",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.startsWith("/data/") && req.url.endsWith(".json.gz")) {
          res.setHeader("Content-Type", "application/json");
          res.setHeader("Content-Encoding", "gzip");
          res.setHeader("Cache-Control", "no-cache");
          // Strip query string for file lookup
          const filePath = path.resolve(__dirname, "public", req.url.split("?")[0].slice(1));
          const fs = require("fs");
          if (!fs.existsSync(filePath)) {
            res.statusCode = 404;
            res.end();
            return;
          }
          res.statusCode = 200;
          fs.createReadStream(filePath).pipe(res);
          return;
        }
        next();
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    serveGzipData(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
