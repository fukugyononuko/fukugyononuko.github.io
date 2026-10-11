// TC-U02 CurationEngine（DD-04）
import { describe, expect, it } from "vitest";
import { createCurationEngine } from "../../src/system/engines/curation-engine";
import type { Curatable } from "../../src/system/contracts";

const engine = createCurationEngine();
const item = (id: string, order: number, featured = false, date?: string): Curatable => ({ id, order, featured, date });

describe("TC-U02 CurationEngine", () => {
  it("order：order の昇順、同じなら id の昇順", () => {
    const items = [item("b", 2), item("c", 1), item("a", 2)];
    expect(engine.arrange(items, { featuredLimit: 9, sort: "order" }).map((i) => i.id)).toEqual(["c", "a", "b"]);
  });

  it("date-desc：新しい順、date がないものは最後で order 順", () => {
    const items = [item("old", 1, false, "2025-01-01"), item("none2", 2), item("new", 9, false, "2026-10-01"), item("none1", 1)];
    expect(engine.arrange(items, { featuredLimit: 9, sort: "date-desc" }).map((i) => i.id)).toEqual(["new", "old", "none1", "none2"]);
  });

  it("pickFeatured：featured だけを並べて featuredLimit 件まで返す", () => {
    const items = [item("a", 3, true), item("b", 1, true), item("c", 2, false), item("d", 2, true)];
    expect(engine.pickFeatured(items, { featuredLimit: 2, sort: "order" }).map((i) => i.id)).toEqual(["b", "d"]);
  });

  it("pickFeatured：足りないときは補わない", () => {
    const items = [item("a", 1, true), item("b", 2, false)];
    expect(engine.pickFeatured(items, { featuredLimit: 3, sort: "order" }).map((i) => i.id)).toEqual(["a"]);
  });

  it("入力の配列を変更しない", () => {
    const items = [item("b", 2), item("a", 1)];
    engine.arrange(items, { featuredLimit: 9, sort: "order" });
    expect(items.map((i) => i.id)).toEqual(["b", "a"]);
  });
});
