// CMP-E03 CtaEngine / DD-05（VOL-02、FR-07）
import type { CallToAction, ChannelAccess, CtaEngine, ServiceRecord, SiteConfig } from "../contracts";
import { withBase } from "../utilities/config";

export class UnknownChannelError extends Error {
  constructor(serviceSlug: string, channelId: string) {
    super(`サービス「${serviceSlug}」の cta.channelId「${channelId}」は channels.yaml にありません`);
    this.name = "UnknownChannelError";
  }
}

export function createCtaEngine(channels: ChannelAccess, config: SiteConfig): CtaEngine {
  return {
    async decideForService(service: ServiceRecord): Promise<CallToAction> {
      if (service.cta.route === "inquiry") {
        return {
          route: "inquiry",
          href: withBase(config, `/contact/?service=${encodeURIComponent(service.slug)}`),
          label: "このサービスについて問い合わせる",
        };
      }
      const channel = await channels.findChannel(service.cta.channelId);
      if (!channel) throw new UnknownChannelError(service.slug, service.cta.channelId);
      return {
        route: "external",
        href: channel.url,
        label: service.cta.label ?? `${channel.label}で見る`,
        channelId: channel.id,
      };
    },
  };
}
