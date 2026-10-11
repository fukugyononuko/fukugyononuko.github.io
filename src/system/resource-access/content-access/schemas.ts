// CMP-A01 ContentAccess の内部：コンテンツのスキーマ（DD-02、FR-14）
// src/content.config.ts からも使う。違反があると astro build が失敗する。
import { z } from "astro/zod";

const httpsUrl = z.string().regex(/^https:\/\//, "https:// で始まる URL を書いてください");
const isoDate = z.coerce.date().transform((d) => d.toISOString().slice(0, 10));
const order = z.number().default(100);

export const profileSchema = z
  .object({
    displayName: z.string().min(1),
    tagline: z.string().min(1).max(120),
    avatar: z.object({ src: z.string().min(1), alt: z.string().min(1, "画像の alt は必須です（NFR-03）") }).strict(),
  })
  .strict();

export const skillGroupSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    order,
    skills: z.array(
      z
        .object({
          id: z.string().min(1),
          name: z.string().min(1),
          description: z.string().optional(),
          featured: z.boolean().default(false),
          order,
        })
        .strict(),
    ),
  })
  .strict();

export const workSchema = z
  .object({
    kind: z.enum(["client", "personal", "sample"], "kind は client / personal / sample のどれかを必ず書いてください（FR-03）"),
    title: z.string().min(1).max(40),
    summary: z.string().min(1).max(120),
    url: httpsUrl.optional(),
    date: isoDate,
    featured: z.boolean().default(false),
    order,
    draft: z.boolean().default(false),
  })
  .strict();

const amount = z.number().int().nonnegative();
const priceSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("fixed"), amount, unit: z.string().optional() }).strict(),
  z.object({ kind: z.literal("from"), amount, unit: z.string().optional() }).strict(),
  z.object({ kind: z.literal("quote") }).strict(),
]);

const ctaSchema = z.discriminatedUnion("route", [
  z.object({ route: z.literal("inquiry") }).strict(),
  z.object({ route: z.literal("channel"), channelId: z.string().min(1), label: z.string().optional() }).strict(),
]);

export const serviceSchema = z
  .object({
    title: z.string().min(1).max(40),
    summary: z.string().min(1).max(120),
    audience: z.array(z.string()).default([]),
    deliverables: z.array(z.string()).default([]),
    price: priceSchema,
    priceNote: z.string().optional(),
    leadTime: z.string().optional(),
    cta: ctaSchema.default({ route: "inquiry" }),
    date: isoDate.optional(),
    featured: z.boolean().default(false),
    order,
    draft: z.boolean().default(false),
  })
  .strict();

const curationRule = z
  .object({
    featuredLimit: z.number().int().min(0).max(12),
    sort: z.enum(["order", "date-desc"]),
  })
  .strict();

export const presentationSchema = z
  .object({
    pricePolicy: z.enum(["as-is", "from-only", "hide"]),
    curation: z.object({ skills: curationRule, works: curationRule, services: curationRule }).strict(),
  })
  .strict();

export type ProfileData = z.output<typeof profileSchema>;
export type SkillGroupData = z.output<typeof skillGroupSchema>;
export type WorkData = z.output<typeof workSchema>;
export type ServiceData = z.output<typeof serviceSchema>;
export type PresentationData = z.output<typeof presentationSchema>;
