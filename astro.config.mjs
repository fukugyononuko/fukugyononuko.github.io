// CMP-U01 Config の値の元（DD-10）。公開先を変えるときは site と base だけを変える（VOL-08）。
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://fukugyononuko.github.io",
  base: "/",
  trailingSlash: "always",
  integrations: [sitemap()],
});
