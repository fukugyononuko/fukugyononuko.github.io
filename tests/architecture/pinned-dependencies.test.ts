// TC-A02：Astro が版を固定している依存を直接の依存にも書くときは、同じ版で、コピーが 1 つだけであること（DD-11、#39）
// astro.config.mjs で設定した Markdown のプラグインが、Astro の使う変換器に届くようにするため。
// Dependabot のグループは同時の更新を保証しないので、版がずれた PR はこのテストで失敗させる。
import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";

const SHARED_WITH_ASTRO = ["@astrojs/markdown-satteri"];

const root = JSON.parse(readFileSync("package.json", "utf8")) as { dependencies: Record<string, string> };
const requireFromRoot = createRequire(`${process.cwd()}/package.json`);
const astroManifest = requireFromRoot.resolve("astro/package.json");
const astro = JSON.parse(readFileSync(astroManifest, "utf8")) as { version: string; dependencies: Record<string, string> };
const astroDir = dirname(astroManifest);

describe("TC-A02 Astro と共有する依存の版", () => {
  for (const name of SHARED_WITH_ASTRO) {
    it(`${name}：直接の依存の版が、astro ${astro.version} の固定している版と同じ`, () => {
      expect(root.dependencies[name]).toBe(astro.dependencies[name]);
    });

    it(`${name}：プロジェクトと astro が同じ 1 つのコピーを使う（astro の下に別のコピーがない）`, () => {
      expect(existsSync(join("node_modules", name, "package.json"))).toBe(true);
      expect(existsSync(join(astroDir, "node_modules", name))).toBe(false);
    });
  }
});
