export function formatHitCount(count: number): string {
  if (count === 10000) {
    return "10k+";
  } else if (count < 1000) {
    return `${count}`;
  } else {
    return `${Math.round(count / 100) / 10}k`;
  }
}
