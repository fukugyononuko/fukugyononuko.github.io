// CMP-A03 ChannelAccess の内部：Astro の Content Collections から読む（RES-03）
import { getCollection } from "astro:content";
import type { ChannelSource } from "./index";

export const astroChannelSource: ChannelSource = {
  async channels() {
    return (await getCollection("channels")).map((e) => e.data);
  },
  async shareTargets() {
    return (await getCollection("shareTargets")).map((e) => e.data);
  },
};
