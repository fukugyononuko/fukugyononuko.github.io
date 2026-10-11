// CMP-A02 InquiryAccess の内部：問い合わせ手段の設定のスキーマ（DD-06、RES-02）
import { z } from "astro/zod";

const httpsUrl = z.string().regex(/^https:\/\//, "https:// で始まる URL を書いてください");
const note = z.string().optional();

const field = z
  .object({
    name: z.enum(["name", "replyTo", "service", "message"]),
    label: z.string().min(1),
    required: z.boolean(),
    param: z.string().min(1).optional(),
  })
  .strict();

export const inquirySchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("form-post"),
      action: httpsUrl,
      fields: z
        .array(field)
        .refine((fs) => ["replyTo", "message"].every((n) => fs.some((f) => f.name === n && f.required)), {
          message: "fields には必須の replyTo と message が必要です",
        }),
      honeypotField: z.string().min(1).optional(),
      note,
    })
    .strict(),
  z.object({ kind: z.literal("embed"), src: httpsUrl, fallbackUrl: httpsUrl, note }).strict(),
  z.object({ kind: z.literal("link"), url: httpsUrl, label: z.string().min(1), note }).strict(),
]);

export type InquiryData = z.output<typeof inquirySchema>;
