// CMP-E01 PricingEngine / DD-03（VOL-03、FR-06）
import type { PriceDisplay, PricePolicy, PriceSpec, PricingEngine } from "../contracts";

const QUOTE = "お見積もり";
const yen = new Intl.NumberFormat("ja-JP");

export function createPricingEngine(): PricingEngine {
  return {
    presentPrice(price: PriceSpec, policy: PricePolicy, note?: string): PriceDisplay {
      const display: PriceDisplay = { visible: true, text: priceText(price, policy) };
      if (note && policy !== "hide") display.note = note;
      return display;
    },
  };
}

function priceText(price: PriceSpec, policy: PricePolicy): string {
  if (price.kind === "quote" || policy === "hide") return QUOTE;
  if (price.kind === "from" || policy === "from-only") return `${yen.format(price.amount)}円〜`;
  return price.unit ? `${yen.format(price.amount)}円 / ${price.unit}` : `${yen.format(price.amount)}円`;
}
