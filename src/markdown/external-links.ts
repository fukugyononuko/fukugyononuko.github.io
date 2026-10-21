// CMP-A01・A04 の内部：Markdown の本文の外部リンクに、新しいタブと noopener を付ける（DD-11、NFR-16、#39）
// Astro 7 の標準の Markdown の変換器 Sätteri の hast プラグイン。astro.config.mjs の markdown.processor で使う。
// 部品の外部リンク（ExternalLink.astro）と同じ属性と読み上げの文字にそろえる。
import { htmlToHast } from "satteri";

// 本文に HTML の <a> を直接書くと、この変換が届かない（Sätteri は raw の節として渡す）ので、ビルドを失敗させる（DD-02、DD-08）。
// プラグインの中で例外を出しても、Content Collections の読み込みはログに出すだけでビルドを止めない（PR #47 で確かめた）。
// そのため、プラグインは違反を記録し、integration の astro:build:done で失敗させる。

/** ExternalLink.astro と同じ読み上げの文字 */
export const NEW_TAB_NOTE = "（新しいタブで開きます）";

/** Sätteri の型に依存しないよう、使う部分だけを書く */
interface HastElement {
  properties?: Record<string, unknown>;
}
interface VisitorContext {
  setProperty(node: HastElement, key: string, value: unknown): void;
  appendChild(node: HastElement, child: unknown): void;
}

/** 本文に HTML の <a> を直接書いたときのエラー（ビルドを失敗させる） */
export class RawAnchorError extends Error {
  constructor(files: string[]) {
    super(`${files.join("、")}：本文に HTML の <a> を直接書かないでください。リンクは Markdown の書き方 [文字](URL) で書いてください（DD-02、NFR-16）`);
    this.name = "RawAnchorError";
  }
}

interface HastNodeLike {
  type: string;
  tagName?: string;
  children?: HastNodeLike[];
}

/**
 * raw の HTML が、表示されたときに <a> 要素になるか。
 * 正規表現で調べると、コメントの閉じ方（<!-->、--!>）や <textarea> の中身などの規則を取りこぼす（PR #47 のレビュー 4・5 回目）ので、
 * Sätteri が表示に使うのと同じ HTML の解析器で木にして、<a> 要素を探す。
 */
export function hasRawAnchor(html: string): boolean {
  const walk = (node: HastNodeLike): boolean =>
    (node.type === "element" && node.tagName === "a") || (node.children ?? []).some(walk);
  return walk(htmlToHast(html, { fragment: true }) as HastNodeLike);
}

/** http・https で、サイトと別のオリジンへのリンクか */
export function isExternalHref(href: unknown, site: string): boolean {
  if (typeof href !== "string" || href === "") return false;
  let url: URL;
  try {
    url = new URL(href, site);
  } catch {
    return false;
  }
  return (url.protocol === "http:" || url.protocol === "https:") && url.origin !== new URL(site).origin;
}

/** 本文の変換（hastPlugin）と、違反があればビルドを失敗させる integration の組 */
export function externalLinks(site: string) {
  /** HTML の <a> を直接書いたファイル */
  const violations = new Set<string>();
  const hastPlugin = {
    name: "external-links",
    raw(node: { value: string }, ctx: { fileURL?: URL }) {
      if (hasRawAnchor(node.value)) violations.add(ctx.fileURL?.pathname ?? "Markdown の本文");
    },
    element: {
      filter: ["a"],
      visit(node: HastElement, ctx: VisitorContext) {
        if (!isExternalHref(node.properties?.href, site)) return;
        ctx.setProperty(node, "target", "_blank");
        ctx.setProperty(node, "rel", ["noopener", "noreferrer"]);
        ctx.appendChild(node, {
          type: "element",
          tagName: "span",
          properties: { className: ["visually-hidden"] },
          children: [{ type: "text", value: NEW_TAB_NOTE }],
        });
      },
    },
  };
  const integration = {
    name: "external-links-check",
    hooks: {
      "astro:build:done": () => {
        if (violations.size > 0) throw new RawAnchorError([...violations]);
      },
    },
  };
  return { hastPlugin, integration, violations };
}
