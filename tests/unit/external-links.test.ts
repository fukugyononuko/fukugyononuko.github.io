// TC-U12 Markdown の本文の外部リンク（DD-11、NFR-16、#39）
import { describe, expect, it } from "vitest";
import { externalLinks, isExternalHref, NEW_TAB_NOTE } from "../../src/markdown/external-links";

const SITE = "https://fukugyononuko.github.io";

/** Sätteri の訪問者の ctx の偽物：呼ばれた操作を記録する */
function run(href: unknown) {
  const node = { type: "element", tagName: "a", properties: href === undefined ? {} : { href }, children: [] };
  const props: Record<string, unknown> = {};
  const appended: unknown[] = [];
  const ctx = {
    setProperty: (_n: unknown, key: string, value: unknown) => { props[key] = value; },
    appendChild: (_n: unknown, child: unknown) => { appended.push(child); },
  };
  const plugin = externalLinks(SITE);
  expect(plugin.element.filter).toEqual(["a"]);
  plugin.element.visit(node, ctx);
  return { props, appended };
}

describe("TC-U12 isExternalHref", () => {
  it.each([
    ["https://note.com/x", true],
    ["http://example.com/", true],
    ["https://fukugyononuko.github.io.evil.example/", true],
    ["https://fukugyononuko.github.io/news/", false],
    ["/news/rss.xml", false],
    ["../about/", false],
    ["#top", false],
    ["mailto:a@example.com", false],
    ["javascript:alert(1)", false],
    ["", false],
  ])("%s → %s", (href, expected) => {
    expect(isExternalHref(href, SITE)).toBe(expected);
  });

  it("文字列でない href は外部としない", () => {
    expect(isExternalHref(undefined, SITE)).toBe(false);
    expect(isExternalHref(["https://note.com/"], SITE)).toBe(false);
  });
});

describe("TC-U12 externalLinks（Sätteri の hast プラグイン）", () => {
  it("外部リンクに target・rel・読み上げの文字を付ける", () => {
    const { props, appended } = run("https://note.com/fukugyo_no_nuko");
    expect(props).toEqual({ target: "_blank", rel: ["noopener", "noreferrer"] });
    expect(appended).toEqual([
      { type: "element", tagName: "span", properties: { className: ["visually-hidden"] }, children: [{ type: "text", value: NEW_TAB_NOTE }] },
    ]);
    expect(NEW_TAB_NOTE).toBe("（新しいタブで開きます）");
  });

  it.each(["/news/rss.xml", "https://fukugyononuko.github.io/about/", "mailto:a@example.com", "#top", undefined])(
    "%s は変えない",
    (href) => {
      expect(run(href)).toEqual({ props: {}, appended: [] });
    },
  );
});
