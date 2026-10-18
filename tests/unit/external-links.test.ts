// TC-U12 Markdown の本文の外部リンク（DD-11、NFR-16、#39）
import { describe, expect, it } from "vitest";
import { externalLinks, isExternalHref, NEW_TAB_NOTE, RawAnchorError } from "../../src/markdown/external-links";

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
  const { hastPlugin } = externalLinks(SITE);
  expect(hastPlugin.element.filter).toEqual(["a"]);
  hastPlugin.element.visit(node, ctx);
  return { props, appended };
}

describe("TC-U12 isExternalHref", () => {
  it.each([
    ["https://note.com/x", true],
    ["http://example.com/", true],
    ["https://fukugyononuko.github.io.evil.example/", true],
    ["//example.com/x", true],
    ["//localhost:4321/x", true],
    ["HTTPS://NOTE.COM/x", true],
    ["https://fukugyononuko.github.io:8443/", true],
    ["http://fukugyononuko.github.io/", true],
    ["//fukugyononuko.github.io/x", false],
    ["https://FUKUGYONONUKO.github.io:443/x", false],
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

describe("TC-U12 externalLinks：本文に HTML の <a> を直接書くとビルドを失敗させる（DD-02、DD-08）", () => {
  const ctx = { fileURL: new URL("file:///repo/src/content/news/a.md") };
  const buildDone = (links: ReturnType<typeof externalLinks>) => links.integration.hooks["astro:build:done"]();

  it.each([
    '<a href="https://example.com/">',
    '<A HREF="https://example.com/">',
    '<p><a href="https://example.com/">ブロック</a></p>',
    "<a>",
    '<a\nhref="/x">',
  ])("%s を記録し、ビルドの最後に RawAnchorError（ファイル名つき）", (value) => {
    const links = externalLinks(SITE);
    links.hastPlugin.raw({ value }, ctx);
    expect([...links.violations]).toEqual(["/repo/src/content/news/a.md"]);
    expect(() => buildDone(links)).toThrow(RawAnchorError);
    expect(() => buildDone(links)).toThrow(/a\.md/);
  });

  it.each(["<abbr title=\"x\">x</abbr>", "<br>", "</a>", "<!-- a -->", "<aside>"])("%s は記録せず、ビルドを止めない", (value) => {
    const links = externalLinks(SITE);
    links.hastPlugin.raw({ value }, ctx);
    expect(links.violations.size).toBe(0);
    expect(() => buildDone(links)).not.toThrow();
  });

  it("違反したファイルが複数なら、すべてをエラーに書く", () => {
    const links = externalLinks(SITE);
    links.hastPlugin.raw({ value: "<a>" }, { fileURL: new URL("file:///repo/a.md") });
    links.hastPlugin.raw({ value: "<a>" }, { fileURL: new URL("file:///repo/b.md") });
    expect(() => buildDone(links)).toThrow(/a\.md、\/repo\/b\.md/);
  });
});
