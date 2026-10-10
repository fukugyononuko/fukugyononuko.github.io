// TC-A01 依存規則の検査（DD-12、NFR-09）
// 規則が実際のコードで守られていることに加えて、違反をわざと含むフィクスチャで検査が失敗すること（規則が空振りしていないこと）を確かめる。
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../..");
const depcruiseBin = resolve(root, "node_modules/.bin/depcruise");
const config = resolve(root, ".dependency-cruiser.cjs");
const astroChecker = resolve(root, "scripts/check-astro-imports.mjs");

interface Violation {
  rule: { name: string };
  from: string;
  to: string;
}

function cruise(cwd: string): Violation[] {
  let output: string;
  try {
    output = execFileSync(depcruiseBin, ["src", "--config", config, "--output-type", "json"], { cwd, encoding: "utf8" });
  } catch (error) {
    output = (error as { stdout: string }).stdout;
  }
  return JSON.parse(output).summary.violations;
}

function checkAstro(dir: string): { ok: boolean; output: string } {
  try {
    return { ok: true, output: execFileSync("node", [astroChecker, dir], { encoding: "utf8" }) };
  } catch (error) {
    return { ok: false, output: (error as { stderr: string }).stderr };
  }
}

describe("TC-A01 依存規則", () => {
  it("実際のコードに違反がない", () => {
    expect(cruise(root)).toEqual([]);
    expect(checkAstro(root).ok).toBe(true);
  });

  it("許可された呼び出しだけのフィクスチャでは違反が出ない", () => {
    const dir = resolve(import.meta.dirname, "fixtures/valid");
    expect(cruise(dir)).toEqual([]);
    expect(checkAstro(dir).ok).toBe(true);
  });

  it("違反を含むフィクスチャでは、すべての規則が違反を検出する", () => {
    const dir = resolve(import.meta.dirname, "fixtures/violations");
    const rules = new Set(cruise(dir).map((v) => v.rule.name));
    expect([...rules].sort()).toEqual([
      "R1-client-only-calls-managers",
      "R3-no-manager-to-manager",
      "R4-engine-calls-down-only",
      "R5-resource-access-isolated",
      "R6-system-does-not-call-clients",
      "R7-utility-calls-nothing-above",
      "contracts-are-types-only",
    ]);
  });

  it(".astro からの禁止された import を検出する", () => {
    const result = checkAstro(resolve(import.meta.dirname, "fixtures/violations"));
    expect(result.ok).toBe(false);
    expect(result.output).toContain('"../system/engines/pricing-engine"');
    expect(result.output).toContain('"astro:content"');
  });
});
