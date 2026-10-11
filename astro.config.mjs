// CMP-U01 Config の値の元（DD-10）。公開先を変えるときは site と base だけを変える（VOL-08）。
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://fukugyononuko.github.io",
  base: "/",
  trailingSlash: "always",
  integrations: [sitemap()],
  // コードのハイライト（Shiki）はインラインのスタイルを使い CSP と両立しない。コードブロックを使わないので無効にする
  markdown: { syntaxHighlight: false },
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
