// DD-12 の補助：.astro ファイルの import が R1 に従っているかを検査する（NFR-09、TC-A01）。
// dependency-cruiser は .astro を解析できないため、この検査で補う。
// 使い方：node scripts/check-astro-imports.mjs [基準ディレクトリ（既定はカレント）]
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";

const baseDir = resolve(process.argv[2] ?? ".");
const srcDir = join(baseDir, "src");

const IMPORT_PATTERN = /(?:import|export)\s[^"'`;]*?from\s*["']([^"']+)["']|import\s*\(?\s*["']([^"']+)["']/g;

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* walk(path);
    else if (name.endsWith(".astro")) yield path;
  }
}

function isForbidden(specifier, fromFile) {
  if (specifier === "astro:content") return true;
  if (!specifier.startsWith(".")) return false;
  const target = relative(baseDir, resolve(dirname(fromFile), specifier)).split(sep).join("/");
  if (target === "src/content.config" || target === "src/content.config.ts") return true;
  if (target.startsWith("src/content/")) return true;
  if (!target.startsWith("src/system/")) return false;
  return !(/^src\/system\/compose(\.ts)?$/.test(target) || target.startsWith("src/system/contracts/"));
}

const violations = [];
for (const file of walk(srcDir)) {
  const source = readFileSync(file, "utf8");
  for (const match of source.matchAll(IMPORT_PATTERN)) {
    const specifier = match[1] ?? match[2];
    if (isForbidden(specifier, file)) {
      violations.push(`${relative(baseDir, file)}: "${specifier}"`);
    }
  }
}

if (violations.length > 0) {
  console.error("R1-client-only-calls-managers の違反（.astro）:");
  for (const v of violations) console.error(`  ${v}`);
  process.exit(1);
}
console.log("check-astro-imports: 違反はありません");
