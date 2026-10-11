// CMP-U01 Config / DD-10（VOL-08）
// 公開先に関わる値はここだけが知る。値の元は astro.config.mjs の site と base。
import type { SiteConfig } from "../contracts";

export function createSiteConfig(env: { SITE?: string; BASE_URL?: string }): SiteConfig {
  if (!env.SITE) throw new Error("astro.config.mjs に site が設定されていません");
  return {
    siteUrl: env.SITE.replace(/\/$/, ""),
    base: normalizeBase(env.BASE_URL ?? "/"),
    locale: "ja",
  };
}

/** サイト内のパスにベースパスを付ける。例：withBase(config, "/contact/") */
export function withBase(config: SiteConfig, path: string): string {
  return `${config.base}${path.replace(/^\//, "")}`;
}

/** サイト内のパスを絶対 URL にする */
export function toAbsoluteUrl(config: SiteConfig, path: string): string {
  return `${config.siteUrl}${withBase(config, path)}`;
}

function normalizeBase(base: string): string {
  const withLeading = base.startsWith("/") ? base : `/${base}`;
  return withLeading.endsWith("/") ? withLeading : `${withLeading}/`;
}
