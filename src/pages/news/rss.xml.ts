// CMP-C01 Pages / RSS フィード（DD-11、CC-07、FR-17、EIF-07）
// 依存を増やさないよう XML を自分で組み立てる。文字列は必ずエスケープする（NFR-15）。
import type { APIRoute } from "astro";
import { engagement } from "../../system/compose";

const ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" };
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ESCAPES[c]);
/** 公開日（日本時間の 0 時）を RFC 822 の形にする */
const rfc822 = (iso: string) => new Date(`${iso}T00:00:00+09:00`).toUTCString();

export const GET: APIRoute = async () => {
  const feed = await engagement.getNewsFeed();
  const items = feed.items.map((i) => [
    "<item>",
    `<title>${esc(i.title)}</title>`,
    `<link>${esc(i.link)}</link>`,
    `<guid isPermaLink="true">${esc(i.link)}</guid>`,
    `<pubDate>${rfc822(i.date)}</pubDate>`,
    `<description>${esc(i.description)}</description>`,
    ...i.categories.map((c) => `<category>${esc(c)}</category>`),
    "</item>",
  ].join(""));
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>',
    `<title>${esc(feed.title)}</title>`,
    `<link>${esc(feed.siteUrl)}</link>`,
    `<description>${esc(feed.description)}</description>`,
    "<language>ja</language>",
    `<atom:link href="${esc(feed.feedUrl)}" rel="self" type="application/rss+xml"/>`,
    ...items,
    "</channel></rss>",
  ].join("\n");
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
};
