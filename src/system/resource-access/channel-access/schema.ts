// CMP-A03 ChannelAccess の内部：外部チャネルの設定のスキーマ（DD-07、RES-03）
import { z } from "astro/zod";

export const channelSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    label: z.string().min(1),
    url: z.string().regex(/^https:\/\//, "https:// で始まる URL を書いてください"),
    icon: z.string().min(1),
    order: z.number().default(100),
  })
  .strict();

export type ChannelData = z.output<typeof channelSchema>;

/** 記事の共有先（DD-07「共有先」）。url は共有用 URL の形で、{url} と {title} を置き換える */
export const shareTargetSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    label: z.string().min(1),
    icon: z.string().min(1),
    url: z
      .string()
      .regex(/^https:\/\//, "https:// で始まる URL を書いてください")
      .refine((u) => u.includes("{url}"), "共有用 URL の形には {url} を含めてください"),
    order: z.number().default(100),
  })
  .strict();

export type ShareTargetData = z.output<typeof shareTargetSchema>;
