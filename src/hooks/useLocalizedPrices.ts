import { useEffect, useState } from "react";
import { initializePaddle, getPaddlePriceId } from "@/lib/paddle";
import { pricingConfig } from "@/config/pricing";
import { isNative } from "@/lib/platformUtils";

/**
 * Fetches localized prices from Paddle.PricePreview() based on visitor IP.
 * Paddle resolves the correct country override (currency + amount) per Price
 * entity's `unit_price_overrides` configured server-side.
 *
 * Returns pre-formatted strings (e.g. "€19.90", "£16.90", "$199") plus the
 * raw amount + currency for deriving per-month from yearly in the same
 * currency.
 *
 * Fallback (native app, no Paddle or network error): the central EUR pricing
 * strategy. Storefronts still display the final localized price at checkout.
 */

export interface LocalizedPrice {
  formatted: string;       // e.g. "€19.90"
  amount: number;          // major units, e.g. 19.90
  currencyCode: string;    // e.g. "EUR"
}

export type LocalizedPricesMap = Record<string, LocalizedPrice>;

interface PaddlePreviewLineItem {
  price?: { id?: string };
  totals?: { total?: string; subtotal?: string };
  unitTotals?: { total?: string; subtotal?: string };
}

interface PaddlePreviewResult {
  data?: {
    currencyCode?: string;
    details?: { lineItems?: PaddlePreviewLineItem[] };
  };
}

const FALLBACK_PRICES = Object.values(pricingConfig).reduce<LocalizedPricesMap>((map, option) => {
  if (!option.webPriceId) return map;
  map[option.webPriceId] = {
    formatted: new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: option.amountEur % 1 === 0 ? 0 : 2,
    }).format(option.amountEur),
    amount: option.amountEur,
    currencyCode: "EUR",
  };
  return map;
}, {});

const ALL_PRICE_IDS = Object.keys(FALLBACK_PRICES);

// Module-level cache: PricePreview is identical for all callers on the same IP.
let cachedPrices: LocalizedPricesMap | null = null;
let inflight: Promise<LocalizedPricesMap> | null = null;

function formatAmount(amountMinor: string, currencyCode: string): { formatted: string; amount: number } {
  // Paddle returns amounts in minor units as strings (e.g. "1990" for 19.90).
  // Most currencies have 2 decimals; JPY/KRW have 0. Use Intl to handle this.
  const minor = parseInt(amountMinor, 10);
  // Build a temporary formatter to discover currency fraction digits.
  const probe = new Intl.NumberFormat("en-US", { style: "currency", currency: currencyCode });
  const fractionDigits = probe.resolvedOptions().maximumFractionDigits ?? 2;
  const amount = minor / Math.pow(10, fractionDigits);
  const formatted = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: amount % 1 === 0 ? 0 : fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amount);
  return { formatted, amount };
}

async function fetchLocalizedPrices(): Promise<LocalizedPricesMap> {
  if (cachedPrices) return cachedPrices;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      await initializePaddle();

      // Resolve all human-readable IDs to Paddle internal IDs.
      const paddleIds = await Promise.all(
        ALL_PRICE_IDS.map(async (id) => ({ humanId: id, paddleId: await getPaddlePriceId(id) }))
      );

      // Single PricePreview call for all 4 prices (IP-based geolocation).
      const paddle = window.Paddle as unknown as {
        PricePreview(input: { items: Array<{ priceId: string; quantity: number }> }): Promise<PaddlePreviewResult>;
      };
      const result = await paddle.PricePreview({
        items: paddleIds.map((p) => ({ priceId: p.paddleId, quantity: 1 })),
      });

      const lineItems = result?.data?.details?.lineItems ?? [];
      const map: LocalizedPricesMap = { ...FALLBACK_PRICES };

      for (const item of lineItems) {
        const paddleId: string = item?.price?.id;
        const match = paddleIds.find((p) => p.paddleId === paddleId);
        if (!match) continue;
        // Consumer pricing must include tax where Paddle applies inclusive VAT;
        // `subtotal` would otherwise show €163.11 for a €199 Italian price.
        const minor: string = item?.totals?.total ?? item?.totals?.subtotal ?? item?.unitTotals?.total ?? item?.unitTotals?.subtotal;
        const currency: string = result?.data?.currencyCode;
        if (minor == null || !currency) continue;
        const { formatted, amount } = formatAmount(minor, currency);
        map[match.humanId] = { formatted, amount, currencyCode: currency };
      }

      cachedPrices = map;
      return map;
    } catch (e) {
      console.warn("[useLocalizedPrices] PricePreview failed, using configured prices", e);
      cachedPrices = FALLBACK_PRICES;
      return FALLBACK_PRICES;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

/**
 * Returns localized prices keyed by human-readable priceId.
 * `ready` is true once Paddle has resolved (or fallback is applied).
 */
export function useLocalizedPrices(): {
  prices: LocalizedPricesMap;
  ready: boolean;
  formatInCurrency: (amount: number, currencyCode: string) => string;
} {
  const [prices, setPrices] = useState<LocalizedPricesMap>(cachedPrices ?? FALLBACK_PRICES);
  const [ready, setReady] = useState<boolean>(isNative() || !!cachedPrices);

  useEffect(() => {
    if (isNative()) {
      setPrices(FALLBACK_PRICES);
      setReady(true);
      return;
    }
    if (cachedPrices) {
      setPrices(cachedPrices);
      setReady(true);
      return;
    }
    let cancelled = false;
    fetchLocalizedPrices().then((p) => {
      if (!cancelled) {
        setPrices(p);
        setReady(true);
      }
    });
    return () => { cancelled = true; };
  }, []);

  const formatInCurrency = (amount: number, currencyCode: string) => {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return { prices, ready, formatInCurrency };
}

/**
 * @deprecated Use `useLocalizedPrices()` — returns localized full prices
 * with proper formatting, not just a currency symbol.
 * Kept for backwards compatibility while pages are migrated.
 */
export function useCurrencySymbol(): string {
  const { prices } = useLocalizedPrices();
  const coreMonthlyId = pricingConfig.core_monthly.webPriceId ?? "looma_pro_monthly";
  const code = prices[coreMonthlyId]?.currencyCode ?? "EUR";
  // Best-effort symbol extraction from a formatted price.
  const sample = prices[coreMonthlyId]?.formatted ?? "€0";
  const match = sample.match(/^[^\d\s.,-]+/);
  return match?.[0] ?? (code === "EUR" ? "€" : code + " ");
}
