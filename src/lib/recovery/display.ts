export function getRecoveryColor(value: number): string {
  const normalized = Math.max(0, Math.min(100, value));

  if (normalized <= 35) {
    const hue = (normalized / 35) * 30;
    return `hsl(${hue}, 85%, 50%)`;
  }

  if (normalized <= 65) {
    const hue = 30 + ((normalized - 35) / 30) * 40;
    return `hsl(${hue}, 80%, 52%)`;
  }

  const hue = 70 + ((normalized - 65) / 35) * 70;
  return `hsl(${hue}, 88%, 52%)`;
}
