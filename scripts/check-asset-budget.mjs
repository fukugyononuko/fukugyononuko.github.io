// 性能の予算（NFR-02）：表示を妨げる CSS と見出しフォントの大きさに上限を設け、超えたらビルドを失敗させる。
// Lighthouse の点数は計測のたびにぶれるので、先に大きさで気づけるようにする（振り返り：space P-04）。
// 使い方：npm run build のあと node scripts/check-asset-budget.mjs
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const DIST = "dist";
const BUDGET = {
  cssPerPage: 20 * 1024, // 1 ページが読み込む CSS（外部ファイル＋インライン）の合計
  headingFont: 60 * 1024, // 見出しフォントのサブセット
};

function* htmlFiles(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* htmlFiles(path);
    else if (name.endsWith(".html")) yield path;
  }
}

const problems = [];
let worst = 0;
for (const file of htmlFiles(DIST)) {
  const html = readFileSync(file, "utf8");
  let bytes = 0;
  for (const m of html.matchAll(/<link rel="stylesheet" href="\/([^"]+)"/g)) bytes += statSync(join(DIST, m[1])).size;
  for (const m of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) bytes += Buffer.byteLength(m[1]);
  worst = Math.max(worst, bytes);
  if (bytes > BUDGET.cssPerPage) problems.push(`${file}：CSS ${(bytes / 1024).toFixed(1)} KB（上限 ${BUDGET.cssPerPage / 1024} KB）`);
}
const font = statSync(join(DIST, "fonts", "zen-maru-gothic-700-subset.woff2")).size;
if (font > BUDGET.headingFont) problems.push(`見出しフォント ${(font / 1024).toFixed(1)} KB（上限 ${BUDGET.headingFont / 1024} KB）`);

if (problems.length > 0) {
  for (const p of problems) console.error(p);
  process.exit(1);
}
console.log(`check-asset-budget: 問題はありません（1 ページの CSS は最大 ${(worst / 1024).toFixed(1)} KB、見出しフォント ${(font / 1024).toFixed(1)} KB）`);
