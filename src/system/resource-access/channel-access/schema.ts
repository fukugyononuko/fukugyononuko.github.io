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
