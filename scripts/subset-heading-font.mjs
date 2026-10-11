// 見出しフォント（Zen Maru Gothic 700）を、サイトで実際に見出しに使っている文字だけに絞る（サブセット化）。
// 日本語フォントは文字の範囲ごとの @font-face が多く、CSS が大きくなって表示が遅れるため（TC-N01、NFR-02）。
// astro build のあとに実行し、dist/fonts/ にフォントとライセンス（OFL）を置く。
// 見出しフォントを使うのは h1〜h3、ヘッダーのサイト名（.brand）、トップのキャッチコピー（.tagline）。
// 抜け漏れは e2e テスト（tests/e2e/heading-font.spec.ts）で確かめる。
import { copyFileSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import subsetFont from "subset-font";

const DIST = "dist";
const SOURCE = "assets/fonts/ZenMaruGothic-Bold.ttf";
const OUT_DIR = join(DIST, "fonts");
const OUT_FONT = join(OUT_DIR, "zen-maru-gothic-700-subset.woff2");

function* htmlFiles(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* htmlFiles(path);
    else if (name.endsWith(".html")) yield path;
  }
}

const ENTITIES = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&nbsp;": " " };
const decode = (s) => s.replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (m) => ENTITIES[m]).replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
const textOf = (html) => decode(html.replace(/<[^>]+>/g, ""));

const chars = new Set();
const PATTERNS = [
  /<h[1-3]\b[^>]*>([\s\S]*?)<\/h[1-3]>/g,
  /<[a-z]+\b[^>]*class="[^"]*\b(?:brand|tagline)\b[^"]*"[^>]*>([\s\S]*?)<\/[a-z]+>/g,
];
for (const file of htmlFiles(DIST)) {
  const html = readFileSync(file, "utf8");
  for (const pattern of PATTERNS) {
    for (const match of html.matchAll(pattern)) for (const ch of textOf(match[1])) if (ch.trim()) chars.add(ch);
  }
}
// 数字と英字は、今後の見出しの変更でも崩れないよう常に含める
for (const ch of "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz") chars.add(ch);

const text = [...chars].sort().join("");
const font = await subsetFont(readFileSync(SOURCE), text, { targetFormat: "woff2" });
mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT_FONT, font);
writeFileSync(join(OUT_DIR, "heading-chars.txt"), text);
copyFileSync("assets/fonts/OFL.txt", join(OUT_DIR, "OFL.txt"));
console.log(`subset-heading-font: ${chars.size} 文字、${(font.length / 1024).toFixed(1)} KB`);
