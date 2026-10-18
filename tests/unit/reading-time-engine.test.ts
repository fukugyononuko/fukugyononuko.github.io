// TC-U11 ReadingTimeEngine（DD-17、FR-18）
import { describe, expect, it } from "vitest";
import { createReadingTimeEngine } from "../../src/system/engines/reading-time-engine";

const engine = createReadingTimeEngine();
const ja = (n: number) => "あ".repeat(n);
const en = (n: number) => "a".repeat(n);

describe("TC-U11 ReadingTimeEngine", () => {
  it("日本語は 357 字/分：357 字で 1 分、358 字で 2 分、714 字で 2 分", () => {
    expect(engine.estimateMinutes(ja(357))).toBe(1);
    expect(engine.estimateMinutes(ja(358))).toBe(2);
    expect(engine.estimateMinutes(ja(714))).toBe(2);
  });

  it("それ以外の文字は 987 字/分：987 字で 1 分、988 字で 2 分", () => {
    expect(engine.estimateMinutes(en(987))).toBe(1);
    expect(engine.estimateMinutes(en(988))).toBe(2);
  });

  it("混ざった文章は両方の和を切り上げる（357 字 + 987 字 = ちょうど 2 分、1 字足すと 3 分）", () => {
    expect(engine.estimateMinutes(ja(357) + en(987))).toBe(2);
    expect(engine.estimateMinutes(ja(357) + en(988))).toBe(3);
  });

  it("漢字・カタカナ・長音符・サロゲートペアの漢字（𠮷）は日本語の 1 文字", () => {
    const mixed = "漢カー𠮷".repeat(90); // 360 字 → 2 分
    expect(engine.estimateMinutes(mixed)).toBe(2);
    expect(engine.estimateMinutes("漢カー𠮷".repeat(89) + "あ")).toBe(1); // 357 字
  });

  it("空白・句読点・記号は数えない", () => {
    const noise = " \n\t。、「」・！？…（）.,!?#&＋=〜★→";
    expect(engine.estimateMinutes(ja(357) + noise.repeat(50))).toBe(1);
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
