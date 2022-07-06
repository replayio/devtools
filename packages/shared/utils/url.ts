export function hasFlag(flagName: string): boolean {
  if (typeof window !== "undefined") {
    const url = new URL(window.location.href);
    return url.searchParams.has(flagName);
  }
  return false;
}
