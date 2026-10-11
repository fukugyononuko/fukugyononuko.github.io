// TC-U01 PricingEngine（DD-03）
import { describe, expect, it } from "vitest";
import { createPricingEngine } from "../../src/system/engines/pricing-engine";
import type { PricePolicy, PriceSpec } from "../../src/system/contracts";

const engine = createPricingEngine();
const fixed: PriceSpec = { kind: "fixed", amount: 30000, unit: "件" };
const from: PriceSpec = { kind: "from", amount: 10000, unit: "件" };
const quote: PriceSpec = { kind: "quote" };

describe("TC-U01 PricingEngine：DD-03 の表の 9 通り", () => {
  const table: [PriceSpec, PricePolicy, string][] = [
    [fixed, "as-is", "30,000円 / 件"],
    [fixed, "from-only", "30,000円〜"],
    [fixed, "hide", "お見積もり"],
    [from, "as-is", "10,000円〜"],
    [from, "from-only", "10,000円〜"],
    [from, "hide", "お見積もり"],
    [quote, "as-is", "お見積もり"],
    [quote, "from-only", "お見積もり"],
    [quote, "hide", "お見積もり"],
  ];
  it.each(table)("%o × %s → %s", (price, policy, expected) => {
    expect(engine.presentPrice(price, policy)).toEqual({ visible: true, text: expected });
  });
});

describe("TC-U01 PricingEngine：細部", () => {
  it("unit がなければ「 / 単位」を付けない", () => {
    expect(engine.presentPrice({ kind: "fixed", amount: 5000 }, "as-is").text).toBe("5,000円");
  });
  it("3 桁ごとに区切る", () => {
    expect(engine.presentPrice({ kind: "fixed", amount: 1234567 }, "as-is").text).toBe("1,234,567円");
  });
  it("注記は hide 以外ではそのまま返す", () => {
    expect(engine.presentPrice(fixed, "as-is", "税込").note).toBe("税込");
  });
  it("hide のときは注記を出さない", () => {
    expect(engine.presentPrice(fixed, "hide", "税込").note).toBeUndefined();
  });
});
