// CMP-A04 ArticleAccess の内部：ニュースの記事のスキーマ（DD-08、FR-14）
// src/content.config.ts からも使う。違反があると astro build が失敗する。
import { z } from "astro/zod";

const isoDate = z.coerce.date().transform((d) => d.toISOString().slice(0, 10));

export const newsSchema = z
  .object({
    title: z.string().min(1).max(60),
    summary: z.string().min(1).max(120),
    category: z.enum(["notice", "work", "essay"], "category は notice / work / essay のどれかを必ず書いてください（FR-11）"),
    date: isoDate,
    updated: isoDate.optional(),
    tags: z
      .array(z.string().min(1).max(20))
      .max(5)
      .default([])
      .refine((tags) => new Set(tags).size === tags.length, "タグが重複しています"),
    image: z
      .object({
        src: z
          .string()
          .regex(/^\/images\/news\/[a-z0-9-]+\.(webp|jpg|jpeg|png)$/, "画像は public/images/news/ の下の .webp / .jpg / .png にしてください"),
        alt: z.string().min(1, "画像の alt は必須です（NFR-03）"),
        caption: z.string().min(1).optional(),
        credit: z.string().min(1).max(60).optional(),
      })
      .strict()
      .optional(),
    draft: z.boolean().default(false),
  })
  .strict()
  .refine((d) => !d.updated || d.updated >= d.date, { message: "updated は date 以降の日付にしてください", path: ["updated"] });

export type NewsData = z.output<typeof newsSchema>;
