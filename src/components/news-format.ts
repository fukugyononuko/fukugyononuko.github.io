// CMP-C01 ニュースの表示の決まり（DD-11）：分類のラベルと日付の書式は Client が持つ
import type { ArticleCategory } from "../system/contracts";

export const categoryLabel: Record<ArticleCategory, string> = { notice: "お知らせ", work: "制作", essay: "読み物" };

/** "2026-10-17" → "2026年10月17日" */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${y}年${m}月${d}日`;
}

/** 記事の画像がないときにカードに出す既定の画像（02a §2a.7） */
export const DEFAULT_ARTICLE_IMAGE = "/og-default.jpg";
