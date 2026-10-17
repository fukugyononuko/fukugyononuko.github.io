// CMP-A04 ArticleAccess の内部：Astro の Content Collections から読む ArticleSource（RES-04）
import { existsSync } from "node:fs";
import { join } from "node:path";
import { getCollection } from "astro:content";
import type { ArticleSource } from "./index";

export const astroArticleSource: ArticleSource = {
  async articles() {
    return (await getCollection("news")).map((e) => ({ id: e.id, data: e.data, html: e.rendered?.html ?? "" }));
  },
  imageExists(src: string) {
    return existsSync(join("public", src));
  },
};
