// TC-A02：ほかの依存が使っているパッケージを直接の依存にも書くときは、コピーが 1 つだけであること（DD-11、#39）
// astro.config.mjs で設定した Markdown のプラグイン（と、その中で使う HTML の解析器）が、Astro の使う変換器と同じものになるようにするため。
// Dependabot のグループは同時の更新を保証しないので、版がずれた PR はこのテストで失敗させる。
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/** 直接の依存に書いたパッケージと、それを使っている依存（owner） */
const SHARED = [
  { name: "@astrojs/markdown-satteri", owner: "astro" },
  { name: "satteri", owner: "@astrojs/markdown-satteri" },
];

const root = JSON.parse(readFileSync("package.json", "utf8")) as { dependencies: Record<string, string> };
const manifest = (dir: string) =>
  JSON.parse(readFileSync(join(dir, "package.json"), "utf8")) as { version: string; dependencies?: Record<string, string> };

describe("TC-A02 ほかの依存と共有するパッケージ", () => {
  for (const { name, owner } of SHARED) {
    const ownerDir = join("node_modules", owner);

    it(`${name}：直接の依存は版を固定し、入っている版と同じ`, () => {
      expect(root.dependencies[name]).toBe(manifest(join("node_modules", name)).version);
    });

    it(`${name}：${owner} の下に別のコピーがない（1 つのコピーを共有する）`, () => {
      expect(existsSync(join(ownerDir, "node_modules", name))).toBe(false);
    });
  }

  it("@astrojs/markdown-satteri：astro が固定している版と同じ", () => {
    expect(root.dependencies["@astrojs/markdown-satteri"]).toBe(manifest(join("node_modules", "astro")).dependencies!["@astrojs/markdown-satteri"]);
  });
});
