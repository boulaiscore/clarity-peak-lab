/**
 * Shared surface treatment for the six primary Lab mode cards.
 * Keep the material neutral here; each mode can retain its own visual language
 * inside the card without changing the card background or border.
 */
export const LAB_MODE_CARD_CLASS =
  "group relative h-[168px] w-full overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-b from-card/90 to-card/55 p-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] transition-all duration-200 hover:border-border/75 hover:from-card hover:to-card/70";

export const LAB_MODE_CARD_AMBIENCE_CLASS =
  "pointer-events-none absolute inset-x-0 top-0 h-[94px] bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.055),transparent_62%)]";
