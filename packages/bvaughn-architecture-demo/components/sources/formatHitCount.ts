export function formatHitCount(count: number): string {
  if (count === 10_000) {
    return "10k+";
  } else if (count < 1_000) {
    return `${count}`;
  } else {
    return `${Math.round(count / 100) / 10}k`;
  }
}
