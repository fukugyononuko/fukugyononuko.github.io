// DD-01 契約：Engine の出力
export interface PriceDisplay {
  visible: boolean;
  text: string;
  note?: string;
}

export type CallToAction =
  | { route: "inquiry"; href: string; label: string }
  | { route: "external"; href: string; label: string; channelId: string };
