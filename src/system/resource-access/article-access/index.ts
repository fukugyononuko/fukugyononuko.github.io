// CMP-A04 ArticleAccess / DD-08（VOL-06、FR-11）
// 記事の出所を隠して提供する。初期の出所は、このサイトに書くニュース（src/content/news/）。
// note の RSS なども使うときは、ここに実装を足して compose.ts で切り替える。
import type { Article, ArticleAccess, ArticleRecord, TrustedHtml } from "../../contracts";
import type { NewsData } from "./schema";

export interface ArticleEntry {
  id: string;
  data: NewsData;
  /** Markdown の本文を変換した HTML */
  html: TrustedHtml;
}

export interface ArticleSource {
  articles(): Promise<ArticleEntry[]>;
  /** 画像のパス（/images/news/…）のファイルが公開されるか */
  imageExists(src: string): boolean;
}

export class InvalidArticleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidArticleError";
  }
}

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function createLocalArticleAccess(source: ArticleSource): ArticleAccess {
  async function published(): Promise<ArticleRecord[]> {
    const entries = await source.articles();
    return entries
      .filter((e) => !e.data.draft)
      .map((e) => toRecord(e, source))
      .sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
  }

  return {
    async listRecentArticles(limit?: number): Promise<Article[]> {
      const articles = (await published()).map(({ body: _body, ...summary }) => summary);
      return limit === undefined ? articles : articles.slice(0, limit);
    },

    async findArticle(slug: string): Promise<ArticleRecord | undefined> {
      return (await published()).find((a) => a.slug === slug);
    },
  };
}

function toRecord({ id, data, html }: ArticleEntry, source: ArticleSource): ArticleRecord {
  if (!SLUG_PATTERN.test(id)) {
    throw new InvalidArticleError(`記事のファイル名「${id}」は英小文字・数字・ハイフンだけにしてください（DD-08）`);
  }
  if (data.image && !source.imageExists(data.image.src)) {
    throw new InvalidArticleError(`記事「${id}」の画像 public${data.image.src} がありません（DD-08）`);
  }
  return {
    id,
    slug: id,
    title: data.title,
    summary: data.summary,
    category: data.category,
    date: data.date,
    updated: data.updated,
    tags: data.tags,
    image: data.image,
    body: html,
  };
}
