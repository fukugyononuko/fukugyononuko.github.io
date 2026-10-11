// CMP-A03 ChannelAccess / DD-07（VOL-07、FR-10）
import type { Channel, ChannelAccess } from "../../contracts";
import type { ChannelData } from "./schema";

export class InvalidChannelConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidChannelConfigError";
  }
}

export function createChannelAccess(load: () => Promise<ChannelData[]>): ChannelAccess {
  async function listChannels(): Promise<Channel[]> {
    const channels = await load();
    const seen = new Set<string>();
    for (const c of channels) {
      if (seen.has(c.id)) throw new InvalidChannelConfigError(`チャネルの id「${c.id}」が重複しています`);
      seen.add(c.id);
    }
    return [...channels].sort((a, b) => a.order - b.order);
  }

  return {
    listChannels,
    async findChannel(id: string): Promise<Channel | undefined> {
      return (await listChannels()).find((c) => c.id === id);
    },
  };
}
