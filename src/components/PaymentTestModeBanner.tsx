import { getPaddleEnvironment } from "@/lib/paddle";

export function PaymentTestModeBanner() {
  if (getPaddleEnvironment() !== "sandbox") return null;
  return (
    <div className="w-full bg-amber-500/10 border-b border-amber-500/30 px-4 py-1.5 text-center text-[11px] text-amber-300">
      Test mode — no real charges.{" "}
      <a
        href="https://docs.lovable.dev/features/payments#test-and-live-environments"
        target="_blank"
        rel="noopener noreferrer"
        className="underline"
      >
        Learn more
      </a>
    </div>
  );
}
