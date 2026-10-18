// TC-U11 ReadingTimeEngine（DD-17、FR-18）
import { describe, expect, it } from "vitest";
import { createReadingTimeEngine } from "../../src/system/engines/reading-time-engine";

const engine = createReadingTimeEngine();
const ja = (n: number) => "あ".repeat(n);
const en = (n: number) => "a".repeat(n);

describe("TC-U11 ReadingTimeEngine", () => {
  it("日本語は 653 字/分（黙読）：653 字で 1 分、654 字で 2 分、1306 字で 2 分", () => {
    expect(engine.estimateMinutes(ja(653))).toBe(1);
    expect(engine.estimateMinutes(ja(654))).toBe(2);
    expect(engine.estimateMinutes(ja(1306))).toBe(2);
  });

  it("それ以外の文字は 238 × 4.6 = 1094.8 字/分（黙読）：1094 字で 1 分、1095 字で 2 分", () => {
    expect(engine.estimateMinutes(en(1094))).toBe(1);
    expect(engine.estimateMinutes(en(1095))).toBe(2);
  });

  it("混ざった文章は両方の和を切り上げる（653 字 + 1094 字 = 2 分弱で 2 分、1 字足すと 2 分を超えて 3 分）", () => {
    expect(engine.estimateMinutes(ja(653) + en(1094))).toBe(2);
    expect(engine.estimateMinutes(ja(653) + en(1095))).toBe(3);
  });

  it("漢字・カタカナ・長音符・サロゲートペアの漢字（𠮷）は日本語の 1 文字", () => {
    expect(engine.estimateMinutes("漢カー𠮷".repeat(164))).toBe(2); // 656 字
    expect(engine.estimateMinutes("漢カー𠮷".repeat(163) + "あ")).toBe(1); // 653 字
  });

  it("空白・句読点・記号は数えない", () => {
    const noise = " \n\t。、「」・！？…（）.,!?#&＋=〜★→";
    expect(engine.estimateMinutes(ja(653) + noise.repeat(50))).toBe(1);
  });

  it("空の本文や記号だけの本文は 1 分（0 分とは書かない）", () => {
    expect(engine.estimateMinutes("")).toBe(1);
    expect(engine.estimateMinutes("。、 ")).toBe(1);
  });

  it("文字を足しても分は減らない（単調性）", () => {
    let prev = 0;
    let text = "";
    for (let i = 0; i < 1500; i++) {
      text += i % 3 === 0 ? "a" : "あ";
      const m = engine.estimateMinutes(text);
      expect(m).toBeGreaterThanOrEqual(prev);
      prev = m;
    }
  });
});
