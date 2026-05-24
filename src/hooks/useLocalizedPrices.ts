import { useEffect, useState } from "react";
import { initializePaddle, getPaddlePriceId } from "@/lib/paddle";

export type LocalizedPrice = {
  /** Pre-formatted price string with the visitor's local currency, e.g. "€19,90" or "$19.90" */
  formatted: string;
  /** Numeric amount in major units (e.g. 19.90), useful for derived calculations */
  amount: number;
  /** ISO currency code, e.g. "EUR" */
  currencyCode: string;
};

export type LocalizedPricesMap = Record<string, LocalizedPrice>;

/**
 * Resolves human-readable price IDs to Paddle internal IDs, then calls
 * Paddle.PricePreview() which auto-detects the visitor's location via IP
 * and returns prices in their local currency (with country-specific
 * overrides if configured on the Price entity).
 *
 * Returns a map keyed by the original human-readable priceId.
 * Falls back to `null` for individual IDs that fail to resolve so the UI
 * can render hardcoded USD strings as a graceful fallback.
 */
export function useLocalizedPrices(priceIds: string[]) {
  const [prices, setPrices] = useState<LocalizedPricesMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stable key for the effect dep
  const key = priceIds.slice().sort().join(",");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        await initializePaddle();

        // Resolve human IDs -> paddle pri_* IDs in parallel
        const resolved = await Promise.all(
          priceIds.map(async (id) => {
            try {
              const paddleId = await getPaddlePriceId(id);
              return { humanId: id, paddleId };
            } catch {
              return { humanId: id, paddleId: null as string | null };
            }
          })
        );

        const valid = resolved.filter((r): r is { humanId: string; paddleId: string } => !!r.paddleId);
        if (valid.length === 0) {
          if (!cancelled) {
            setPrices({});
            setLoading(false);
          }
          return;
        }

        // Paddle.PricePreview auto-detects visitor location via IP
        const result = await window.Paddle.PricePreview({
          items: valid.map((v) => ({ priceId: v.paddleId, quantity: 1 })),
        });

        const lineItems = result?.data?.details?.lineItems ?? [];
        const map: LocalizedPricesMap = {};

        for (const v of valid) {
          const li = lineItems.find((x: any) => x?.price?.id === v.paddleId);
          if (!li) continue;
          const formatted: string | undefined = li.formattedTotals?.subtotal ?? li.formattedTotals?.total;
          const rawAmount: string | undefined = li.totals?.subtotal ?? li.totals?.total;
          const currencyCode: string | undefined = result?.data?.currencyCode;
          if (!formatted || !rawAmount || !currencyCode) continue;
          map[v.humanId] = {
            formatted,
            amount: Number(rawAmount) / 100,
            currencyCode,
          };
        }

        if (!cancelled) {
          setPrices(map);
          setLoading(false);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || "Failed to load localized prices");
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  /**
   * Helper: format a numeric major-unit amount in the same currency as one
   * of the resolved prices (useful for deriving per-month from yearly).
   */
  const formatInCurrency = (amount: number, currencyCode: string): string => {
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `${amount.toFixed(2)} ${currencyCode}`;
    }
  };

  return { prices, loading, error, formatInCurrency };
}
