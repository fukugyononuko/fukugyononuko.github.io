// CMP-A03 ChannelAccess の内部：Astro の Content Collections から読む（RES-03）
import { getCollection } from "astro:content";
import type { ChannelData } from "./schema";

export async function loadChannelsFromAstro(): Promise<ChannelData[]> {
  return (await getCollection("channels")).map((e) => e.data);
}
