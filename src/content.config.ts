// CMP-A01〜A04 の内部：Content Collections の定義（DD-02、DD-06〜DD-08、RES-01〜04）
// Client はこのファイルとコレクションを直接使わない（R1）。ResourceAccess を通して読む。
import { defineCollection } from "astro:content";
import { file, glob } from "astro/loaders";
import yaml from "js-yaml";
import {
  presentationSchema, profileSchema, serviceSchema, skillGroupSchema, workSchema,
} from "./system/resource-access/content-access/schemas";
import { inquirySchema } from "./system/resource-access/inquiry-access/schema";
import { channelSchema, shareTargetSchema } from "./system/resource-access/channel-access/schema";
import { newsSchema } from "./system/resource-access/article-access/schema";

/** 1 件だけの設定ファイルを、id「main」のエントリーとして読む */
const singleEntry = (text: string) => ({ main: yaml.load(text) as Record<string, unknown> });

export const collections = {
  profile: defineCollection({ loader: glob({ pattern: "profile.md", base: "./src/content" }), schema: profileSchema }),
  skills: defineCollection({ loader: file("src/content/skills.yaml"), schema: skillGroupSchema }),
  works: defineCollection({ loader: glob({ pattern: "*.md", base: "./src/content/works" }), schema: workSchema }),
  services: defineCollection({ loader: glob({ pattern: "*.md", base: "./src/content/services" }), schema: serviceSchema }),
  presentation: defineCollection({
    loader: file("src/content/settings/presentation.yaml", { parser: singleEntry }),
    schema: presentationSchema,
  }),
  inquiry: defineCollection({ loader: file("src/content/settings/inquiry.yaml", { parser: singleEntry }), schema: inquirySchema }),
  channels: defineCollection({ loader: file("src/content/settings/channels.yaml"), schema: channelSchema }),
  shareTargets: defineCollection({ loader: file("src/content/settings/share-targets.yaml"), schema: shareTargetSchema }),
  news: defineCollection({ loader: glob({ pattern: "*.md", base: "./src/content/news" }), schema: newsSchema }),
};
