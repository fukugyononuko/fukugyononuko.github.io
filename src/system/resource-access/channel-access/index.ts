// CMP-A03 ChannelAccess / DD-07（VOL-07、FR-10、FR-15）
import type { Channel, ChannelAccess, ShareLink } from "../../contracts";
import type { ChannelData, ShareTargetData } from "./schema";

export class InvalidChannelConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidChannelConfigError";
  }
}

export interface ChannelSource {
  channels(): Promise<ChannelData[]>;
  shareTargets(): Promise<ShareTargetData[]>;
}

export function createChannelAccess(source: ChannelSource): ChannelAccess {
  async function listChannels(): Promise<Channel[]> {
    return sortedUnique(await source.channels(), "チャネル");
  }

  return {
    listChannels,
    async findChannel(id: string): Promise<Channel | undefined> {
      return (await listChannels()).find((c) => c.id === id);
    },

    async listShareLinks(page: { url: string; title: string }): Promise<ShareLink[]> {
      const targets = sortedUnique(await source.shareTargets(), "共有先");
      return targets.map((t) => ({
        id: t.id,
        label: t.label,
        icon: t.icon,
        // 見出しに & や # があっても URL が壊れないよう、値はエンコードしてから置き換える
        url: t.url.replaceAll("{url}", encodeURIComponent(page.url)).replaceAll("{title}", encodeURIComponent(page.title)),
      }));
    },
  };
}

function sortedUnique<T extends { id: string; order: number }>(items: T[], kind: string): T[] {
  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item.id)) throw new InvalidChannelConfigError(`${kind}の id「${item.id}」が重複しています`);
    seen.add(item.id);
  }
  return [...items].sort((a, b) => a.order - b.order);
}
