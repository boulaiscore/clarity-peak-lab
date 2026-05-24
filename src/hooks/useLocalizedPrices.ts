import { useEffect, useState } from "react";

/**
 * Returns a currency symbol based on the visitor's country (IP geolocation).
 * The numeric price values stay identical across regions — ONLY the symbol
 * changes (e.g. "$19.90" -> "€19.90" -> "£19.90").
 *
 * Defaults to "$" if detection fails or country is not mapped.
 */

// Country code -> currency symbol. Eurozone + main markets.
const COUNTRY_TO_SYMBOL: Record<string, string> = {
  // Eurozone
  AT: "€", BE: "€", CY: "€", DE: "€", EE: "€", ES: "€", FI: "€", FR: "€",
  GR: "€", HR: "€", IE: "€", IT: "€", LT: "€", LU: "€", LV: "€", MT: "€",
  NL: "€", PT: "€", SI: "€", SK: "€",
  // UK
  GB: "£",
  // Switzerland
  CH: "CHF ",
  // Nordics
  SE: "kr ", NO: "kr ", DK: "kr ",
  // Others
  CA: "CA$", AU: "A$", NZ: "NZ$",
  JP: "¥", CN: "¥",
  IN: "₹",
  BR: "R$",
  MX: "MX$",
};

let cachedSymbol: string | null = null;
let inflight: Promise<string> | null = null;

async function detectSymbol(): Promise<string> {
  if (cachedSymbol) return cachedSymbol;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const res = await fetch("https://ipapi.co/json/", { cache: "force-cache" });
      if (!res.ok) throw new Error("geo failed");
      const data = await res.json();
      const country: string | undefined = data?.country_code || data?.country;
      const symbol = (country && COUNTRY_TO_SYMBOL[country.toUpperCase()]) || "$";
      cachedSymbol = symbol;
      return symbol;
    } catch {
      cachedSymbol = "$";
      return "$";
    }
  })();

  return inflight;
}

/**
 * Hook: returns the currency symbol to prefix prices with.
 * Numbers are NOT converted — only the symbol changes.
 */
export function useCurrencySymbol(): string {
  const [symbol, setSymbol] = useState<string>(cachedSymbol ?? "$");

  useEffect(() => {
    if (cachedSymbol) {
      setSymbol(cachedSymbol);
      return;
    }
    let cancelled = false;
    detectSymbol().then((s) => {
      if (!cancelled) setSymbol(s);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return symbol;
}
