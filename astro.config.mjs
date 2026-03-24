// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import netlify from "@astrojs/netlify";
import node from "@astrojs/node";

// En dev usamos el adapter de Node; en producción (Netlify CI) usamos el adapter de Netlify.
const isNetlify = Boolean(process.env.NETLIFY);
const adapter = isNetlify ? netlify() : node({ mode: "standalone" });

// https://astro.build/config
export default defineConfig({
  output: "server",
  adapter,
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
