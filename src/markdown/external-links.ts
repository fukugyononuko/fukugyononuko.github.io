// CMP-A01・A04 の内部：Markdown の本文の外部リンクに、新しいタブと noopener を付ける（DD-11、NFR-16、#39）
// Astro 7 の標準の Markdown の変換器 Sätteri の hast プラグイン。astro.config.mjs の markdown.processor で使う。
// 部品の外部リンク（ExternalLink.astro）と同じ属性と読み上げの文字にそろえる。
// 本文に HTML の <a> を直接書いたものにはこの変換が届かない。それは入力では止めず、ビルドしたすべてのページの
// 外部リンクを確かめる TC-N13 で、出力の側で止める（PR #47 のレビュー 6 回目。入力の断片では HTML の文脈がわからないため）。

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

export function externalLinks(site: string) {
  return {
    name: "external-links",
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
}
