// CMP-U01 Config の値の元（DD-10）。公開先を変えるときは site と base だけを変える（VOL-08）。
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { satteri } from "@astrojs/markdown-satteri";
import { externalLinks } from "./src/markdown/external-links.ts";

const SITE = "https://fukugyononuko.github.io";

export default defineConfig({
  site: SITE,
  base: "/",
  trailingSlash: "always",
  integrations: [sitemap()],
  // コードのハイライト（Shiki）はインラインのスタイルを使い CSP と両立しない。コードブロックを使わないので無効にする
  // NFR-16 / DD-11：Markdown の本文の外部リンクに、新しいタブと noopener を付ける（#39）。
  // 標準の変換器 Sätteri を、プラグインを足して使う（rehypePlugins は Sätteri では使えない）
  markdown: { syntaxHighlight: false, processor: satteri({ hastPlugins: [externalLinks(SITE)] }) },
  // フォントを data: URI で CSS に埋め込まない（CSP の font-src 'self' を保つ。TC-N11 で検出）。
  // ほかのアセットは既定のまま（小さい CSS はインラインにして、読み込みのリクエストを減らす）
  vite: { build: { assetsInlineLimit: (file) => (/\.(woff2?|ttf|otf)$/.test(file) ? false : undefined) } },
  // DD-16 / NFR-15：Astro が使われているスクリプトとスタイルのハッシュを計算して <meta> の CSP を出力する。
  // form-action と frame-src はページごとに BaseLayout が加える（問い合わせページだけ外部を許可する）。
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self'",
        "base-uri 'self'",
        "object-src 'none'",
      ],
    },
  },
});
