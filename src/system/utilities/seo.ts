// CMP-U02 Seo / DD-10（NFR-04）
import type { PageMeta, PageMetaInput, Seo, SiteConfig } from "../contracts";
import { toAbsoluteUrl } from "./config";

const DEFAULT_OG_IMAGE = "/og-default.jpg";

export function createSeo(config: SiteConfig): Seo {
  return {
    buildPageMeta(input: PageMetaInput): PageMeta {
      return {
        title: input.title ? `${input.title} | ${input.siteName}` : input.siteName,
        description: input.description,
        canonical: toAbsoluteUrl(config, input.path),
        ogImage: toAbsoluteUrl(config, input.ogImage ?? DEFAULT_OG_IMAGE),
        ogType: input.type ?? "website",
      };
    },
  };
}
