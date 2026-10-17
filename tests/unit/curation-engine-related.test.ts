// TC-U10 CurationEngine の pickRelated（DD-04、FR-16）
import { describe, expect, it } from "vitest";
import { createCurationEngine } from "../../src/system/engines/curation-engine";
import type { Taggable } from "../../src/system/contracts";

const engine = createCurationEngine();
const a = (id: string, date?: string, ...tags: string[]): Taggable => ({ id, date, tags });
const ids = (items: Taggable[]) => items.map((i) => i.id);

describe("TC-U10 CurationEngine.pickRelated", () => {
  const base = a("base", "2026-10-10", "web", "astro");

  it("自分自身を含めない", () => {
    expect(ids(engine.pickRelated([base, a("x", "2026-10-01", "web")], base, 3))).toEqual(["x"]);
  });

  it("共通するタグが多い順、同数なら新しい順 → id の順", () => {
    const items = [
      a("one-old", "2026-01-01", "web"),
      a("two", "2025-01-01", "web", "astro"),
      a("one-new-b", "2026-09-01", "astro"),
      a("one-new-a", "2026-09-01", "web"),
    ];
    expect(ids(engine.pickRelated(items, base, 4))).toEqual(["two", "one-new-a", "one-new-b", "one-old"]);
  });

  it("同じタグの重複を数えすぎない", () => {
    const items = [a("dup", "2026-01-01", "web", "web"), a("both", "2025-01-01", "web", "astro")];
    expect(ids(engine.pickRelated(items, base, 2))).toEqual(["both", "dup"]);
  });

  it("足りないときは、共通するタグがない記事を新しい順で補う。date がないものは最後", () => {
    const items = [a("nodate"), a("other-old", "2025-01-01", "data"), a("match", "2024-01-01", "web"), a("other-new", "2026-01-01")];
    expect(ids(engine.pickRelated(items, base, 3))).toEqual(["match", "other-new", "other-old"]);
    expect(ids(engine.pickRelated(items, base, 9))).toEqual(["match", "other-new", "other-old", "nodate"]);
  });

  it("limit で切る。記事が自分だけなら空", () => {
    const items = [a("p", "2026-01-01"), a("q", "2026-01-02"), a("r", "2026-01-03")];
    expect(ids(engine.pickRelated(items, base, 2))).toEqual(["r", "q"]);
    expect(engine.pickRelated([base], base, 3)).toEqual([]);
  });

  it("入力の配列を変更しない", () => {
    const items = [a("p", "2026-01-01"), a("q", "2026-01-02", "web")];
    engine.pickRelated(items, base, 3);
    expect(ids(items)).toEqual(["p", "q"]);
  });
});
